/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * Institutional Execution Bridge Daemon Socket Protocol & Driver Contracts
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Daedalus (CTO / Principal System Architect)
 */

import {
  BrokerType,
  BrokerConnectionStatus,
  BrokerAccount,
  BrokerPosition,
  BrokerOrder,
  BrokerDeal,
  BrokerConfig,
  UnifiedOrderRequest,
  UnifiedModifyRequest,
  UnifiedCloseRequest,
  LiveTickUpdate,
} from './broker';

// =============================================================================
// 1. Bridge WebSocket Wire Protocol (`ws://127.0.0.1:8766/stream`)
// =============================================================================

export type BridgeMessageType =
  | 'AUTH_REQUEST'
  | 'AUTH_RESPONSE'
  | 'ORDER_SUBMIT'
  | 'ORDER_EXECUTION_REPORT'
  | 'ORDER_CANCEL'
  | 'POSITION_UPDATE'
  | 'ACCOUNT_SNAPSHOT'
  | 'LIVE_TICK'
  | 'HEARTBEAT_PING'
  | 'HEARTBEAT_PONG'
  | 'CIRCUIT_BREAKER_ALERT'
  | 'BRIDGE_ERROR';

export interface BridgeWsMessage<T = unknown> {
  /** UUIDv7 unique correlation identifier */
  id: string;
  type: BridgeMessageType;
  timestamp: number;
  payload: T;
  /** HMAC-SHA256 signature for mutual authentication */
  signature?: string;
}

// Client -> Daemon Command Payloads
export interface BridgeAuthRequestPayload {
  token: string;
  clientVersion: string;
}

export interface BridgeOrderSubmitPayload {
  clientOrderId: string;
  order: UnifiedOrderRequest;
  broker: BrokerType;
  maxSlippagePips?: number;
}

export interface BridgeOrderCancelPayload {
  ticket: string | number;
  broker: BrokerType;
}

// Daemon -> Client Event Payloads
export interface BridgeAuthResponsePayload {
  authenticated: boolean;
  daemonVersion: string;
  uptimeSeconds: number;
  activeBrokers: BrokerType[];
  serverTime: number;
}

export interface BridgeExecutionReportPayload {
  clientOrderId: string;
  brokerTicket: string | number;
  broker: BrokerType;
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'REJECTED' | 'CANCELLED';
  symbol: string;
  side: 'BUY' | 'SELL';
  executedLotSize: number;
  executedPrice: number;
  commission: number;
  slippagePips: number;
  timestamp: number;
  message?: string;
}

export interface BridgeCircuitBreakerPayload {
  broker: BrokerType;
  reason: 'EXCESSIVE_LATENCY' | 'MAX_DAILY_LOSS_BREACH' | 'MAX_OPEN_LOTS_EXCEEDED' | 'CONNECTION_DROP';
  measuredLatencyMs?: number;
  currentDrawdownPct?: number;
  message: string;
  timestamp: number;
}

// =============================================================================
// 2. Webhook Ingestion Protocol (`POST http://127.0.0.1:8766/v1/webhook`)
// =============================================================================

export interface WebhookOrderPayload {
  /** Shared secret or HMAC passphrase configured in daemon */
  passphrase: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  quantity?: number; // Lots or contracts
  riskPercent?: number; // Optional risk % calculation
  price?: number;
  sl?: number;
  tp?: number;
  broker?: BrokerType;
  clientOrderId?: string;
  magicNumber?: number;
  comment?: string;
}

export interface WebhookIngestResponse {
  success: boolean;
  clientOrderId: string;
  ticket?: string | number;
  executedPrice?: number;
  error?: string;
  executionTimeMs: number;
}

// =============================================================================
// 3. Prop Firm Pre-Trade Risk Shield Interceptor Contracts
// =============================================================================

export interface PropFirmShieldRules {
  /** Maximum allowable daily loss percentage (e.g. 5.0 for 5%) */
  maxDailyLossPct: number;
  /** Maximum allowable total high-water-mark drawdown percentage (e.g. 10.0 for 10%) */
  maxTrailingDrawdownPct: number;
  /** Maximum cumulative open lot exposure across all active positions */
  maxTotalOpenLots: number;
  /** Maximum single order lot size */
  maxOrderLotSize: number;
  /** Restrict trading within N minutes of high-impact economic news */
  newsRestrictionMinutes: number;
  /** Reject orders if network round-trip latency to broker exceeds threshold (ms) */
  maxAllowedLatencyMs: number;
  /** Force close and reject new orders ahead of Friday market close */
  weekendHoldingRestriction: boolean;
}

export interface PreTradeRiskEvaluationResult {
  allowed: boolean;
  ruleViolated?:
    | 'MAX_DAILY_LOSS_BREACH'
    | 'MAX_TRAILING_DRAWDOWN_BREACH'
    | 'MAX_OPEN_LOTS_EXCEEDED'
    | 'MAX_ORDER_LOT_SIZE_EXCEEDED'
    | 'NEWS_WINDOW_RESTRICTION'
    | 'CIRCUIT_BREAKER_LATENCY_EXCEEDED'
    | 'WEEKEND_HOLDING_RESTRICTION'
    | 'IDEMPOTENT_DUPLICATE_ORDER';
  reason?: string;
  projectedRiskAmount?: number;
}

export interface CircuitBreakerStatus {
  isActive: boolean;
  broker: BrokerType;
  lastTripTimestamp: number | null;
  resetScheduledAt: number | null;
  consecutiveTimeouts: number;
  averageLatencyMs: number;
}

// =============================================================================
// 4. Universal Broker Driver Adapter Interface (`IBrokerDriver`)
// =============================================================================

export interface IBrokerDriver {
  readonly brokerType: BrokerType;
  readonly isConnected: boolean;
  readonly lastHeartbeat: number;

  /** Initialize driver connection with credentials and socket gateway */
  connect(config: BrokerConfig): Promise<void>;

  /** Cleanly tear down driver session and active market data streams */
  disconnect(): Promise<void>;

  /** Fetch current account equity, balance, margin, and ping metrics */
  getAccount(): Promise<BrokerAccount>;

  /** Fetch open positions from broker */
  getPositions(): Promise<BrokerPosition[]>;

  /** Fetch active pending orders from broker */
  getOrders(): Promise<BrokerOrder[]>;

  /** Submit unified market or pending order */
  submitOrder(request: UnifiedOrderRequest & { clientOrderId: string }): Promise<BrokerDeal>;

  /** Modify stop loss, take profit, or trigger price of an existing order/position */
  modifyOrder(request: UnifiedModifyRequest): Promise<boolean>;

  /** Cancel an active pending order by ticket */
  cancelOrder(ticket: string | number): Promise<boolean>;

  /** Close an active position entirely or partially */
  closePosition(request: UnifiedCloseRequest): Promise<BrokerDeal>;

  /** Subscribe to live tick stream for specified symbols */
  subscribeMarketData(symbols: string[], callback: (tick: LiveTickUpdate) => void): void;

  /** Unsubscribe from live market data stream */
  unsubscribeMarketData(symbols: string[]): void;

  /** Query health and latency to broker host */
  checkLatency(): Promise<number>;
}

// =============================================================================
// 5. Bridge Daemon HTTP REST Endpoints Specifications
// =============================================================================

export interface BridgeDaemonStatus {
  isRunning: boolean;
  version: string;
  uptimeSeconds: number;
  activeBroker: BrokerType;
  connectionStatus: BrokerConnectionStatus;
  roundTripLatencyMs: number;
  circuitBreakerActive: boolean;
  queuedOrderCount: number;
  dailyPnL: number;
  dailyLossLimitRemaining: number;
  totalExecutionsToday: number;
}
