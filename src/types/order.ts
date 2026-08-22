export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
export type PositionStatus = 'OPEN' | 'CLOSED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  lotSize: number;
  price: number;              // Limit/Stop order trigger price
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPips?: number;
  status: OrderStatus;
  createdAt: number;
  comment?: string;
}

export interface Position {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  lotSize: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPips?: number;
  highestPriceSinceOpen: number;
  lowestPriceSinceOpen: number;
  commission: number;
  swap: number;
  openTime: number;
  closeTime?: number;
  closePrice?: number;
  floatingPnL: number;
  realizedPnL: number;
  closeReason?: 'SL' | 'TP' | 'MANUAL' | 'STOP_OUT' | 'TRAILING_SL';
  status: PositionStatus;
  comment?: string;
  tags?: string[];
  note?: string;
}

export interface AccountState {
  initialBalance: number;
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
}

export interface EquityPoint {
  timestamp: number;
  balance: number;
  equity: number;
}
