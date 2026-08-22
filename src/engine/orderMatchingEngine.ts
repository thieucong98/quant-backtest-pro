import { Candle, InstrumentSpec } from '../types/market';
import { AccountState, Order, OrderSide, OrderType, Position } from '../types/order';
import { MultiAssetMathEngine } from './quantMath';

export interface MatchingEvents {
  onOrderFilled?: (order: Order, position: Position) => void;
  onPositionClosed?: (position: Position, reason: string) => void;
  onStopOutTriggered?: (position: Position) => void;
  onLog?: (message: string) => void;
}

export class OrderMatchingEngine {
  public config: InstrumentSpec;
  public pendingOrders: Order[] = [];
  public openPositions: Position[] = [];
  public closedPositions: Position[] = [];
  
  public initialBalance: number;
  public balance: number;
  public equity: number;
  public usedMargin: number = 0;
  public freeMargin: number = 0;
  public marginLevel: number = 0;

  public events: MatchingEvents = {};

  constructor(initialBalance: number, config: InstrumentSpec, events: MatchingEvents = {}) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.equity = initialBalance;
    this.freeMargin = initialBalance;
    this.config = config;
    this.events = events;
  }

  public reset(initialBalance?: number) {
    if (initialBalance !== undefined) this.initialBalance = initialBalance;
    this.balance = this.initialBalance;
    this.equity = this.initialBalance;
    this.freeMargin = this.initialBalance;
    this.usedMargin = 0;
    this.marginLevel = 0;
    this.pendingOrders = [];
    this.openPositions = [];
    this.closedPositions = [];
  }

  public setConfig(config: InstrumentSpec) {
    this.config = config;
  }

  /**
   * Đặt lệnh Thị trường (Market Order)
   */
  public executeMarketOrder(params: {
    side: OrderSide;
    lotSize: number;
    candle: Candle;
    stopLoss?: number;
    takeProfit?: number;
    trailingStopPips?: number;
    comment?: string;
  }): Position | null {
    const { side, lotSize, candle, stopLoss, takeProfit, trailingStopPips, comment } = params;
    const spread = this.config.defaultSpreadPips * this.config.pipSize;
    const executionPrice = side === 'BUY' ? candle.close + spread : candle.close;
    const requiredMargin = MultiAssetMathEngine.calculateRequiredMargin(this.config, lotSize, executionPrice);

    if (this.openPositions.length > 0 && this.freeMargin < requiredMargin) {
      this.events.onLog?.(`[TỪ CHỐI LỆNH] Không đủ Free Margin! Cần: $${requiredMargin.toFixed(2)}, Có: $${this.freeMargin.toFixed(2)}`);
      return null;
    }

    const commission = MultiAssetMathEngine.calculateCommission(this.config, lotSize, executionPrice);

    const position: Position = {
      id: 'pos_' + Math.random().toString(36).substring(2, 9),
      orderId: 'ord_' + Math.random().toString(36).substring(2, 9),
      symbol: this.config.symbol,
      side,
      lotSize,
      entryPrice: executionPrice,
      stopLoss,
      takeProfit,
      trailingStopPips,
      highestPriceSinceOpen: executionPrice,
      lowestPriceSinceOpen: executionPrice,
      commission,
      swap: 0,
      openTime: candle.timestamp,
      floatingPnL: -commission,
      realizedPnL: 0,
      status: 'OPEN',
      comment
    };

    this.balance -= commission;
    this.openPositions.push(position);
    this.updateAccountState(candle.close);
    this.events.onLog?.(`[KHỚP MARKET] ${side} ${lotSize} Lot @ ${executionPrice.toFixed(this.config.digits)} | SL: ${stopLoss ?? 'None'} | TP: ${takeProfit ?? 'None'}`);
    return position;
  }

  /**
   * Đặt lệnh Chờ (Limit / Stop)
   */
  public placePendingOrder(params: {
    side: OrderSide;
    type: OrderType;
    lotSize: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    trailingStopPips?: number;
    comment?: string;
  }): Order {
    const order: Order = {
      id: 'ord_' + Math.random().toString(36).substring(2, 9),
      symbol: this.config.symbol,
      side: params.side,
      type: params.type,
      lotSize: params.lotSize,
      price: params.price,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      trailingStopPips: params.trailingStopPips,
      status: 'PENDING',
      createdAt: Date.now(),
      comment: params.comment
    };

    this.pendingOrders.push(order);
    this.events.onLog?.(`[ĐẶT LỆNH CHỜ] ${order.type} ${order.side} ${order.lotSize} Lot @ ${order.price}`);
    return order;
  }

  public cancelPendingOrder(orderId: string): boolean {
    const idx = this.pendingOrders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      const removed = this.pendingOrders.splice(idx, 1)[0];
      removed.status = 'CANCELLED';
      this.events.onLog?.(`[HỦY LỆNH CHỜ] ${removed.id}`);
      return true;
    }
    return false;
  }

  /**
   * Đóng vị thế thủ công (100%)
   */
  public closePositionManual(positionId: string, currentCandle: Candle): boolean {
    const pos = this.openPositions.find(p => p.id === positionId);
    if (!pos) return false;

    const spread = this.config.defaultSpreadPips * this.config.pipSize;
    const exitPrice = pos.side === 'BUY' ? currentCandle.close : currentCandle.close + spread;
    this.closePosition(pos, exitPrice, currentCandle.timestamp, 'MANUAL');
    this.updateAccountState(currentCandle.close);
    return true;
  }

  /**
   * Dời Stop Loss về Hòa vốn (Breakeven + 1 pip)
   */
  public setBreakeven(positionId: string): boolean {
    const pos = this.openPositions.find(p => p.id === positionId);
    if (!pos) return false;

    const buffer = this.config.pipSize; // +1 pip
    if (pos.side === 'BUY') {
      pos.stopLoss = Number((pos.entryPrice + buffer).toFixed(this.config.digits));
    } else {
      pos.stopLoss = Number((pos.entryPrice - buffer).toFixed(this.config.digits));
    }
    this.events.onLog?.(`[SET BE] Đã dời SL lệnh ${pos.side} về hòa vốn @ ${pos.stopLoss}`);
    return true;
  }

  /**
   * Chốt lời từng phần (Partial Close - ví dụ: 50%)
   */
  public partialClosePosition(positionId: string, percent: number, currentCandle: Candle): boolean {
    const pos = this.openPositions.find(p => p.id === positionId);
    if (!pos || pos.lotSize <= this.config.minLot) return false;

    const closedLot = Number((pos.lotSize * (percent / 100)).toFixed(2));
    if (closedLot < this.config.minLot) return false;

    const remainingLot = Number((pos.lotSize - closedLot).toFixed(2));
    const spread = this.config.defaultSpreadPips * this.config.pipSize;
    const exitPrice = pos.side === 'BUY' ? currentCandle.close : currentCandle.close + spread;

    // Tính PnL cho phần đóng
    const grossProfit = MultiAssetMathEngine.calculatePnL(
      this.config,
      pos.side,
      closedLot,
      pos.entryPrice,
      exitPrice
    );

    // Tạo record closed position cho phần đã chốt
    const closedRecord: Position = {
      ...pos,
      id: 'pos_part_' + Math.random().toString(36).substring(2, 9),
      lotSize: closedLot,
      closePrice: Number(exitPrice.toFixed(this.config.digits)),
      closeTime: currentCandle.timestamp,
      realizedPnL: Number(grossProfit.toFixed(2)),
      status: 'CLOSED',
      closeReason: 'MANUAL',
      comment: `Partial Close ${percent}%`
    };

    this.balance += grossProfit;
    this.closedPositions.push(closedRecord);

    // Cập nhật lại vị thế đang mở với số lot còn lại
    pos.lotSize = remainingLot;
    this.updateAccountState(currentCandle.close);
    this.events.onLog?.(`[CHỐT LỜI ${percent}%] ${pos.side} ${closedLot}L @ ${exitPrice} | PnL: +$${grossProfit.toFixed(2)} | Còn lại: ${remainingLot}L`);
    return true;
  }

  /**
   * VÒNG LẶP CHÍNH: Xử lý mỗi khi có Cây nến mới xuất hiện
   */
  public processCandle(candle: Candle): void {
    const spread = this.config.defaultSpreadPips * this.config.pipSize;
    
    // 1. Kiểm tra khớp các lệnh chờ (Limit / Stop)
    this.matchPendingOrders(candle, spread);

    // 2. Kiểm tra SL, TP, Trailing Stop cho Open Positions
    for (let i = this.openPositions.length - 1; i >= 0; i--) {
      const pos = this.openPositions[i];

      pos.highestPriceSinceOpen = Math.max(pos.highestPriceSinceOpen, candle.high);
      pos.lowestPriceSinceOpen = Math.min(pos.lowestPriceSinceOpen, candle.low);

      if (pos.side === 'BUY') {
        const bidLow = candle.low;
        const bidHigh = candle.high;

        // Trailing Stop cho BUY
        if (pos.trailingStopPips && pos.trailingStopPips > 0) {
          const trailDist = pos.trailingStopPips * this.config.pipSize;
          const newSL = pos.highestPriceSinceOpen - trailDist;
          if (newSL > (pos.stopLoss ?? 0) && newSL > pos.entryPrice) {
            pos.stopLoss = Number(newSL.toFixed(this.config.digits));
          }
        }

        // Kiểm tra Chạm SL
        if (pos.stopLoss && bidLow <= pos.stopLoss) {
          const exitPrice = candle.open < pos.stopLoss ? candle.open : pos.stopLoss;
          this.closePosition(pos, exitPrice, candle.timestamp, 'SL');
          continue;
        }

        // Kiểm tra Chạm TP
        if (pos.takeProfit && bidHigh >= pos.takeProfit) {
          const exitPrice = candle.open > pos.takeProfit ? candle.open : pos.takeProfit;
          this.closePosition(pos, exitPrice, candle.timestamp, 'TP');
          continue;
        }

      } else {
        // Lệnh SELL (Đóng theo giá ASK = Bid + Spread)
        const askHigh = candle.high + spread;
        const askLow = candle.low + spread;

        // Trailing Stop cho SELL
        if (pos.trailingStopPips && pos.trailingStopPips > 0) {
          const trailDist = pos.trailingStopPips * this.config.pipSize;
          const newSL = pos.lowestPriceSinceOpen + trailDist;
          if (!pos.stopLoss || newSL < pos.stopLoss) {
            pos.stopLoss = Number(newSL.toFixed(this.config.digits));
          }
        }

        // Kiểm tra Chạm SL
        if (pos.stopLoss && askHigh >= pos.stopLoss) {
          const exitPrice = (candle.open + spread) > pos.stopLoss ? (candle.open + spread) : pos.stopLoss;
          this.closePosition(pos, exitPrice, candle.timestamp, 'SL');
          continue;
        }

        // Kiểm tra Chạm TP
        if (pos.takeProfit && askLow <= pos.takeProfit) {
          const exitPrice = (candle.open + spread) < pos.takeProfit ? (candle.open + spread) : pos.takeProfit;
          this.closePosition(pos, exitPrice, candle.timestamp, 'TP');
          continue;
        }
      }
    }

    // 3. Cập nhật Floating PnL & Kiểm tra Stop Out
    this.updateAccountState(candle.close);
    this.checkStopOut(candle);
  }

  private matchPendingOrders(candle: Candle, spread: number): void {
    for (let i = this.pendingOrders.length - 1; i >= 0; i--) {
      const order = this.pendingOrders[i];
      let triggeredPrice: number | null = null;

      if (order.side === 'BUY') {
        const askLow = candle.low + spread;
        const askHigh = candle.high + spread;
        if (order.type === 'LIMIT' && askLow <= order.price) {
          triggeredPrice = order.price;
        } else if (order.type === 'STOP' && askHigh >= order.price) {
          triggeredPrice = order.price;
        }
      } else {
        const bidLow = candle.low;
        const bidHigh = candle.high;
        if (order.type === 'LIMIT' && bidHigh >= order.price) {
          triggeredPrice = order.price;
        } else if (order.type === 'STOP' && bidLow <= order.price) {
          triggeredPrice = order.price;
        }
      }

      if (triggeredPrice !== null) {
        const commission = MultiAssetMathEngine.calculateCommission(this.config, order.lotSize, triggeredPrice);
        const position: Position = {
          id: 'pos_' + Math.random().toString(36).substring(2, 9),
          orderId: order.id,
          symbol: this.config.symbol,
          side: order.side,
          lotSize: order.lotSize,
          entryPrice: triggeredPrice,
          stopLoss: order.stopLoss,
          takeProfit: order.takeProfit,
          trailingStopPips: order.trailingStopPips,
          highestPriceSinceOpen: triggeredPrice,
          lowestPriceSinceOpen: triggeredPrice,
          commission,
          swap: 0,
          openTime: candle.timestamp,
          floatingPnL: -commission,
          realizedPnL: 0,
          status: 'OPEN',
          comment: order.comment
        };

        this.balance -= commission;
        this.openPositions.push(position);
        this.pendingOrders.splice(i, 1);
        order.status = 'FILLED';
        this.events.onOrderFilled?.(order, position);
        this.events.onLog?.(`[KHỚP LỆNH CHỜ] ${order.side} ${order.lotSize} Lot @ ${triggeredPrice}`);
      }
    }
  }

  private closePosition(
    pos: Position,
    exitPrice: number,
    timestamp: number,
    reason: Position['closeReason']
  ): void {
    const grossProfit = MultiAssetMathEngine.calculatePnL(
      this.config,
      pos.side,
      pos.lotSize,
      pos.entryPrice,
      exitPrice
    );
    const netProfit = grossProfit - pos.swap;

    pos.closePrice = Number(exitPrice.toFixed(this.config.digits));
    pos.closeTime = timestamp;
    pos.realizedPnL = Number(netProfit.toFixed(2));
    pos.status = 'CLOSED';
    pos.closeReason = reason;

    this.balance += (grossProfit - pos.swap);
    this.closedPositions.push(pos);
    this.openPositions = this.openPositions.filter(p => p.id !== pos.id);

    this.events.onPositionClosed?.(pos, reason || 'CLOSED');
    this.events.onLog?.(`[ĐÓNG LỆNH (${reason})] ${pos.side} ${pos.lotSize}L | Vào: ${pos.entryPrice} -> Ra: ${pos.closePrice} | PnL: ${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)}`);
  }

  public updateAccountState(currentPrice: number): void {
    let totalFloatingPnL = 0;
    let totalMargin = 0;
    const spread = this.config.defaultSpreadPips * this.config.pipSize;

    for (const pos of this.openPositions) {
      const exitPrice = pos.side === 'BUY' ? currentPrice : currentPrice + spread;
      const grossPnL = MultiAssetMathEngine.calculatePnL(
        this.config,
        pos.side,
        pos.lotSize,
        pos.entryPrice,
        exitPrice
      );
      pos.floatingPnL = Number((grossPnL - pos.swap).toFixed(2));
      totalFloatingPnL += pos.floatingPnL;

      totalMargin += MultiAssetMathEngine.calculateRequiredMargin(this.config, pos.lotSize, pos.entryPrice);
    }

    this.equity = Number((this.balance + totalFloatingPnL).toFixed(2));
    this.usedMargin = Number(totalMargin.toFixed(2));
    this.freeMargin = Number((this.equity - this.usedMargin).toFixed(2));
    this.marginLevel = this.usedMargin > 0 ? Number(((this.equity / this.usedMargin) * 100).toFixed(2)) : 0;
  }

  private checkStopOut(candle: Candle): void {
    const STOP_OUT_LEVEL = 50; // 50% Margin Level
    if (this.usedMargin > 0 && this.marginLevel < STOP_OUT_LEVEL) {
      this.events.onLog?.(`[STOP OUT WARNING] Margin level rơi xuống ${this.marginLevel}%! Tiến hành thanh lý lệnh.`);
      // Sắp xếp đóng vị thế lỗ nặng nhất trước
      const sorted = [...this.openPositions].sort((a, b) => a.floatingPnL - b.floatingPnL);
      if (sorted.length > 0) {
        const worst = sorted[0];
        this.closePosition(worst, candle.close, candle.timestamp, 'STOP_OUT');
        this.events.onStopOutTriggered?.(worst);
        this.updateAccountState(candle.close);
      }
    }
  }

  public getAccountState(): AccountState {
    return {
      initialBalance: this.initialBalance,
      balance: this.balance,
      equity: this.equity,
      usedMargin: this.usedMargin,
      freeMargin: this.freeMargin,
      marginLevel: this.marginLevel,
      currency: 'USD'
    };
  }
}
