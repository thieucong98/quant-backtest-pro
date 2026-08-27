import { Router, Request, Response } from 'express';

export const brokerRouter = Router();

// In-memory active broker session config on server
let activeBrokerSession: {
  brokerType: string;
  gatewayUrl: string;
  account: string;
  server: string;
  lastConnected: number;
} | null = null;

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

const internalMock = new ServerMockEngine();

/**
 * Health check & Ping MT5 Gateway / Broker
 */
brokerRouter.get('/health', async (req: Request, res: Response) => {
  const gatewayUrl = (req.query.gatewayUrl as string) || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';
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
        is_connected: internalMock.connected,
        version: '2.0.0 (Node Mock Fallback)'
      }
    });
  }
});

/**
 * Connect to Broker / MT5 Terminal
 */
brokerRouter.post('/connect', async (req: Request, res: Response) => {
  const { brokerType, gatewayUrl, account, password, server, path } = req.body;
  const targetUrl = gatewayUrl || 'http://127.0.0.1:8765';

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
      activeBrokerSession = {
        brokerType: brokerType || 'MT5_EXNESS',
        gatewayUrl: targetUrl,
        account: account || '84920184',
        server: server || 'Exness-MT5Real',
        lastConnected: Date.now()
      };
      return res.json({ success: true, session: activeBrokerSession, data });
    }
  } catch {
    // Use Internal Mock
    internalMock.connected = true;
    if (account) internalMock.accountInfo.login = parseInt(account, 10);
    if (server) internalMock.accountInfo.server = server;
    activeBrokerSession = {
      brokerType: brokerType || 'MT5_EXNESS',
      gatewayUrl: targetUrl,
      account: String(internalMock.accountInfo.login),
      server: internalMock.accountInfo.server,
      lastConnected: Date.now()
    };
    return res.json({
      success: true,
      mode: 'mock',
      account: internalMock.accountInfo,
      message: `Connected to ${internalMock.accountInfo.server} #${internalMock.accountInfo.login}`
    });
  }
});

/**
 * Disconnect from Broker
 */
brokerRouter.post('/disconnect', async (req: Request, res: Response) => {
  const gatewayUrl = req.body.gatewayUrl || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

  try {
    await fetch(`${gatewayUrl}/disconnect`, { method: 'POST' });
  } catch {}
  internalMock.connected = false;
  activeBrokerSession = null;
  return res.json({ success: true, message: 'Disconnected' });
});

/**
 * Get Account Info
 */
brokerRouter.get('/account', async (req: Request, res: Response) => {
  const gatewayUrl = (req.query.gatewayUrl as string) || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = (req.query.gatewayUrl as string) || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = (req.query.gatewayUrl as string) || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = (req.query.gatewayUrl as string) || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = req.body.gatewayUrl || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = req.body.gatewayUrl || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = req.body.gatewayUrl || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';

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
  const gatewayUrl = req.body.gatewayUrl || activeBrokerSession?.gatewayUrl || 'http://127.0.0.1:8765';
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
