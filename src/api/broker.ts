import {
  BrokerAccount,
  BrokerConfig,
  BrokerDeal,
  BrokerOrder,
  BrokerPosition,
  UnifiedCloseRequest,
  UnifiedModifyRequest,
  UnifiedOrderRequest
} from '../types/broker';

const NODE_API_BASE = 'http://localhost:3001/api/broker';

async function fetchWithFallback(
  gatewayUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: any }> {
  // 1. Try Direct to Python MT5 Gateway
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const directUrl = `${gatewayUrl}${path}`;
    const res = await fetch(directUrl, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
  } catch {
    // direct gateway unavailable, fall through to Node server proxy
  }

  // 2. Fallback to Node.js Server Proxy / Internal Mock Engine
  try {
    const sep = path.includes('?') ? '&' : '?';
    const proxyUrl = `${NODE_API_BASE}${path}${sep}gatewayUrl=${encodeURIComponent(gatewayUrl)}`;
    const res = await fetch(proxyUrl, options);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err: any) {
    return { ok: false, data: { error: err.message } };
  }
}

export const brokerApi = {
  /**
   * Ping / Health check
   */
  async checkHealth(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ status: string; pingMs: number; gatewayData?: any }> {
    const startTime = Date.now();
    const { ok, data } = await fetchWithFallback(gatewayUrl, '/health');
    if (ok && data) {
      return {
        status: data.status === 'offline' ? 'offline' : 'online',
        pingMs: Math.max(1, Date.now() - startTime),
        gatewayData: data
      };
    }
    return { status: 'offline', pingMs: -1 };
  },

  /**
   * Connect to Broker / MT5
   */
  async connect(config: BrokerConfig): Promise<{ success: boolean; account?: BrokerAccount; message?: string }> {
    const url = config.gatewayUrl || 'http://127.0.0.1:8765';
    const body = JSON.stringify({
      brokerType: config.brokerType,
      gatewayUrl: url,
      account: config.account ? parseInt(config.account, 10) : undefined,
      password: config.password,
      server: config.server
    });

    const { ok, data } = await fetchWithFallback(url, '/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (ok && data && (data.success || data.account)) {
      const acc = data.account || data.data?.account || {};
      return {
        success: true,
        account: {
          login: acc.login || config.account || 84920184,
          brokerName: config.brokerType || 'MT5_EXNESS',
          server: acc.server || config.server || 'Exness-MT5Real',
          currency: acc.currency || 'USD',
          leverage: acc.leverage || 500,
          balance: acc.balance ?? 10000,
          equity: acc.equity ?? 10000,
          margin: acc.margin ?? 0,
          freeMargin: acc.margin_free ?? acc.balance ?? 10000,
          marginLevel: acc.margin_level ?? 0,
          profit: acc.profit ?? 0,
          pingMs: 8,
          isLive: true,
          company: acc.company || 'Exness Technologies Ltd',
          tradeAllowed: acc.trade_allowed ?? true
        },
        message: data.message || 'Connected successfully'
      };
    }
    return { success: false, message: data?.message || data?.detail || 'Connection failed' };
  },

  /**
   * Disconnect from Broker
   */
  async disconnect(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<boolean> {
    const { ok } = await fetchWithFallback(gatewayUrl, '/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayUrl })
    });
    return ok;
  },

  /**
   * Fetch Account Information
   */
  async getAccount(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerAccount | null> {
    const { ok, data } = await fetchWithFallback(gatewayUrl, '/account');
    if (!ok || !data) return null;
    return {
      login: data.login,
      brokerName: 'MT5',
      server: data.server,
      currency: data.currency || 'USD',
      leverage: data.leverage || 500,
      balance: data.balance || 0,
      equity: data.equity || 0,
      margin: data.margin || 0,
      freeMargin: data.margin_free || data.balance || 0,
      marginLevel: data.margin_level || 0,
      profit: data.profit || 0,
      pingMs: 8,
      isLive: true,
      company: data.company,
      tradeAllowed: data.trade_allowed ?? true
    };
  },

  /**
   * Fetch Open Positions
   */
  async getPositions(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerPosition[]> {
    const { ok, data } = await fetchWithFallback(gatewayUrl, '/positions');
    if (!ok || !Array.isArray(data)) return [];
    return data.map((p: any) => ({
      ticket: p.ticket,
      symbol: p.symbol,
      side: p.type === 0 || p.side === 'BUY' ? 'BUY' : 'SELL',
      type: p.type ?? (p.side === 'BUY' ? 0 : 1),
      lotSize: p.volume || p.lotSize || 0.1,
      openPrice: p.price_open || p.openPrice || 0,
      currentPrice: p.price_current || p.currentPrice || p.price_open || 0,
      sl: p.sl > 0 ? p.sl : undefined,
      tp: p.tp > 0 ? p.tp : undefined,
      floatingPnL: p.profit ?? p.floatingPnL ?? 0,
      swap: p.swap || 0,
      commission: p.commission || 0,
      openTime: p.time || p.openTime || Math.floor(Date.now() / 1000),
      magic: p.magic,
      comment: p.comment
    }));
  },

  /**
   * Fetch Pending Orders
   */
  async getOrders(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerOrder[]> {
    const { ok, data } = await fetchWithFallback(gatewayUrl, '/orders');
    if (!ok || !Array.isArray(data)) return [];
    return data.map((o: any) => {
      let typeStr: BrokerOrder['type'] = 'BUY_LIMIT';
      if (typeof o.type === 'string') {
        typeStr = o.type as any;
      } else {
        if (o.type === 2) typeStr = 'BUY_LIMIT';
        else if (o.type === 3) typeStr = 'SELL_LIMIT';
        else if (o.type === 4) typeStr = 'BUY_STOP';
        else if (o.type === 5) typeStr = 'SELL_STOP';
      }
      return {
        ticket: o.ticket,
        symbol: o.symbol,
        side: typeStr.startsWith('BUY') ? 'BUY' : 'SELL',
        type: typeStr,
        lotSize: o.volume_initial || o.volume || o.lotSize || 0.1,
        triggerPrice: o.price_open || o.triggerPrice || 0,
        currentPrice: o.price_current || o.currentPrice || o.price_open || 0,
        sl: o.sl > 0 ? o.sl : undefined,
        tp: o.tp > 0 ? o.tp : undefined,
        openTime: o.time_setup || o.openTime || Date.now() / 1000,
        comment: o.comment,
        magic: o.magic
      };
    });
  },

  /**
   * Fetch History Deals
   */
  async getHistory(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerDeal[]> {
    const { ok, data } = await fetchWithFallback(gatewayUrl, '/history');
    if (!ok || !Array.isArray(data)) return [];
    return data.map((d: any) => ({
      ticket: d.ticket,
      orderTicket: d.order || d.ticket,
      symbol: d.symbol,
      side: d.type === 0 || d.side === 'BUY' ? 'BUY' : 'SELL',
      lotSize: d.volume || d.lotSize || 0.1,
      price: d.price || 0,
      profit: d.profit || 0,
      commission: d.commission || 0,
      swap: d.swap || 0,
      time: d.time || Math.floor(Date.now() / 1000),
      comment: d.comment
    }));
  },

  /**
   * Send Order
   */
  async sendOrder(req: UnifiedOrderRequest, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; ticket?: number | string; message?: string }> {
    const body = JSON.stringify({
      gatewayUrl,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      volume: req.lotSize,
      price: req.price,
      sl: req.sl,
      tp: req.tp,
      deviation: req.deviation || 20,
      comment: req.comment || 'QuantPro Live',
      magic: req.magic || 202608
    });

    const { ok, data } = await fetchWithFallback(gatewayUrl, '/order/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    return {
      success: ok && (data?.success || data?.retcode === 10009 || !!data?.ticket),
      ticket: data?.ticket,
      message: data?.message || data?.comment || data?.detail
    };
  },

  /**
   * Modify Order SL/TP
   */
  async modifyOrder(req: UnifiedModifyRequest, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; message?: string }> {
    const body = JSON.stringify({
      gatewayUrl,
      ticket: typeof req.ticket === 'string' ? parseInt(req.ticket, 10) : req.ticket,
      sl: req.sl,
      tp: req.tp,
      price: req.price
    });

    const { ok, data } = await fetchWithFallback(gatewayUrl, '/order/modify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    return {
      success: ok && (data?.success || data?.retcode === 10009),
      message: data?.message || data?.comment || data?.detail
    };
  },

  /**
   * Close Position
   */
  async closePosition(req: UnifiedCloseRequest, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; message?: string }> {
    const body = JSON.stringify({
      gatewayUrl,
      ticket: typeof req.ticket === 'string' ? parseInt(req.ticket, 10) : req.ticket,
      volume: req.lotSize
    });

    const { ok, data } = await fetchWithFallback(gatewayUrl, '/order/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    return {
      success: ok && (data?.success || data?.retcode === 10009),
      message: data?.message || data?.comment || data?.detail
    };
  },

  /**
   * Cancel Pending Order
   */
  async cancelOrder(ticket: string | number, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; message?: string }> {
    const numericTicket = typeof ticket === 'string' ? parseInt(ticket, 10) : ticket;
    const { ok, data } = await fetchWithFallback(gatewayUrl, `/order/cancel?ticket=${numericTicket}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayUrl, ticket: numericTicket })
    });

    return {
      success: ok && (data?.success || data?.retcode === 10009),
      message: data?.message || data?.comment || data?.detail
    };
  },

  /**
   * Close All Positions
   */
  async closeAllPositions(positions: BrokerPosition[], gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; count: number }> {
    let closed = 0;
    for (const pos of positions) {
      const res = await this.closePosition({ ticket: pos.ticket }, gatewayUrl);
      if (res.success) closed++;
    }
    return { success: true, count: closed };
  },

  /**
   * Fetch Live/Historical Candles from Broker
   */
  async getCandles(
    symbol: string = 'XAUUSD',
    timeframe: string = 'M5',
    count: number = 500,
    gatewayUrl: string = 'http://127.0.0.1:8765'
  ): Promise<any[]> {
    const { ok, data } = await fetchWithFallback(
      gatewayUrl,
      `/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&count=${count}`
    );
    if (!ok || !Array.isArray(data)) return [];
    return data;
  },

  /**
   * Fetch Full Broker Symbol Catalog
   */
  async getAllSymbols(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<any[]> {
    const { ok, data } = await fetchWithFallback(gatewayUrl, '/symbols/all');
    if (!ok || !Array.isArray(data)) return [];
    return data;
  }
};
