/**
 * Quant Backtest Pro — Apex AI Copilot Hook
 *
 * Synchronously feeds the visible backtest candles through an SmcEngine
 * instance and exposes derived chart primitives (Order Blocks, Fair Value
 * Gaps, Liquidity Sweeps), an MTF semantic vector, and live engine perf
 * stats. The hook is intentionally main-thread (cheap, deterministic,
 * < 5ms/bar per the AUT-26 contract — see tests/benchmarks/smc_latency.bench.ts);
 * the parallel Web Worker (`replaySyncWorker.ts`) keeps the Tier 1 engine
 * isolated for replay / RSI-style workflows.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import { useEffect, useRef, useState } from 'react';
import type { Candle } from '../types/market';
import {
  SmcEngine,
  buildOverlayPrimitives,
  type SmcEngineStats,
} from '../engine/smc';
import type {
  MTFSemanticVector,
  OverlayPrimitive,
} from '../types/smc';

export interface SmcStreamSnapshot {
  readonly primitives: readonly OverlayPrimitive[];
  readonly mtf: MTFSemanticVector | null;
  readonly stats: SmcEngineStats;
}

const LOWER_TF = 'M5' as const;
const HIGHER_TF = 'H4' as const;

const TIMEFRAME_SECONDS = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
} as const;

type AnyTimeframe = keyof typeof TIMEFRAME_SECONDS;

function timeframeSeconds(tf: AnyTimeframe): number {
  return TIMEFRAME_SECONDS[tf] ?? 60;
}

function aggregateToHigherTF(
  bars: readonly Candle[],
  higherFactor: number,
): Candle[] {
  if (bars.length === 0 || higherFactor <= 1) return [];
  const out: Candle[] = [];
  for (let i = 0; i + higherFactor <= bars.length; i += higherFactor) {
    const slice = bars.slice(i, i + higherFactor);
    const first = slice[0];
    const last = slice[slice.length - 1];
    let high = -Infinity;
    let low = Infinity;
    let totalVolume = 0;
    for (const c of slice) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      totalVolume += c.volume;
    }
    out.push({
      timestamp: first.timestamp,
      open: first.open,
      high,
      low,
      close: last.close,
      volume: totalVolume,
    });
  }
  return out;
}

export interface UseSmcBacktestStreamOptions {
  readonly symbol?: string;
  readonly higherTF?: 'H4' | 'D1';
  readonly confluenceThreshold?: number;
}

function emptyStats(): SmcEngineStats {
  return {
    lastBarLatencyMs: 0,
    avgLatencyMs: 0,
    heapAllocBytes: 0,
    framesEmitted: 0,
    barsProcessed: 0,
    pivotsConfirmed: 0,
    bosCount: 0,
    chochCount: 0,
    obsTracked: 0,
    fvgsTracked: 0,
    sweepsDetected: 0,
    gateTriggers: 0,
  };
}

export function useSmcBacktestStream(
  candles: readonly Candle[],
  timeframe: AnyTimeframe,
  options: UseSmcBacktestStreamOptions = {},
): SmcStreamSnapshot {
  const engineRef = useRef<SmcEngine | null>(null);
  const lastSignatureRef = useRef<string>('');
  const [snapshot, setSnapshot] = useState<SmcStreamSnapshot>(() => ({
    primitives: [],
    mtf: null,
    stats: emptyStats(),
  }));

  const symbol = options.symbol ?? 'BTCUSDT';
  const higherTF = options.higherTF ?? HIGHER_TF;
  const confluenceThreshold = options.confluenceThreshold ?? 0.75;

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SmcEngine({
        symbol,
        higherTF,
        lowerTF: LOWER_TF,
        fractalRadiusHTF: 5,
        fractalRadiusLTF: 2,
        confluenceThreshold,
      });
    }
  }, [symbol, higherTF, confluenceThreshold]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || candles.length === 0) {
      setSnapshot({ primitives: [], mtf: null, stats: emptyStats() });
      return;
    }
    const lastBar = candles[candles.length - 1];
    const signature = `${symbol}|${timeframe}|${candles.length}|${lastBar?.timestamp ?? 0}`;
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;

    engine.reset();
    const barSeconds = timeframeSeconds(timeframe);
    const higherFactor = higherTF === 'D1'
      ? Math.max(1, Math.round(86400 / barSeconds))
      : Math.max(1, Math.round(14400 / barSeconds));
    const higherBars = higherFactor > 1 ? aggregateToHigherTF(candles, higherFactor) : [];
    engine.bulkReplay(candles, higherBars);
    engine.buildFrameSnapshot(lastBar);

    const primitives = buildOverlayPrimitives({
      orderBlocks: engine.getOrderBlocks(),
      fairValueGaps: engine.getFVGs(),
      sweeps: engine.getSweeps(),
      nowTimestamp: lastBar.timestamp,
      barSeconds,
    });
    const mtf = engine.toMTFVector();

    setSnapshot({
      primitives,
      mtf,
      stats: engine.getStats(),
    });
  }, [candles, timeframe, symbol, higherTF]);

  return snapshot;
}
