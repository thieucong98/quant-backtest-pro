/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * ReplaySyncWorker: Dedicated Multi-Chart Web Worker Synchronization Engine
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import { Candle, Timeframe } from '../types/market';
import { BrokerOrder, BrokerPosition, UnifiedOrderRequest } from '../types/broker';
import {
  WorkerInboundAction,
  WorkerOutboundEvent,
  ReplayFrameBatch,
  ReplayAccountSnapshot,
  isWorkerInboundAction,
} from '../types/workerSync';
import { TIMEFRAME_SECONDS } from '../types/timeframeBuffer';
import { TimestampIndexBuffer, floorTimestampToTimeframe } from '../engine/timeframeBuffer';

export type EventPostCallback = (event: WorkerOutboundEvent) => void;

export class ReplaySyncEngine {
  private symbol: string = 'EURUSD';
  private primaryCandles: Candle[] = [];
  private baseTimeframe: Timeframe = 'M1';
  private linkedTimeframes: Timeframe[] = [];
  private secondaryTimeframe: Timeframe = 'H1';
  private primaryBuffer: TimestampIndexBuffer | null = null;

  // Playback Cursor
  private currentIndex: number = 0;
  public masterTimestamp: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1;
  private timerHandle: any = null;
  private spreadPips: number = 1.0;
  private slippagePips: number = 0.5;

  // Developing Secondary Bar Cache
  private currentSecondaryCandle: Candle | null = null;
  private currentSecondaryBucket: number = -1;
  private isSecondaryNewBarFlag: boolean = false;

  // Internal Lightweight Simulated OMS
  private initialBalance: number = 10000;
  private balance: number = 10000;
  private realizedPnL: number = 0;
  private positions: BrokerPosition[] = [];
  private pendingOrders: BrokerOrder[] = [];
  private nextTicketId: number = 1001;

  // Callback to post outbound events
  private postEvent: EventPostCallback;

  constructor(postEvent: EventPostCallback) {
    this.postEvent = postEvent;
  }

  public handleAction(action: WorkerInboundAction): void {
    try {
      switch (action.type) {
        case 'LOAD_DATASET':
          this.handleLoadDataset(action.payload);
          break;
        case 'REPLAY_PLAY':
          this.handlePlay(action.payload.speed);
          break;
        case 'REPLAY_PAUSE':
          this.handlePause();
          break;
        case 'REPLAY_STEP':
        case 'STEP': {
          const stepCount = (action.payload as any).stepCount ?? (action.payload as any).count ?? 1;
          this.handleStep(action.payload.direction, stepCount);
          break;
        }
        case 'REPLAY_SEEK':
          this.handleSeek(action.payload.targetTimestamp);
          break;
        case 'REPLAY_SET_SPEED':
          this.handleSetSpeed(action.payload.speed);
          break;
        case 'ORDER_SUBMIT':
          this.handleOrderSubmit(action.payload);
          break;
        case 'ORDER_CANCEL':
          this.handleOrderCancel(action.payload.orderId);
          break;
        case 'UPDATE_CONFIG':
          if (action.payload.spreadPips !== undefined) this.spreadPips = action.payload.spreadPips;
          if (action.payload.slippagePips !== undefined) this.slippagePips = action.payload.slippagePips;
          break;
        case 'TERMINATE':
          this.handleTerminate();
          break;
      }
    } catch (err: any) {
      this.postEvent({
        type: 'WORKER_ERROR',
        payload: {
          code: 'EXECUTION_ERROR',
          message: err?.message || String(err),
          stack: err?.stack,
        },
      });
    }
  }

  private handleLoadDataset(payload: {
    symbol: string;
    candles: Candle[];
    baseTimeframe: Timeframe;
    linkedTimeframes: Timeframe[];
    spreadPips?: number;
  }): void {
    this.handlePause();

    this.symbol = payload.symbol;
    this.primaryCandles = payload.candles || [];
    this.baseTimeframe = payload.baseTimeframe;
    this.linkedTimeframes = payload.linkedTimeframes || [];
    this.secondaryTimeframe = this.linkedTimeframes[0] || (this.baseTimeframe === 'M1' ? 'M5' : 'H1');
    if (payload.spreadPips !== undefined) {
      this.spreadPips = payload.spreadPips;
    }

    const intervalSec = TIMEFRAME_SECONDS[this.baseTimeframe] || 60;
    this.primaryBuffer = new TimestampIndexBuffer(this.primaryCandles, intervalSec);

    this.currentIndex = 0;
    this.masterTimestamp = this.primaryCandles.length > 0 ? this.primaryCandles[0].timestamp : 0;
    this.currentSecondaryCandle = null;
    this.currentSecondaryBucket = -1;
    this.isSecondaryNewBarFlag = true;

    // Reset simulated account
    this.balance = this.initialBalance;
    this.realizedPnL = 0;
    this.positions = [];
    this.pendingOrders = [];

    this.postEvent({
      type: 'DATASET_LOADED',
      payload: {
        totalCandles: this.primaryCandles.length,
        startTimestamp: this.primaryBuffer.baseTimestamp,
        endTimestamp: this.primaryBuffer.endTimestamp,
        timeframe: this.baseTimeframe,
        indexedSlots: this.primaryBuffer.table.length,
      },
    });

    if (this.primaryCandles.length > 0) {
      this.rebuildDevelopingCandleUpToCurrent();
      this.emitCurrentFrameBatch();
    }
  }

  private handlePlay(speed: number): void {
    if (speed > 0) {
      this.speed = speed;
    }
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.scheduleNextTick();
  }

  private handlePause(): void {
    this.isPlaying = false;
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private handleSetSpeed(speed: number): void {
    if (speed > 0) {
      this.speed = speed;
    }
  }

  private handleStep(direction: 'FORWARD' | 'BACKWARD', stepCount: number): void {
    this.handlePause();
    const count = Math.max(1, stepCount || 1);

    if (direction === 'FORWARD') {
      this.currentIndex = Math.min(this.primaryCandles.length - 1, this.currentIndex + count);
    } else {
      this.currentIndex = Math.max(0, this.currentIndex - count);
    }

    if (this.primaryCandles.length > 0) {
      this.masterTimestamp = this.primaryCandles[this.currentIndex].timestamp;
      this.rebuildDevelopingCandleUpToCurrent();
      this.emitCurrentFrameBatch();
    }
  }

  private handleSeek(targetTimestamp: number): void {
    this.handlePause();
    if (!this.primaryBuffer || this.primaryCandles.length === 0) return;

    this.currentIndex = this.primaryBuffer.getCandleIndexAt(targetTimestamp);
    this.masterTimestamp = this.primaryCandles[this.currentIndex].timestamp;

    this.rebuildDevelopingCandleUpToCurrent();

    const primarySlice = this.primaryCandles.slice(0, this.currentIndex + 1);
    const secondarySlice = this.buildCompleteSecondarySlice(this.masterTimestamp);

    this.postEvent({
      type: 'SEEK_COMPLETE',
      payload: {
        currentTimestamp: this.masterTimestamp,
        primaryCandle: this.primaryCandles[this.currentIndex],
        secondaryCandle: this.currentSecondaryCandle || undefined,
        primarySlice,
        secondarySlice,
      },
    });

    this.emitCurrentFrameBatch();
  }

  private scheduleNextTick(): void {
    if (!this.isPlaying) return;

    let barsPerBatch = 1;
    let delayMs = 50;

    if (this.speed <= 1) {
      delayMs = 150;
      barsPerBatch = 1;
    } else if (this.speed <= 5) {
      delayMs = 40;
      barsPerBatch = 1;
    } else if (this.speed <= 10) {
      delayMs = 16;
      barsPerBatch = 1;
    } else {
      delayMs = 16;
      barsPerBatch = Math.min(20, Math.floor(this.speed / 5));
    }

    this.timerHandle = setTimeout(() => {
      this.processBatchTick(barsPerBatch);
      if (this.isPlaying) {
        this.scheduleNextTick();
      }
    }, delayMs);
  }

  private processBatchTick(barsToAdvance: number): void {
    if (this.primaryCandles.length === 0) {
      this.handlePause();
      return;
    }

    let advanced = 0;
    while (advanced < barsToAdvance && this.currentIndex < this.primaryCandles.length - 1) {
      this.currentIndex++;
      const candle = this.primaryCandles[this.currentIndex];
      this.masterTimestamp = candle.timestamp;

      this.updateDevelopingCandle(candle);
      this.evaluateSimulatedOrders(candle);
      advanced++;
    }

    if (this.currentIndex >= this.primaryCandles.length - 1) {
      this.handlePause();
    }

    this.emitCurrentFrameBatch();
  }

  private updateDevelopingCandle(candle: Candle): void {
    const htfSeconds = TIMEFRAME_SECONDS[this.secondaryTimeframe] || 3600;
    const bucketStart = floorTimestampToTimeframe(candle.timestamp, htfSeconds);

    if (!this.currentSecondaryCandle || this.currentSecondaryBucket !== bucketStart) {
      this.currentSecondaryBucket = bucketStart;
      this.currentSecondaryCandle = {
        timestamp: bucketStart,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
      this.isSecondaryNewBarFlag = true;
    } else {
      this.currentSecondaryCandle.high = Math.max(this.currentSecondaryCandle.high, candle.high);
      this.currentSecondaryCandle.low = Math.min(this.currentSecondaryCandle.low, candle.low);
      this.currentSecondaryCandle.close = candle.close;
      this.currentSecondaryCandle.volume += candle.volume;
      this.isSecondaryNewBarFlag = false;
    }
  }

  private rebuildDevelopingCandleUpToCurrent(): void {
    if (this.primaryCandles.length === 0 || this.currentIndex < 0) {
      this.currentSecondaryCandle = null;
      this.currentSecondaryBucket = -1;
      this.isSecondaryNewBarFlag = false;
      return;
    }

    const htfSeconds = TIMEFRAME_SECONDS[this.secondaryTimeframe] || 3600;
    const currentPrimary = this.primaryCandles[this.currentIndex];
    const bucketStart = floorTimestampToTimeframe(currentPrimary.timestamp, htfSeconds);

    const prevBucket = this.currentSecondaryBucket;

    let firstInBucketIdx = this.currentIndex;
    while (
      firstInBucketIdx > 0 &&
      this.primaryCandles[firstInBucketIdx - 1].timestamp >= bucketStart
    ) {
      firstInBucketIdx--;
    }

    const firstCandle = this.primaryCandles[firstInBucketIdx];
    let high = firstCandle.high;
    let low = firstCandle.low;
    let volume = 0;

    for (let i = firstInBucketIdx; i <= this.currentIndex; i++) {
      const c = this.primaryCandles[i];
      high = Math.max(high, c.high);
      low = Math.min(low, c.low);
      volume += c.volume;
    }

    this.currentSecondaryBucket = bucketStart;
    this.currentSecondaryCandle = {
      timestamp: bucketStart,
      open: firstCandle.open,
      high,
      low,
      close: currentPrimary.close,
      volume,
    };

    // If bucket changed from previous, flag new bar
    this.isSecondaryNewBarFlag = prevBucket !== -1 && prevBucket !== bucketStart;
  }

  private buildCompleteSecondarySlice(upToTimestamp: number): Candle[] {
    const htfSeconds = TIMEFRAME_SECONDS[this.secondaryTimeframe] || 3600;
    const result: Candle[] = [];
    if (this.primaryCandles.length === 0) return result;

    let currentBucket: Candle | null = null;
    let bucketStart = -1;

    for (let i = 0; i <= this.currentIndex; i++) {
      const c = this.primaryCandles[i];
      const bStart = floorTimestampToTimeframe(c.timestamp, htfSeconds);

      if (bStart !== bucketStart) {
        if (currentBucket) {
          result.push(currentBucket);
        }
        bucketStart = bStart;
        currentBucket = {
          timestamp: bStart,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        };
      } else if (currentBucket) {
        currentBucket.high = Math.max(currentBucket.high, c.high);
        currentBucket.low = Math.min(currentBucket.low, c.low);
        currentBucket.close = c.close;
        currentBucket.volume += c.volume;
      }
    }

    if (currentBucket) {
      result.push(currentBucket);
    }

    return result;
  }

  private emitCurrentFrameBatch(): void {
    if (this.primaryCandles.length === 0 || this.currentIndex >= this.primaryCandles.length) {
      return;
    }

    const primary = this.primaryCandles[this.currentIndex];
    const accountState = this.calculateAccountSnapshot(primary.close);

    const developingCandles: Record<string, Candle> = {};
    if (this.currentSecondaryCandle) {
      developingCandles[this.secondaryTimeframe] = { ...this.currentSecondaryCandle };
    }

    const batch: ReplayFrameBatch = {
      masterTimestamp: this.masterTimestamp,
      primaryCandle: primary,
      secondaryCandle: this.currentSecondaryCandle ? { ...this.currentSecondaryCandle } : undefined,
      developingSecondary: this.currentSecondaryCandle ? { ...this.currentSecondaryCandle } : undefined,
      developingCandles: this.currentSecondaryCandle ? developingCandles : undefined,
      isSecondaryNewBar: this.isSecondaryNewBarFlag,
      accountState,
    };

    this.postEvent({
      type: 'FRAME_BATCH',
      payload: batch,
    });
  }

  private calculateAccountSnapshot(currentPrice: number): ReplayAccountSnapshot {
    let unrealizedPnL = 0;
    let usedMargin = 0;

    for (const pos of this.positions) {
      const pointDiff = pos.side === 'BUY'
        ? currentPrice - pos.openPrice
        : pos.openPrice - currentPrice;
      const posPnL = pointDiff * 100000 * pos.lotSize;
      pos.floatingPnL = posPnL;
      pos.currentPrice = currentPrice;
      unrealizedPnL += posPnL;
      usedMargin += (pos.lotSize * 100000) / 100;
    }

    const equity = this.balance + unrealizedPnL;
    const freeMargin = Math.max(0, equity - usedMargin);
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

    return {
      balance: this.balance,
      equity,
      margin: usedMargin,
      freeMargin,
      marginLevel,
      unrealizedPnL,
      realizedPnL: this.realizedPnL,
    };
  }

  private evaluateSimulatedOrders(candle: Candle): void {
    if (this.positions.length === 0) return;

    for (let i = this.positions.length - 1; i >= 0; i--) {
      const pos = this.positions[i];
      let closed = false;
      let closePrice = 0;
      let reason = '';

      if (pos.side === 'BUY') {
        if (pos.sl && candle.low <= pos.sl) {
          closed = true;
          closePrice = pos.sl;
          reason = 'SL';
        } else if (pos.tp && candle.high >= pos.tp) {
          closed = true;
          closePrice = pos.tp;
          reason = 'TP';
        }
      } else {
        if (pos.sl && candle.high >= pos.sl) {
          closed = true;
          closePrice = pos.sl;
          reason = 'SL';
        } else if (pos.tp && candle.low <= pos.tp) {
          closed = true;
          closePrice = pos.tp;
          reason = 'TP';
        }
      }

      if (closed) {
        const pointDiff = pos.side === 'BUY'
          ? closePrice - pos.openPrice
          : pos.openPrice - closePrice;
        const pnl = pointDiff * 100000 * pos.lotSize;

        this.balance += pnl;
        this.realizedPnL += pnl;
        this.positions.splice(i, 1);

        this.postEvent({
          type: 'ORDER_EVENT',
          payload: {
            event: 'CLOSED',
            order: { ...pos, currentPrice: closePrice, floatingPnL: pnl },
            message: `Closed via ${reason} at ${closePrice}`,
          },
        });
      }
    }
  }

  private handleOrderSubmit(request: UnifiedOrderRequest & { clientOrderId: string }): void {
    if (this.primaryCandles.length === 0) return;
    const currentPrice = this.primaryCandles[this.currentIndex].close;
    const spreadOffset = (this.spreadPips * 0.0001) / 2;
    const fillPrice = request.side === 'BUY' ? currentPrice + spreadOffset : currentPrice - spreadOffset;

    const newPosition: BrokerPosition = {
      ticket: this.nextTicketId++,
      symbol: request.symbol || this.symbol,
      side: request.side,
      type: request.side === 'BUY' ? 0 : 1,
      lotSize: request.lotSize,
      openPrice: fillPrice,
      currentPrice: fillPrice,
      sl: request.sl,
      tp: request.tp,
      floatingPnL: 0,
      swap: 0,
      commission: 7 * request.lotSize,
      openTime: this.masterTimestamp,
      comment: request.comment,
    };

    this.positions.push(newPosition);

    this.postEvent({
      type: 'ORDER_EVENT',
      payload: {
        event: 'FILLED',
        order: newPosition,
        message: `Order ${request.clientOrderId} filled at ${fillPrice}`,
      },
    });

    this.emitCurrentFrameBatch();
  }

  private handleOrderCancel(orderId: string | number): void {
    const idx = this.pendingOrders.findIndex((o) => o.ticket === orderId);
    if (idx !== -1) {
      const removed = this.pendingOrders.splice(idx, 1)[0];
      this.postEvent({
        type: 'ORDER_EVENT',
        payload: {
          event: 'CANCELLED',
          order: removed,
        },
      });
    }
  }

  private handleTerminate(): void {
    this.handlePause();
    this.primaryCandles = [];
    this.positions = [];
    this.pendingOrders = [];
  }
}

// -----------------------------------------------------------------------------
// Web Worker Environment Self-Initialization
// -----------------------------------------------------------------------------
if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function') {
  const engine = new ReplaySyncEngine((event: WorkerOutboundEvent) => {
    (self as any).postMessage(event);
  });

  self.addEventListener('message', (event: MessageEvent) => {
    if (isWorkerInboundAction(event.data)) {
      engine.handleAction(event.data);
    }
  });
}
