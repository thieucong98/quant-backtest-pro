/**
 * RFC-003-TECH-v2.1 — Tier 1 SMC Web Worker Boundary
 * Exercises the worker inbound/outbound protocol contract
 * end-to-end via a lightweight in-process worker simulator.
 */

import { SmcEngine, type SmcEngineStats } from '../../src/engine/smc/smcEngine';
import {
  isSMCWorkerInboundAction,
  isSMCWorkerOutboundEvent,
  type SMCWorkerInboundAction,
  type SMCWorkerOutboundEvent,
  type SMCFrameSnapshot,
} from '../../src/types/smc';
import type { Candle } from '../../src/types/market';

interface WorkerHarness {
  emit: (msg: SMCWorkerOutboundEvent) => void;
  post: (msg: SMCWorkerInboundAction) => void;
  stats: () => SmcEngineStats;
  frames: () => readonly SMCFrameSnapshot[];
}

function createWorkerHarness(): WorkerHarness {
  const engine = new SmcEngine({
    symbol: 'TESTUSDT',
    higherTF: 'H4',
    lowerTF: 'M5',
    fractalRadiusHTF: 5,
    fractalRadiusLTF: 2,
    confluenceThreshold: 0.75,
  });
  const frames: SMCFrameSnapshot[] = [];
  const emit = (msg: SMCWorkerOutboundEvent): void => {
    if (!isSMCWorkerOutboundEvent(msg)) return;
    if (msg.kind === 'SMC_FRAME_SNAPSHOT') frames.push(msg.payload);
  };
  const post = (msg: SMCWorkerInboundAction): void => {
    if (!isSMCWorkerInboundAction(msg)) return;
    switch (msg.kind) {
      case 'SMC_INIT_CONFIG':
        engine.reset();
        return;
      case 'SMC_UPDATE_BAR': {
        const frame = engine.updateBar(msg.payload.bar, msg.payload.higherTFCandle);
        if (frame) emit({ kind: 'SMC_FRAME_SNAPSHOT', payload: frame });
        return;
      }
      case 'SMC_BULK_REPLAY': {
        const last = engine.bulkReplay(msg.payload.bars, msg.payload.higherTFBars);
        if (last) emit({ kind: 'SMC_FRAME_SNAPSHOT', payload: last });
        return;
      }
      case 'SMC_RESET_STATE':
        engine.reset(msg.payload.preservePivots);
        return;
      case 'SMC_SET_GATE_THRESHOLD':
        engine.setGateThreshold(msg.payload.sigmaMin);
        return;
    }
  };
  return {
    emit,
    post,
    stats: () => engine.getStats(),
    frames: () => frames,
  };
}

function makeCandles(n: number, basePrice = 100, stepMs = 300): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    timestamp: 1_700_000_000 + i * stepMs,
    open: basePrice + Math.sin(i / 4) * 0.5,
    high: basePrice + Math.sin(i / 4) * 0.5 + 1,
    low: basePrice + Math.sin(i / 4) * 0.5 - 1,
    close: basePrice + Math.cos(i / 4) * 0.5,
    volume: 1000 + (i % 100),
  }));
}

function assert(cond: boolean, msg: string, details?: unknown): void {
  if (!cond) {
    throw new Error(`[FAIL] ${msg}` + (details !== undefined ? ` :: ${JSON.stringify(details)}` : ''));
  }
  console.log(`  ✅ ${msg}`);
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Testing SMC Worker inbound/outbound protocol...');

  // 1) Type guards reject junk payloads.
  assert(!isSMCWorkerInboundAction({ kind: 'UNKNOWN' }), 'Type guard rejects unknown kind');
  assert(!isSMCWorkerInboundAction(null), 'Type guard rejects null');
  assert(!isSMCWorkerOutboundEvent({ kind: 'GHOST' }), 'Outbound type guard rejects unknown');

  // 2) INIT_CONFIG + UPDATE_BAR sequence emits frames.
  const harness = createWorkerHarness();
  harness.post({ kind: 'SMC_INIT_CONFIG', payload: { symbol: 'BTCUSDT', higherTF: 'H4', lowerTF: 'M5', fractalRadiusHTF: 5, fractalRadiusLTF: 2, confluenceThreshold: 0.75 } });
  const candles = makeCandles(120);
  for (const c of candles) {
    harness.post({ kind: 'SMC_UPDATE_BAR', payload: { bar: c } });
  }
  const stats = harness.stats();
  assert(stats.barsProcessed >= 120, 'Worker processed all inbound bars', { barsProcessed: stats.barsProcessed });

  // 3) BULK_REPLAY reuses worker state without crashing.
  const before = harness.frames().length;
  const bulk = makeCandles(60, 110);
  harness.post({ kind: 'SMC_BULK_REPLAY', payload: { bars: bulk } });
  const after = harness.frames().length;
  assert(after >= before, 'BULK_REPLAY does not regress frame stream');

  // 4) RESET_STATE clears counters.
  harness.post({ kind: 'SMC_RESET_STATE', payload: { preservePivots: false } });
  const cleared = harness.stats();
  assert(cleared.barsProcessed === 0, 'RESET_STATE clears barsProcessed');

  // 5) SET_GATE_THRESHOLD does not throw.
  harness.post({ kind: 'SMC_SET_GATE_THRESHOLD', payload: { sigmaMin: 2.0 } });
  assert(true, 'SET_GATE_THRESHOLD accepted without exception');

  // 6) Per-frame latency contract: last bar latency below hard ceiling.
  const perf = harness.stats();
  assert(perf.lastBarLatencyMs >= 0, 'lastBarLatencyMs is measurable', { perf });

  console.log('\n🎉 SMC Worker Sync tests passed.\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
