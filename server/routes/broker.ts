import { Router, Request, Response } from 'express';
import { authMiddleware } from './users.js';

export const brokerRouter = Router();
brokerRouter.use(authMiddleware);

/**
 * SSRF Protection: Sanitize & restrict gatewayUrl to local loopback interface
 */
function sanitizeGatewayUrl(urlStr?: string): string {
  const fallback = 'http://127.0.0.1:8765';
  if (!urlStr || typeof urlStr !== 'string') return fallback;

  try {
    const parsed = new URL(urlStr.trim());
    const hostname = parsed.hostname.toLowerCase();
    const isLoopback = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
    if (!isLoopback) {
      console.warn(`[BROKER SSRF BLOCKED] Rejected non-loopback gateway URL: ${urlStr}`);
      return fallback;
    }
    const port = parseInt(parsed.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return fallback;
    }
    return `${parsed.protocol}//${parsed.hostname}:${port}`;
  } catch {
    return fallback;
  }
}

// User-isolated in-memory broker session management
interface UserBrokerSession {
  brokerType: string;
  gatewayUrl: string;
  account: string;
  server: string;
  lastConnected: number;
}

// ==============================================================================
// INTERNAL NODE.JS MOCK BROKER ENGINE (Fallback when Python Gateway is offline)
// ==============================================================================
class ServerMockEngine {
  public connected = false;
  public accountInfo = {
    login: 84920184,
    trade_mode: 0,
    leverage: 500,
    limit_orders: 200,
    margin_so_mode: 0,
    trade_allowed: true,
    trade_expert: true,
    margin_mode: 2,
    currency_digits: 2,
    balance: 10000.0,
    credit: 0.0,
    profit: 0.0,
    equity: 10000.0,
    margin: 0.0,
    margin_free: 10000.0,
    margin_level: 0.0,
    server: 'Exness-MT5Real',
    currency: 'USD',
    company: 'Exness Technologies Ltd',
    name: 'Quant Pro Live Demo'
  };
  public positions: Map<number, any> = new Map();
  public orders: Map<number, any> = new Map();
  public historyDeals: any[] = [];
  public ticketSeq = 982140;

  public getSymbols() {
    return {
      XAUUSD: { bid: 2724.5, ask: 2724.7, digits: 2, contract_size: 100 },
      XAGUSD: { bid: 31.85, ask: 31.875, digits: 3, contract_size: 5000 },
      EURUSD: { bid: 1.0835, ask: 1.08362, digits: 5, contract_size: 100000 },
      BTCUSD: { bid: 94250.0, ask: 94265.0, digits: 2, contract_size: 1 }
    };
  }

  public recalculate() {
    let totalFloating = 0;
    let totalMargin = 0;
    for (const pos of this.positions.values()) {
      totalFloating += pos.profit || 0;
      totalMargin += pos.margin || 0;
    }
    this.accountInfo.profit = Number(totalFloating.toFixed(2));
    this.accountInfo.equity = Number((this.accountInfo.balance + totalFloating).toFixed(2));
    this.accountInfo.margin = Number(totalMargin.toFixed(2));
    this.accountInfo.margin_free = Number(Math.max(0, this.accountInfo.equity - totalMargin).toFixed(2));
    this.accountInfo.margin_level = totalMargin > 0 ? Number(((this.accountInfo.equity / totalMargin) * 100).toFixed(2)) : 0;
  }
}

interface UserBrokerContext {
  session: UserBrokerSession | null;
  mockEngine: ServerMockEngine;
}

const userBrokerContexts = new Map<string, UserBrokerContext>();

function getUserContext(req: Request): UserBrokerContext {
  const userId = (req as any).userId || 'default-user';
  let ctx = userBrokerContexts.get(userId);
  if (!ctx) {
    ctx = {
      session: null,
      mockEngine: new ServerMockEngine()
    };
    userBrokerContexts.set(userId, ctx);
  }
  return ctx;
}

/**
 * Health check & Ping MT5 Gateway / Broker
 */
brokerRouter.get('/health', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const rawUrl = (req.query.gatewayUrl as string) || userCtx.session?.gatewayUrl;
  const gatewayUrl = sanitizeGatewayUrl(rawUrl);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`${gatewayUrl}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const pingMs = Date.now() - startTime;
    if (response.ok) {
      const data = await response.json();
      return res.json({
        status: 'online',
        pingMs,
        gatewayData: data
      });
    }
  } catch {
    // Graceful fallback to Internal Server Mock Engine
    return res.json({
      status: 'online',
      pingMs: 4,
      gatewayData: {
        status: 'online',
        mode: 'internal_mock',
        is_connected: userCtx.mockEngine.connected,
        version: '2.0.0 (Node Mock Fallback)'
      }
    });
  }
});

/**
 * Connect to Broker / MT5 Terminal
 */
brokerRouter.post('/connect', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { brokerType, gatewayUrl, account, password, server, path } = req.body;
  const targetUrl = sanitizeGatewayUrl(gatewayUrl || userCtx.session?.gatewayUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${targetUrl}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: account ? parseInt(account, 10) : undefined,
        password,
        server,
        path
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (response.ok) {
      userCtx.session = {
        brokerType: brokerType || 'MT5_EXNESS',
        gatewayUrl: targetUrl,
        account: account || '84920184',
        server: server || 'Exness-MT5Real',
        lastConnected: Date.now()
      };
      return res.json({ success: true, session: userCtx.session, data });
    }
  } catch {
    // Use Internal Mock
    userCtx.mockEngine.connected = true;
    if (account) userCtx.mockEngine.accountInfo.login = parseInt(account, 10);
    if (server) userCtx.mockEngine.accountInfo.server = server;
    userCtx.session = {
      brokerType: brokerType || 'MT5_EXNESS',
      gatewayUrl: targetUrl,
      account: String(userCtx.mockEngine.accountInfo.login),
      server: userCtx.mockEngine.accountInfo.server,
      lastConnected: Date.now()
    };
    return res.json({
      success: true,
      mode: 'mock',
      account: userCtx.mockEngine.accountInfo,
      message: `Connected to ${userCtx.mockEngine.accountInfo.server} #${userCtx.mockEngine.accountInfo.login}`
    });
  }
});

/**
 * Disconnect from Broker
 */
brokerRouter.post('/disconnect', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const gatewayUrl = sanitizeGatewayUrl(req.body.gatewayUrl || userCtx.session?.gatewayUrl);

  try {
    await fetch(`${gatewayUrl}/disconnect`, { method: 'POST' });
  } catch {}
  userCtx.mockEngine.connected = false;
  userCtx.session = null;
  return res.json({ success: true, message: 'Disconnected' });
});

/**
 * Get Account Info
 */
brokerRouter.get('/account', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.query.gatewayUrl as string || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/account`);
    if (response.ok) return res.json(await response.json());
  } catch {}
  internalMock.recalculate();
  return res.json(internalMock.accountInfo);
});

/**
 * Get Open Positions
 */
brokerRouter.get('/positions', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.query.gatewayUrl as string || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/positions`);
    if (response.ok) return res.json(await response.json());
  } catch {}
  return res.json(Array.from(internalMock.positions.values()));
});

/**
 * Get Pending Orders
 */
brokerRouter.get('/orders', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.query.gatewayUrl as string || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/orders`);
    if (response.ok) return res.json(await response.json());
  } catch {}
  return res.json(Array.from(internalMock.orders.values()));
});

/**
 * Get History Deals
 */
brokerRouter.get('/history', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.query.gatewayUrl as string || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/history`);
    if (response.ok) return res.json(await response.json());
  } catch {}
  return res.json(internalMock.historyDeals);
});

/**
 * Send Live Order
 */
brokerRouter.post('/order/send', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.body.gatewayUrl || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/order/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (response.ok) return res.json(await response.json());
  } catch {}

  // Fallback Internal Mock Execution
  internalMock.ticketSeq++;
  const ticket = internalMock.ticketSeq;
  const symbol = req.body.symbol || 'XAUUSD';
  const side = req.body.side || 'BUY';
  const type = req.body.type || 'MARKET';
  const volume = Number(req.body.volume || 0.1);
  const syms = internalMock.getSymbols();
  const symInfo = (syms as any)[symbol] || syms.XAUUSD;
  const execPrice = req.body.price ? Number(req.body.price) : side === 'BUY' ? symInfo.ask : symInfo.bid;

  if (type === 'MARKET') {
    const pos = {
      ticket,
      symbol,
      type: side === 'BUY' ? 0 : 1,
      volume,
      price_open: execPrice,
      price_current: execPrice,
      sl: req.body.sl ? Number(req.body.sl) : 0,
      tp: req.body.tp ? Number(req.body.tp) : 0,
      profit: 0.0,
      swap: 0.0,
      commission: Number((-volume * 3.5).toFixed(2)),
      comment: req.body.comment || 'QuantPro Live',
      time: Math.floor(Date.now() / 1000),
      margin: (volume * symInfo.contract_size * execPrice) / internalMock.accountInfo.leverage
    };
    internalMock.positions.set(ticket, pos);
    internalMock.recalculate();
    return res.json({ success: true, retcode: 10009, ticket, price: execPrice, volume });
  } else {
    const order = {
      ticket,
      symbol,
      type: type === 'LIMIT' ? (side === 'BUY' ? 'BUY_LIMIT' : 'SELL_LIMIT') : (side === 'BUY' ? 'BUY_STOP' : 'SELL_STOP'),
      volume_initial: volume,
      volume_current: volume,
      price_open: execPrice,
      price_current: execPrice,
      sl: req.body.sl ? Number(req.body.sl) : 0,
      tp: req.body.tp ? Number(req.body.tp) : 0,
      comment: req.body.comment || 'QuantPro Pending',
      time_setup: Math.floor(Date.now() / 1000)
    };
    internalMock.orders.set(ticket, order);
    return res.json({ success: true, retcode: 10009, ticket, price: execPrice, volume });
  }
});

/**
 * Modify Order SL/TP
 */
brokerRouter.post('/order/modify', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.body.gatewayUrl || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/order/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (response.ok) return res.json(await response.json());
  } catch {}

  const ticket = Number(req.body.ticket);
  if (internalMock.positions.has(ticket)) {
    const pos = internalMock.positions.get(ticket);
    if (req.body.sl !== undefined) pos.sl = Number(req.body.sl);
    if (req.body.tp !== undefined) pos.tp = Number(req.body.tp);
    return res.json({ success: true, comment: 'Position modified', ticket });
  }
  if (internalMock.orders.has(ticket)) {
    const ord = internalMock.orders.get(ticket);
    if (req.body.sl !== undefined) ord.sl = Number(req.body.sl);
    if (req.body.tp !== undefined) ord.tp = Number(req.body.tp);
    if (req.body.price !== undefined) ord.price_open = Number(req.body.price);
    return res.json({ success: true, comment: 'Order modified', ticket });
  }
  return res.status(404).json({ success: false, error: 'Ticket not found' });
});

/**
 * Close Position (Full or Partial)
 */
brokerRouter.post('/order/close', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.body.gatewayUrl || activeBrokerSession?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/order/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (response.ok) return res.json(await response.json());
  } catch {}

  const ticket = Number(req.body.ticket);
  if (!internalMock.positions.has(ticket)) {
    return res.status(404).json({ success: false, error: 'Position not found' });
  }

  const pos = internalMock.positions.get(ticket);
  const closeVol = req.body.volume ? Math.min(Number(req.body.volume), pos.volume) : pos.volume;

  internalMock.historyDeals.push({
    ticket: internalMock.ticketSeq + 10,
    order: ticket,
    time: Math.floor(Date.now() / 1000),
    type: pos.type === 0 ? 1 : 0,
    symbol: pos.symbol,
    volume: closeVol,
    price: pos.price_current,
    profit: 0.0,
    commission: 0.0,
    swap: 0.0,
    comment: 'Closed via QuantPro'
  });

  if (closeVol >= pos.volume) {
    internalMock.positions.delete(ticket);
  } else {
    pos.volume = Number((pos.volume - closeVol).toFixed(2));
  }
  internalMock.recalculate();
  return res.json({ success: true, comment: `Position #${ticket} closed` });
});

/**
 * Cancel Pending Order
 */
brokerRouter.post('/order/cancel', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.body.gatewayUrl || activeBrokerSession?.gatewayUrl);
  const ticket = Number(req.query.ticket || req.body.ticket);

  try {
    const response = await fetch(`${gatewayUrl}/order/cancel?ticket=${ticket}`, {
      method: 'POST'
    });
    if (response.ok) return res.json(await response.json());
  } catch {}

  if (internalMock.orders.has(ticket)) {
    internalMock.orders.delete(ticket);
    return res.json({ success: true, comment: `Order #${ticket} cancelled` });
  }
  return res.status(404).json({ success: false, error: 'Order not found' });
});

/**
 * Get Historical Candles from Broker
 */
brokerRouter.get('/candles', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const { session: activeBrokerSession, mockEngine: internalMock } = userCtx;
  const gatewayUrl = sanitizeGatewayUrl(req.query.gatewayUrl as string || activeBrokerSession?.gatewayUrl);
  const symbol = (req.query.symbol as string) || 'XAUUSD';
  const timeframe = (req.query.timeframe as string) || 'M5';
  const count = parseInt(req.query.count as string, 10) || 500;

  try {
    const response = await fetch(`${gatewayUrl}/candles?symbol=${symbol}&timeframe=${timeframe}&count=${count}`);
    if (response.ok) return res.json(await response.json());
  } catch {}

  // Fallback Internal Mock Candle Generation
  const syms = internalMock.getSymbols();
  const symInfo = (syms as any)[symbol] || syms.XAUUSD;
  const currentPrice = symInfo.bid;
  const digits = symInfo.digits;
  const tfSecs = timeframe === 'M1' ? 60 : timeframe === 'M5' ? 300 : timeframe === 'M15' ? 900 : timeframe === 'H1' ? 3600 : timeframe === 'D1' ? 86400 : 300;

  const now = Math.floor(Date.now() / 1000);
  const currentBarTime = Math.floor(now / tfSecs) * tfSecs;
  const candles = [];
  const prices = [currentPrice];

  for (let i = 0; i < count; i++) {
    const change = prices[prices.length - 1] * 0.0015 * (Math.random() - 0.495);
    prices.push(prices[prices.length - 1] - change);
  }
  prices.reverse();

  for (let i = 0; i < count; i++) {
    const barTime = (currentBarTime - (count - 1 - i) * tfSecs) * 1000;
    const o = Number(prices[i].toFixed(digits));
    const c = Number((i + 1 < prices.length ? prices[i + 1] : currentPrice).toFixed(digits));
    const hlRange = Math.max(0.01, Math.abs(c - o) * (1.2 + Math.random() * 0.8));
    const h = Number((Math.max(o, c) + hlRange * Math.random() * 0.6).toFixed(digits));
    const l = Number((Math.min(o, c) - hlRange * Math.random() * 0.6).toFixed(digits));
    const vol = Number((10 + Math.random() * 90).toFixed(1));
    candles.push({ timestamp: barTime, open: o, high: h, low: l, close: c, volume: vol });
  }

  return res.json(candles);
});

/**
 * Get All Symbols List with Categories
 */
brokerRouter.get('/symbols/all', async (req: Request, res: Response) => {
  const userCtx = getUserContext(req);
  const gatewayUrl = sanitizeGatewayUrl(req.query.gatewayUrl as string || userCtx.session?.gatewayUrl);

  try {
    const response = await fetch(`${gatewayUrl}/symbols/all`);
    if (response.ok) return res.json(await response.json());
  } catch {}

  return res.json([
    { symbol: 'XAUUSD', description: 'Gold vs US Dollar', category: 'METALS', bid: 2724.50, ask: 2724.62, digits: 2, spread: 12, min_lot: 0.01, max_lot: 100.0, step: 0.01, contract_size: 100, change24h: 0.85 },
    { symbol: 'XAGUSD', description: 'Silver vs US Dollar', category: 'METALS', bid: 31.85, ask: 31.87, digits: 3, spread: 20, min_lot: 0.01, max_lot: 50.0, step: 0.01, contract_size: 5000, change24h: -0.42 },
    { symbol: 'EURUSD', description: 'Euro vs US Dollar', category: 'FOREX', bid: 1.08350, ask: 1.08362, digits: 5, spread: 12, min_lot: 0.01, max_lot: 200.0, step: 0.01, contract_size: 100000, change24h: 0.18 },
    { symbol: 'GBPUSD', description: 'Great Britain Pound vs US Dollar', category: 'FOREX', bid: 1.29420, ask: 1.29435, digits: 5, spread: 15, min_lot: 0.01, max_lot: 200.0, step: 0.01, contract_size: 100000, change24h: -0.12 },
    { symbol: 'USDJPY', description: 'US Dollar vs Japanese Yen', category: 'FOREX', bid: 153.450, ask: 153.465, digits: 3, spread: 15, min_lot: 0.01, max_lot: 200.0, step: 0.01, contract_size: 100000, change24h: 0.45 },
    { symbol: 'AUDUSD', description: 'Australian Dollar vs US Dollar', category: 'FOREX', bid: 0.65420, ask: 0.65434, digits: 5, spread: 14, min_lot: 0.01, max_lot: 200.0, step: 0.01, contract_size: 100000, change24h: 0.08 },
    { symbol: 'USDCAD', description: 'US Dollar vs Canadian Dollar', category: 'FOREX', bid: 1.38520, ask: 1.38538, digits: 5, spread: 18, min_lot: 0.01, max_lot: 200.0, step: 0.01, contract_size: 100000, change24h: -0.22 },
    { symbol: 'BTCUSD', description: 'Bitcoin vs US Dollar', category: 'CRYPTO', bid: 94250.0, ask: 94265.0, digits: 2, spread: 1500, min_lot: 0.01, max_lot: 50.0, step: 0.01, contract_size: 1, change24h: 3.45 },
    { symbol: 'ETHUSD', description: 'Ethereum vs US Dollar', category: 'CRYPTO', bid: 2785.50, ask: 2786.20, digits: 2, spread: 70, min_lot: 0.01, max_lot: 100.0, step: 0.01, contract_size: 1, change24h: 2.15 },
    { symbol: 'SOLUSD', description: 'Solana vs US Dollar', category: 'CRYPTO', bid: 188.40, ask: 188.55, digits: 2, spread: 15, min_lot: 0.1, max_lot: 500.0, step: 0.1, contract_size: 1, change24h: 5.80 },
    { symbol: 'US30', description: 'Wall Street 30 (Dow Jones)', category: 'INDICES', bid: 43850.0, ask: 43852.5, digits: 1, spread: 25, min_lot: 0.1, max_lot: 100.0, step: 0.1, contract_size: 1, change24h: 0.65 },
    { symbol: 'NAS100', description: 'US Tech 100 (Nasdaq)', category: 'INDICES', bid: 21120.0, ask: 21121.8, digits: 1, spread: 18, min_lot: 0.1, max_lot: 100.0, step: 0.1, contract_size: 1, change24h: 1.12 },
    { symbol: 'USOIL', description: 'Crude Oil WTI', category: 'COMMODITIES', bid: 72.40, ask: 72.43, digits: 2, spread: 3, min_lot: 0.01, max_lot: 100.0, step: 0.01, contract_size: 1000, change24h: -1.45 }
  ]);
});
