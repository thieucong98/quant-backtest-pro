/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * High-Performance O(1) Direct-Index Timestamp Buffer Implementation
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import { Candle, Timeframe } from '../types/market';
import {
  ITimestampIndexBuffer,
  TimestampBufferConfig,
  BufferLookupResult,
  BufferBenchmarkMetrics,
  TIMEFRAME_SECONDS,
} from '../types/timeframeBuffer';

export class TimestampIndexBuffer implements ITimestampIndexBuffer {
  public readonly baseTimestamp: number;
  public readonly endTimestamp: number;
  public readonly intervalSeconds: number;
  public readonly candleCount: number;
  public readonly table: Int32Array;

  private readonly allowMarketGapHolding: boolean;
  private readonly sentinelGapValue: number;
  private readonly buildTimeMs: number;
  private readonly candlesRef: Candle[];

  constructor(
    candles: Candle[],
    intervalSeconds: number = 60,
    config: TimestampBufferConfig = {}
  ) {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.candlesRef = candles;
    this.intervalSeconds = intervalSeconds > 0 ? intervalSeconds : 60;
    this.allowMarketGapHolding = config.allowMarketGapHolding !== false;
    this.sentinelGapValue = config.sentinelGapValue ?? -1;

    if (!candles || candles.length === 0) {
      this.baseTimestamp = 0;
      this.endTimestamp = 0;
      this.candleCount = 0;
      this.table = new Int32Array(0);
      this.buildTimeMs = 0;
      return;
    }

    this.candleCount = candles.length;
    this.baseTimestamp = candles[0].timestamp;
    this.endTimestamp = candles[candles.length - 1].timestamp;

    const rawSpan = this.endTimestamp - this.baseTimestamp;
    const totalSlots = Math.max(1, Math.floor(rawSpan / this.intervalSeconds) + 1);

    this.table = new Int32Array(totalSlots);
    if (!this.allowMarketGapHolding) {
      this.table.fill(this.sentinelGapValue);
    }

    let candleCursor = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      const slotTime = this.baseTimestamp + slot * this.intervalSeconds;

      while (
        candleCursor < this.candleCount - 1 &&
        candles[candleCursor + 1].timestamp <= slotTime
      ) {
        candleCursor++;
      }

      if (this.allowMarketGapHolding) {
        this.table[slot] = candleCursor;
      } else {
        const currentCandle = candles[candleCursor];
        const nextCandleTime =
          candleCursor < this.candleCount - 1
            ? candles[candleCursor + 1].timestamp
            : currentCandle.timestamp + this.intervalSeconds;

        if (slotTime >= currentCandle.timestamp && slotTime < nextCandleTime) {
          this.table[slot] = candleCursor;
        } else {
          this.table[slot] = this.sentinelGapValue;
        }
      }
    }

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.buildTimeMs = Math.max(0.01, endTime - startTime);
  }

  public getCandleIndexAt(timestamp: number): number {
    if (this.candleCount === 0) {
      return -1;
    }

    if (timestamp <= this.baseTimestamp) {
      return 0;
    }

    if (timestamp >= this.endTimestamp) {
      return this.candleCount - 1;
    }

    const slot = Math.floor((timestamp - this.baseTimestamp) / this.intervalSeconds);
    if (slot < 0) return 0;
    if (slot >= this.table.length) return this.candleCount - 1;

    const mapped = this.table[slot];
    if (mapped === -1) {
      return this.allowMarketGapHolding ? 0 : this.sentinelGapValue;
    }
    return mapped;
  }

  public getDetailedLookup(timestamp: number): BufferLookupResult {
    if (this.candleCount === 0) {
      return {
        candleIndex: -1,
        exactMatch: false,
        isGap: true,
        interpolatedProgress: 0,
      };
    }

    const candleIdx = this.getCandleIndexAt(timestamp);
    if (candleIdx < 0 || candleIdx >= this.candleCount) {
      return {
        candleIndex: candleIdx,
        exactMatch: false,
        isGap: true,
        interpolatedProgress: 0,
      };
    }

    const candle = this.candlesRef[candleIdx];
    const exactMatch = candle.timestamp === timestamp;
    const isGap =
      timestamp > candle.timestamp + this.intervalSeconds &&
      candleIdx < this.candleCount - 1 &&
      this.candlesRef[candleIdx + 1].timestamp > timestamp;

    const timeDiff = Math.max(0, timestamp - candle.timestamp);
    const progress = Math.min(1.0, Math.max(0.0, timeDiff / this.intervalSeconds));

    return {
      candleIndex: candleIdx,
      exactMatch,
      isGap,
      interpolatedProgress: progress,
    };
  }

  public getMetrics(): BufferBenchmarkMetrics {
    let measuredLookupNs = 5.0;
    if (this.table.length > 0) {
      const iterations = 1000;
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const mid = this.baseTimestamp + Math.floor((this.endTimestamp - this.baseTimestamp) / 2);
      for (let i = 0; i < iterations; i++) {
        this.getCandleIndexAt(mid);
      }
      const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      measuredLookupNs = Math.max(1.0, ((t1 - t0) * 1e6) / iterations);
    }

    return {
      totalCandles: this.candleCount,
      allocatedSlots: this.table.length,
      tableByteLength: this.table.byteLength,
      buildTimeMs: this.buildTimeMs,
      averageLookupNs: Number(measuredLookupNs.toFixed(2)),
    };
  }
}

/**
 * Factory helper to instantiate a TimestampIndexBuffer for a given timeframe
 */
export function createTimestampIndexBuffer(
  candles: Candle[],
  timeframe: Timeframe = 'M1',
  config?: TimestampBufferConfig
): TimestampIndexBuffer {
  const intervalSeconds = TIMEFRAME_SECONDS[timeframe] || 60;
  return new TimestampIndexBuffer(candles, intervalSeconds, config);
}

/**
 * Floor a timestamp to its timeframe boundary
 */
export function floorTimestampToTimeframe(timestamp: number, timeframeSeconds: number): number {
  return Math.floor(timestamp / timeframeSeconds) * timeframeSeconds;
}
