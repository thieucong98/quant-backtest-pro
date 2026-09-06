import { Order, OrderSide, OrderType, OrderStatus } from '../../types/order';

export interface CreateOrderParams {
  id?: string;
  symbol: string;
  side: OrderSide;
  lotSize: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPips?: number;
  comment?: string;
  createdAt?: number;
}

export class OrderFactory {
  private static generateId(): string {
    return 'ord_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  }

  /**
   * Factory method for Market Orders
   */
  public static createMarketOrder(params: CreateOrderParams & { currentPrice: number }): Order {
    if (params.lotSize <= 0) {
      throw new Error('Khối lượng vào lệnh (lot size) phải lớn hơn 0.');
    }
    if (params.currentPrice <= 0) {
      throw new Error('Giá thị trường hiện tại không hợp lệ.');
    }

    return {
      id: params.id || this.generateId(),
      symbol: params.symbol,
      side: params.side,
      type: 'MARKET',
      lotSize: params.lotSize,
      price: params.currentPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      trailingStopPips: params.trailingStopPips,
      status: 'FILLED',
      createdAt: params.createdAt || Date.now(),
      comment: params.comment || 'QuantPro Market Order'
    };
  }

  /**
   * Factory method for Limit Orders
   */
  public static createLimitOrder(params: CreateOrderParams & { triggerPrice: number; currentPrice: number }): Order {
    if (params.lotSize <= 0) {
      throw new Error('Khối lượng vào lệnh (lot size) phải lớn hơn 0.');
    }
    if (params.triggerPrice <= 0) {
      throw new Error('Giá đặt lệnh Limit không hợp lệ.');
    }

    // Validation: BUY LIMIT must be below current price; SELL LIMIT must be above current price
    if (params.side === 'BUY' && params.triggerPrice >= params.currentPrice) {
      throw new Error('Lệnh BUY LIMIT phải đặt giá thấp hơn giá thị trường hiện tại.');
    }
    if (params.side === 'SELL' && params.triggerPrice <= params.currentPrice) {
      throw new Error('Lệnh SELL LIMIT phải đặt giá cao hơn giá thị trường hiện tại.');
    }

    return {
      id: params.id || this.generateId(),
      symbol: params.symbol,
      side: params.side,
      type: 'LIMIT',
      lotSize: params.lotSize,
      price: params.triggerPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      trailingStopPips: params.trailingStopPips,
      status: 'PENDING',
      createdAt: params.createdAt || Date.now(),
      comment: params.comment || 'QuantPro Limit Order'
    };
  }

  /**
   * Factory method for Stop Orders
   */
  public static createStopOrder(params: CreateOrderParams & { triggerPrice: number; currentPrice: number }): Order {
    if (params.lotSize <= 0) {
      throw new Error('Khối lượng vào lệnh (lot size) phải lớn hơn 0.');
    }
    if (params.triggerPrice <= 0) {
      throw new Error('Giá đặt lệnh Stop không hợp lệ.');
    }

    // Validation: BUY STOP must be above current price; SELL STOP must be below current price
    if (params.side === 'BUY' && params.triggerPrice <= params.currentPrice) {
      throw new Error('Lệnh BUY STOP phải đặt giá cao hơn giá thị trường hiện tại.');
    }
    if (params.side === 'SELL' && params.triggerPrice >= params.currentPrice) {
      throw new Error('Lệnh SELL STOP phải đặt giá thấp hơn giá thị trường hiện tại.');
    }

    return {
      id: params.id || this.generateId(),
      symbol: params.symbol,
      side: params.side,
      type: 'STOP',
      lotSize: params.lotSize,
      price: params.triggerPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      trailingStopPips: params.trailingStopPips,
      status: 'PENDING',
      createdAt: params.createdAt || Date.now(),
      comment: params.comment || 'QuantPro Stop Order'
    };
  }

  /**
   * Generic Order Validator
   */
  public static validateSLTP(side: OrderSide, entryPrice: number, stopLoss?: number, takeProfit?: number): { valid: boolean; error?: string } {
    if (side === 'BUY') {
      if (stopLoss !== undefined && stopLoss >= entryPrice) {
        return { valid: false, error: 'Stop Loss cho lệnh BUY phải thấp hơn giá vào lệnh.' };
      }
      if (takeProfit !== undefined && takeProfit <= entryPrice) {
        return { valid: false, error: 'Take Profit cho lệnh BUY phải cao hơn giá vào lệnh.' };
      }
    } else {
      if (stopLoss !== undefined && stopLoss <= entryPrice) {
        return { valid: false, error: 'Stop Loss cho lệnh SELL phải cao hơn giá vào lệnh.' };
      }
      if (takeProfit !== undefined && takeProfit >= entryPrice) {
        return { valid: false, error: 'Take Profit cho lệnh SELL phải thấp hơn giá vào lệnh.' };
      }
    }
    return { valid: true };
  }
}
