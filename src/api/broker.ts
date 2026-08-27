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

export const brokerApi = {
  /**
   * Ping / Health check
   */
  async checkHealth(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ status: string; pingMs: number; gatewayData?: any }> {
    const startTime = Date.now();
    try {
      // 1. Try Direct to Gateway first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${gatewayUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { status: 'online', pingMs: Date.now() - startTime, gatewayData: data };
      }
    } catch {
      // Fallback: Try via Node Server Proxy
      try {
        const res = await fetch(`${NODE_API_BASE}/health?gatewayUrl=${encodeURIComponent(gatewayUrl)}`);
        return await res.json();
      } catch {
        return { status: 'offline', pingMs: -1 };
      }
    }
    return { status: 'offline', pingMs: -1 };
  },

  /**
   * Connect to Broker / MT5
   */
  async connect(config: BrokerConfig): Promise<{ success: boolean; account?: BrokerAccount; message?: string }> {
    const url = config.gatewayUrl || 'http://127.0.0.1:8765';
    try {
      const res = await fetch(`${url}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: config.account ? parseInt(config.account, 10) : undefined,
          password: config.password,
          server: config.server
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          account: {
            login: data.account?.login || config.account,
            brokerName: config.brokerType,
            server: data.account?.server || config.server || 'Exness-MT5Real',
            currency: data.account?.currency || 'USD',
            leverage: data.account?.leverage || 500,
            balance: data.account?.balance || 10000,
            equity: data.account?.equity || 10000,
            margin: data.account?.margin || 0,
            freeMargin: data.account?.margin_free || data.account?.balance || 10000,
            marginLevel: data.account?.margin_level || 0,
            profit: data.account?.profit || 0,
            pingMs: 12,
            isLive: true,
            company: data.account?.company,
            tradeAllowed: data.account?.trade_allowed ?? true
          },
          message: data.message
        };
      }
      return { success: false, message: data.message || data.detail || 'Connection failed' };
    } catch (err: any) {
      return { success: false, message: `Failed to connect to ${url}: ${err.message}` };
    }
  },

  /**
   * Disconnect from Broker
   */
  async disconnect(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<boolean> {
    try {
      await fetch(`${gatewayUrl}/disconnect`, { method: 'POST' });
      return true;
    } catch {
      return true;
    }
  },

  /**
   * Fetch Account Information
   */
  async getAccount(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerAccount | null> {
    try {
      const res = await fetch(`${gatewayUrl}/account`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        login: data.login,
        brokerName: 'MT5',
        server: data.server,
        currency: data.currency,
        leverage: data.leverage,
        balance: data.balance,
        equity: data.equity,
        margin: data.margin,
        freeMargin: data.margin_free,
        marginLevel: data.margin_level,
        profit: data.profit,
        pingMs: 15,
        isLive: true,
        company: data.company,
        tradeAllowed: data.trade_allowed
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetch Open Positions
   */
  async getPositions(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerPosition[]> {
    try {
      const res = await fetch(`${gatewayUrl}/positions`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((p: any) => ({
        ticket: p.ticket,
        symbol: p.symbol,
        side: p.type === 0 ? 'BUY' : 'SELL',
        type: p.type,
        lotSize: p.volume,
        openPrice: p.price_open,
        currentPrice: p.price_current,
        sl: p.sl > 0 ? p.sl : undefined,
        tp: p.tp > 0 ? p.tp : undefined,
        floatingPnL: p.profit,
        swap: p.swap || 0,
        commission: p.commission || 0,
        openTime: p.time,
        magic: p.magic,
        comment: p.comment
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch Pending Orders
   */
  async getOrders(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerOrder[]> {
    try {
      const res = await fetch(`${gatewayUrl}/orders`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((o: any) => {
        let typeStr: BrokerOrder['type'] = 'BUY_LIMIT';
        if (typeof o.type === 'string') {
          typeStr = o.type as any;
        } else {
          // MT5 numeric constants: 2: BUY_LIMIT, 3: SELL_LIMIT, 4: BUY_STOP, 5: SELL_STOP
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
          lotSize: o.volume_initial || o.volume || 0.1,
          triggerPrice: o.price_open,
          currentPrice: o.price_current || o.price_open,
          sl: o.sl > 0 ? o.sl : undefined,
          tp: o.tp > 0 ? o.tp : undefined,
          openTime: o.time_setup || Date.now() / 1000,
          comment: o.comment,
          magic: o.magic
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Fetch History Deals
   */
  async getHistory(gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<BrokerDeal[]> {
    try {
      const res = await fetch(`${gatewayUrl}/history`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((d: any) => ({
        ticket: d.ticket,
        orderTicket: d.order || d.ticket,
        symbol: d.symbol,
        side: d.type === 0 ? 'BUY' : 'SELL',
        lotSize: d.volume,
        price: d.price,
        profit: d.profit,
        commission: d.commission || 0,
        swap: d.swap || 0,
        time: d.time,
        comment: d.comment
      }));
    } catch {
      return [];
    }
  },

  /**
   * Send Order
   */
  async sendOrder(req: UnifiedOrderRequest, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; ticket?: number | string; message?: string }> {
    try {
      const res = await fetch(`${gatewayUrl}/order/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });
      const data = await res.json();
      return {
        success: data.success ?? (res.ok && !data.error),
        ticket: data.ticket,
        message: data.message || data.comment || data.detail
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Modify Order SL/TP
   */
  async modifyOrder(req: UnifiedModifyRequest, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${gatewayUrl}/order/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: typeof req.ticket === 'string' ? parseInt(req.ticket, 10) : req.ticket,
          sl: req.sl,
          tp: req.tp,
          price: req.price
        })
      });
      const data = await res.json();
      return {
        success: data.success ?? (res.ok && !data.error),
        message: data.message || data.comment || data.detail
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Close Position
   */
  async closePosition(req: UnifiedCloseRequest, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${gatewayUrl}/order/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: typeof req.ticket === 'string' ? parseInt(req.ticket, 10) : req.ticket,
          volume: req.lotSize
        })
      });
      const data = await res.json();
      return {
        success: data.success ?? (res.ok && !data.error),
        message: data.message || data.comment || data.detail
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Cancel Pending Order
   */
  async cancelOrder(ticket: string | number, gatewayUrl: string = 'http://127.0.0.1:8765'): Promise<{ success: boolean; message?: string }> {
    try {
      const numericTicket = typeof ticket === 'string' ? parseInt(ticket, 10) : ticket;
      const res = await fetch(`${gatewayUrl}/order/cancel?ticket=${numericTicket}`, {
        method: 'POST'
      });
      const data = await res.json();
      return {
        success: data.success ?? (res.ok && !data.error),
        message: data.message || data.comment || data.detail
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
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
  }
};
