export type BrokerType =
  | 'SIMULATION'
  | 'MT5_EXNESS'
  | 'XTB'
  | 'BINANCE'
  | 'BYBIT'
  | 'CUSTOM_MT5';

export type BrokerConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export type PositionMode = 'HEDGING' | 'NETTING';

export interface BrokerAccount {
  login: string | number;
  brokerName: string;
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  pingMs: number;
  isLive: boolean;
  company?: string;
  tradeAllowed?: boolean;
}

export interface BrokerPosition {
  ticket: string | number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: number; // 0: BUY, 1: SELL
  lotSize: number;
  openPrice: number;
  currentPrice: number;
  sl?: number;
  tp?: number;
  floatingPnL: number;
  swap: number;
  commission: number;
  openTime: number;
  magic?: number;
  comment?: string;
}

export interface BrokerOrder {
  ticket: string | number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP' | 'BUY_STOP_LIMIT' | 'SELL_STOP_LIMIT';
  lotSize: number;
  triggerPrice: number;
  currentPrice: number;
  sl?: number;
  tp?: number;
  openTime: number;
  comment?: string;
  magic?: number;
}

export interface BrokerDeal {
  ticket: string | number;
  orderTicket: string | number;
  symbol: string;
  side: 'BUY' | 'SELL';
  lotSize: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: number;
  comment?: string;
}

export interface BrokerConfig {
  brokerType: BrokerType;
  gatewayUrl: string; // e.g. "http://127.0.0.1:8765" or remote VPS URL
  account: string;
  password?: string;
  server?: string;
  apiKey?: string;
  apiSecret?: string;
  autoReconnect: boolean;
  positionMode: PositionMode;
  maxSlippagePips?: number;
}

export interface UnifiedOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  lotSize: number;
  price?: number;
  sl?: number;
  tp?: number;
  deviation?: number;
  comment?: string;
  magic?: number;
}

export interface UnifiedModifyRequest {
  ticket: string | number;
  sl?: number;
  tp?: number;
  price?: number;
}

export interface UnifiedCloseRequest {
  ticket: string | number;
  lotSize?: number; // Optional for partial close
}
