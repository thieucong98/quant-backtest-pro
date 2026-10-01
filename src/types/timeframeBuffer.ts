/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * O(1) Timestamp Indexing Buffer Interface & Mathematical Data Contracts
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Daedalus (CTO / Principal System Architect)
 */

import { Candle, Timeframe } from './market';

// =============================================================================
// 1. Timeframe Resolution Constants (Seconds)
// =============================================================================

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
};

// =============================================================================
// 2. O(1) Index Buffer Interface Contract
// =============================================================================

export interface TimestampBufferConfig {
  intervalSeconds?: number;
  allowMarketGapHolding?: boolean; // When true, weekend/holiday gaps hold the last active candle
  sentinelGapValue?: number;       // Default is -1 when market is closed
}

export interface BufferLookupResult {
  candleIndex: number;
  exactMatch: boolean;
  isGap: boolean;
  interpolatedProgress?: number; // 0.0 to 1.0 progress inside the higher TF bar
}

export interface BufferBenchmarkMetrics {
  totalCandles: number;
  allocatedSlots: number;
  tableByteLength: number;
  buildTimeMs: number;
  averageLookupNs: number;
}

/**
 * Strict O(1) Direct-Index Buffer Interface.
 * Implementations allocate a flat contiguous Int32Array to guarantee O(1) lookups
 * without GC allocations during high-frequency replay loops.
 */
export interface ITimestampIndexBuffer {
  /** Base starting epoch in seconds (T_0) */
  readonly baseTimestamp: number;

  /** Ending epoch in seconds (T_max) */
  readonly endTimestamp: number;

  /** Interval resolution in seconds (\Delta t_base) */
  readonly intervalSeconds: number;

  /** Total number of candles in the backing dataset */
  readonly candleCount: number;

  /** Contiguous flat typed array storing candle indices */
  readonly table: Int32Array;

  /**
   * O(1) Constant-Time Lookup for any arbitrary Unix timestamp (in seconds).
   * Arithmetic: slot = Math.floor((timestamp - baseTimestamp) / intervalSeconds)
   * Result: table[slot]
   * 
   * @param timestamp Unix epoch timestamp in seconds
   * @returns Candle array index in [0, candleCount - 1], or sentinel (-1) if before start or invalid
   */
  getCandleIndexAt(timestamp: number): number;

  /**
   * Extended lookup providing metadata on exact match and gap status.
   */
  getDetailedLookup(timestamp: number): BufferLookupResult;

  /**
   * Returns memory consumption and performance profile metrics.
   */
  getMetrics(): BufferBenchmarkMetrics;
}
