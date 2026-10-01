/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * Quant Execution Bridge (QEB) Daemon Core
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Port: 8766
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import {
  BridgeWsMessage,
  BridgeDaemonStatus,
  WebhookOrderPayload,
  WebhookIngestResponse,
  IBrokerDriver,
} from '../src/types/executionBridge';
import { BrokerType, BrokerConfig, UnifiedOrderRequest } from '../src/types/broker';
import { PreTradeRiskShieldInterceptor } from './security/riskInterceptor';
import { BinanceDriver } from './drivers/BinanceDriver';
import { BybitDriver } from './drivers/BybitDriver';
import { IBKRDriver } from './drivers/IBKRDriver';
import { MetaTraderDriver } from './drivers/MetaTraderDriver';

export interface DaemonConfig {
  port?: number;
  host?: string;
  passphrase?: string;
  authToken?: string;
  defaultBroker?: BrokerType;
}

export class QuantExecutionBridgeDaemon {
  public readonly port: number;
  public readonly host: string;
  public readonly passphrase: string;
  public readonly authToken: string;

  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private isRunning: boolean = false;
  private startTime: number = 0;

  private drivers: Map<BrokerType, IBrokerDriver> = new Map();
  private activeBroker: BrokerType = 'MT5_EXNESS';
  private riskInterceptor: PreTradeRiskShieldInterceptor;

  private totalExecutionsToday: number = 0;
  private dailyPnL: number = 0;

  constructor(config: DaemonConfig = {}) {
    this.port = config.port ?? 8766;
    this.host = config.host ?? '127.0.0.1';
    this.passphrase = config.passphrase ?? 'quant_pro_secret_2026';
    this.authToken = config.authToken ?? 'qeb_token_default';
    this.activeBroker = config.defaultBroker ?? 'MT5_EXNESS';

    this.riskInterceptor = new PreTradeRiskShieldInterceptor(
      {},
      100000,
      this.activeBroker
    );

    // Initialize all 4 drivers
    this.drivers.set('BINANCE', new BinanceDriver());
    this.drivers.set('BYBIT', new BybitDriver());
    this.drivers.set('INTERACTIVE_BROKERS', new IBKRDriver());
    this.drivers.set('MT5_EXNESS', new MetaTraderDriver('MT5_EXNESS'));
    this.drivers.set('CUSTOM_MT5', new MetaTraderDriver('CUSTOM_MT5'));
  }

  public getActiveDriver(): IBrokerDriver {
    const driver = this.drivers.get(this.activeBroker);
    if (!driver) {
      throw new Error(`Driver for broker ${this.activeBroker} not registered`);
    }
    return driver;
  }

  public setBroker(broker: BrokerType): void {
    if (!this.drivers.has(broker)) {
      throw new Error(`Broker ${broker} is not supported`);
    }
    this.activeBroker = broker;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    // Connect active driver
    const driver = this.getActiveDriver();
    await driver.connect({
      brokerType: this.activeBroker,
      gatewayUrl: 'http://127.0.0.1:8765',
      account: 'default-account',
      autoReconnect: true,
      positionMode: 'HEDGING',
    });
    const acc = await driver.getAccount();
    this.riskInterceptor.updateDailyBaseline(acc.balance);

    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    this.wss = new WebSocketServer({ server: this.server, path: '/stream' });
    this.setupWebSocketServer(this.wss);

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, this.host, () => {
        this.isRunning = true;
        this.startTime = Date.now();
        resolve();
      });
      this.server!.once('error', reject);
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.wss) {
      for (const client of this.wss.clients) {
        client.terminate();
      }
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }

    for (const driver of this.drivers.values()) {
      if (driver.isConnected) {
        await driver.disconnect();
      }
    }

    this.isRunning = false;
  }

  public getStatus(): BridgeDaemonStatus {
    const driver = this.getActiveDriver();
    const cb = this.riskInterceptor.getCircuitBreakerStatus();
    const uptime = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    return {
      isRunning: this.isRunning,
      version: '2.0.0-enterprise',
      uptimeSeconds: uptime,
      activeBroker: this.activeBroker,
      connectionStatus: driver.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      roundTripLatencyMs: cb.averageLatencyMs,
      circuitBreakerActive: cb.isActive,
      queuedOrderCount: 0,
      dailyPnL: this.dailyPnL,
      dailyLossLimitRemaining: 5000 + this.dailyPnL,
      totalExecutionsToday: this.totalExecutionsToday,
    };
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && (pathname === '/health' || pathname === '/v1/status')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getStatus()));
      return;
    }

    if (req.method === 'GET' && pathname === '/v1/account') {
      this.getActiveDriver()
        .getAccount()
        .then((acc) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(acc));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
      return;
    }

    if (req.method === 'GET' && pathname === '/v1/positions') {
      this.getActiveDriver()
        .getPositions()
        .then((pos) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(pos));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
      return;
    }

    if (req.method === 'GET' && pathname === '/v1/orders') {
      this.getActiveDriver()
        .getOrders()
        .then((orders) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(orders));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
      return;
    }

    if (req.method === 'POST' && pathname === '/v1/circuit-breaker/reset') {
      this.riskInterceptor.resetCircuitBreaker();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Circuit breaker reset.' }));
      return;
    }

    if (req.method === 'POST' && pathname === '/v1/webhook') {
      this.readJsonBody<WebhookOrderPayload>(req, async (err, payload) => {
        if (err || !payload) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
          return;
        }

        const tStart = Date.now();

        // 1. Passphrase check
        if (payload.passphrase !== this.passphrase) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid webhook passphrase' }));
          return;
        }

        const driver = payload.broker ? (this.drivers.get(payload.broker) || this.getActiveDriver()) : this.getActiveDriver();
        const clientOrderId = payload.clientOrderId || `wh_${randomUUID().slice(0, 8)}`;

        try {
          if (payload.action === 'CLOSE') {
            const positions = await driver.getPositions();
            const targetPos = positions.find((p) => p.symbol === payload.symbol);
            if (!targetPos) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: `No active position for ${payload.symbol}` }));
              return;
            }
            const deal = await driver.closePosition({ ticket: targetPos.ticket });
            const response: WebhookIngestResponse = {
              success: true,
              clientOrderId,
              ticket: deal.ticket,
              executedPrice: deal.price,
              executionTimeMs: Date.now() - tStart,
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            return;
          }

          // 2. Pre-Trade Risk Shield Interception
          const account = await driver.getAccount();
          const positions = await driver.getPositions();

          const orderRequest: UnifiedOrderRequest & { clientOrderId: string } = {
            clientOrderId,
            symbol: payload.symbol,
            side: payload.action,
            type: payload.orderType,
            lotSize: payload.quantity || 1.0,
            price: payload.price,
            sl: payload.sl,
            tp: payload.tp,
            comment: payload.comment || 'TradingView Webhook',
          };

          const riskResult = this.riskInterceptor.evaluatePreTradeRisk({
            order: orderRequest,
            currentAccount: account,
            openPositions: positions,
          });

          if (!riskResult.allowed) {
            res.writeHead(422, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              clientOrderId,
              error: `Pre-Trade Risk Shield Rejected: ${riskResult.ruleViolated} - ${riskResult.reason}`,
              executionTimeMs: Date.now() - tStart,
            }));
            return;
          }

          // 3. Dispatch to driver
          const deal = await driver.submitOrder(orderRequest);
          this.totalExecutionsToday++;

          const response: WebhookIngestResponse = {
            success: true,
            clientOrderId,
            ticket: deal.ticket,
            executedPrice: deal.price,
            executionTimeMs: Date.now() - tStart,
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (execErr: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            clientOrderId,
            error: execErr?.message || String(execErr),
            executionTimeMs: Date.now() - tStart,
          }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }

  private setupWebSocketServer(wss: WebSocketServer): void {
    wss.on('connection', (ws: WebSocket) => {
      let isAuthenticated = false;

      ws.on('message', async (raw: string | Buffer) => {
        try {
          const msg = JSON.parse(raw.toString()) as BridgeWsMessage<any>;

          switch (msg.type) {
            case 'AUTH_REQUEST': {
              isAuthenticated = msg.payload?.token === this.authToken;
              const response: BridgeWsMessage = {
                id: randomUUID(),
                type: 'AUTH_RESPONSE',
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                  authenticated: isAuthenticated,
                  daemonVersion: '2.0.0-enterprise',
                  uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
                  activeBrokers: Array.from(this.drivers.keys()),
                  serverTime: Math.floor(Date.now() / 1000),
                },
              };
              ws.send(JSON.stringify(response));
              break;
            }

            case 'HEARTBEAT_PING': {
              const pong: BridgeWsMessage = {
                id: msg.id,
                type: 'HEARTBEAT_PONG',
                timestamp: Math.floor(Date.now() / 1000),
                payload: { pingMs: 5 },
              };
              ws.send(JSON.stringify(pong));
              break;
            }

            case 'ORDER_SUBMIT': {
              if (!isAuthenticated) {
                ws.send(JSON.stringify({
                  id: msg.id,
                  type: 'BRIDGE_ERROR',
                  timestamp: Math.floor(Date.now() / 1000),
                  payload: { message: 'Authentication required' },
                }));
                return;
              }

              const driver = msg.payload?.broker ? (this.drivers.get(msg.payload.broker) || this.getActiveDriver()) : this.getActiveDriver();
              const account = await driver.getAccount();
              const positions = await driver.getPositions();

              const orderReq = {
                ...msg.payload.order,
                clientOrderId: msg.payload.clientOrderId,
              };

              const risk = this.riskInterceptor.evaluatePreTradeRisk({
                order: orderReq,
                currentAccount: account,
                openPositions: positions,
              });

              if (!risk.allowed) {
                ws.send(JSON.stringify({
                  id: msg.id,
                  type: 'CIRCUIT_BREAKER_ALERT',
                  timestamp: Math.floor(Date.now() / 1000),
                  payload: {
                    broker: driver.brokerType,
                    reason: risk.ruleViolated,
                    message: risk.reason,
                    timestamp: Math.floor(Date.now() / 1000),
                  },
                }));
                return;
              }

              const deal = await driver.submitOrder(orderReq);
              this.totalExecutionsToday++;

              ws.send(JSON.stringify({
                id: msg.id,
                type: 'ORDER_EXECUTION_REPORT',
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                  clientOrderId: msg.payload.clientOrderId,
                  brokerTicket: deal.ticket,
                  broker: driver.brokerType,
                  status: 'FILLED',
                  symbol: deal.symbol,
                  side: deal.side,
                  executedLotSize: deal.lotSize,
                  executedPrice: deal.price,
                  commission: deal.commission,
                  slippagePips: 0,
                  timestamp: deal.time,
                },
              }));
              break;
            }

            case 'ORDER_CANCEL': {
              if (!isAuthenticated) return;
              const driver = msg.payload?.broker ? (this.drivers.get(msg.payload.broker) || this.getActiveDriver()) : this.getActiveDriver();
              const success = await driver.cancelOrder(msg.payload.ticket);
              ws.send(JSON.stringify({
                id: msg.id,
                type: 'ORDER_EXECUTION_REPORT',
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                  brokerTicket: msg.payload.ticket,
                  broker: driver.brokerType,
                  status: success ? 'CANCELLED' : 'REJECTED',
                },
              }));
              break;
            }
          }
        } catch (err: any) {
          ws.send(JSON.stringify({
            id: randomUUID(),
            type: 'BRIDGE_ERROR',
            timestamp: Math.floor(Date.now() / 1000),
            payload: { message: err?.message || String(err) },
          }));
        }
      });
    });
  }

  private readJsonBody<T>(req: http.IncomingMessage, callback: (err: any, data: T | null) => void): void {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}') as T;
        callback(null, parsed);
      } catch (err) {
        callback(err, null);
      }
    });
    req.on('error', (err) => callback(err, null));
  }
}

// -----------------------------------------------------------------------------
// Direct CLI Execution
// -----------------------------------------------------------------------------
if (process.argv[1] && process.argv[1].endsWith('daemon.ts')) {
  const daemon = new QuantExecutionBridgeDaemon();
  daemon.start().then(() => {
    console.log(`[QEB] Quant Execution Bridge Daemon running on http://${daemon.host}:${daemon.port}`);
  }).catch((err) => {
    console.error('[QEB] Daemon startup error:', err);
    process.exit(1);
  });
}
