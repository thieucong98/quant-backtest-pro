/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * Benchmark Suite: Dual-Chart Synchronization, O(1) Indexing & 60 FPS Replay Throughput
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Target: Sustained 60 FPS (<=16.6ms frame time), <=150MB heap under 200k candles
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import { Candle } from '../../src/types/market';
import { TimestampIndexBuffer } from '../../src/engine/timeframeBuffer';
import { ReplaySyncEngine } from '../../src/workers/replaySyncWorker';
import { WorkerOutboundEvent } from '../../src/types/workerSync';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[BENCHMARK FAILED] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runBenchmark() {
  console.log('================================================================');
  console.log('⚡ RUNNING DUAL-CHART 60 FPS & O(1) BUFFER PERFORMANCE BENCHMARK');
  console.log('================================================================\n');

  // 1. Generate 200,000 M1 candles (~138 days of continuous 1-minute data)
  const candleCount = 200000;
  console.log(`[Phase 1] Generating ${candleCount.toLocaleString()} M1 candles...`);
  const startEpoch = 1700000000;
  const candles: Candle[] = new Array(candleCount);

  let currentPrice = 1.0850;
  for (let i = 0; i < candleCount; i++) {
    const delta = (Math.sin(i * 0.05) + (i % 2 === 0 ? 0.0001 : -0.0001)) * 0.0005;
    const open = currentPrice;
    const close = currentPrice + delta;
    const high = Math.max(open, close) + 0.0003;
    const low = Math.min(open, close) - 0.0003;
    currentPrice = close;

    candles[i] = {
      timestamp: startEpoch + i * 60,
      open,
      high,
      low,
      close,
      volume: 100 + (i % 50),
    };
  }

  // Measure Heap Memory Usage
  const memBefore = process.memoryUsage().heapUsed;
  console.log(`Heap before buffer allocation: ${(memBefore / 1024 / 1024).toFixed(2)} MB`);

  // 2. Build TimestampIndexBuffer
  console.log('\n[Phase 2] Constructing TimestampIndexBuffer with contiguous Int32Array...');
  const tBuildStart = performance.now();
  const buffer = new TimestampIndexBuffer(candles, 60);
  const tBuildEnd = performance.now();
  const buildDurationMs = tBuildEnd - tBuildStart;

  const memAfter = process.memoryUsage().heapUsed;
  const memoryDeltaMb = (memAfter - memBefore) / 1024 / 1024;
  const metrics = buffer.getMetrics();

  console.log(`-> Buffer Build Time: ${buildDurationMs.toFixed(2)} ms`);
  console.log(`-> Allocated Slots: ${metrics.allocatedSlots.toLocaleString()}`);
  console.log(`-> Table Size: ${(metrics.tableByteLength / 1024).toFixed(2)} KB`);
  console.log(`-> Heap Memory Footprint: ${memoryDeltaMb.toFixed(2)} MB (Limit: <= 150 MB)`);

  assert(buildDurationMs < 1000, `Buffer build time (${buildDurationMs.toFixed(2)}ms) < 1000ms`);
  assert(memoryDeltaMb < 150, `Memory footprint (${memoryDeltaMb.toFixed(2)}MB) <= 150MB constraint`);

  // 3. Measure O(1) Random Lookup Latency over 1,000,000 queries
  const lookupIterations = 1000000;
  console.log(`\n[Phase 3] Running ${lookupIterations.toLocaleString()} random O(1) lookups...`);

  // Pre-generate random timestamps across the full span
  const randomTimestamps = new Float64Array(lookupIterations);
  const span = (candleCount - 1) * 60;
  for (let i = 0; i < lookupIterations; i++) {
    randomTimestamps[i] = startEpoch + Math.floor(Math.random() * span);
  }

  let dummyAccumulator = 0;
  const tLookupStart = performance.now();
  for (let i = 0; i < lookupIterations; i++) {
    dummyAccumulator += buffer.getCandleIndexAt(randomTimestamps[i]);
  }
  const tLookupEnd = performance.now();
  const totalLookupMs = tLookupEnd - tLookupStart;
  const nsPerLookup = (totalLookupMs * 1e6) / lookupIterations;

  console.log(`-> Total Lookup Time: ${totalLookupMs.toFixed(2)} ms for ${lookupIterations.toLocaleString()} ops`);
  console.log(`-> Average Lookup Speed: ${nsPerLookup.toFixed(2)} ns/op (Limit: < 100 ns)`);
  assert(nsPerLookup < 100, `O(1) lookup latency (${nsPerLookup.toFixed(2)}ns) < 100ns`);
  assert(dummyAccumulator !== 0, 'Verification check');

  // 4. Simulate Dual-Chart 10x Replay Loop Throughput
  console.log('\n[Phase 4] Benchmarking Dual-Chart Replay Engine under 10x Simulation...');
  let batchesCount = 0;
  let maxFrameTimeMs = 0;
  const testEngine = new ReplaySyncEngine((event: WorkerOutboundEvent) => {
    if (event.type === 'FRAME_BATCH') {
      batchesCount++;
    }
  });

  testEngine.handleAction({
    type: 'LOAD_DATASET',
    payload: {
      symbol: 'EURUSD',
      candles: candles.slice(0, 50000), // 50k candles slice
      baseTimeframe: 'M1',
      linkedTimeframes: ['H1'],
    },
  });

  const replayStepCount = 10000;
  console.log(`Executing ${replayStepCount.toLocaleString()} steps with zero-lookahead H1 candle synthesis...`);

  const tReplayStart = performance.now();
  for (let s = 0; s < replayStepCount; s++) {
    const tFrameStart = performance.now();
    testEngine.handleAction({
      type: 'REPLAY_STEP',
      payload: { direction: 'FORWARD', stepCount: 1 },
    });
    const tFrameEnd = performance.now();
    const frameTime = tFrameEnd - tFrameStart;
    if (frameTime > maxFrameTimeMs) {
      maxFrameTimeMs = frameTime;
    }
  }
  const tReplayEnd = performance.now();
  const totalReplayMs = tReplayEnd - tReplayStart;
  const avgFrameTimeMs = totalReplayMs / replayStepCount;
  const effectiveFps = 1000 / Math.max(0.001, avgFrameTimeMs);

  console.log(`-> Total Time for ${replayStepCount.toLocaleString()} Frames: ${totalReplayMs.toFixed(2)} ms`);
  console.log(`-> Average Frame Processing Time: ${avgFrameTimeMs.toFixed(4)} ms (Budget: <= 16.6 ms)`);
  console.log(`-> Peak Frame Time: ${maxFrameTimeMs.toFixed(4)} ms`);
  console.log(`-> Equivalent Frame Rate Capacity: ${effectiveFps.toFixed(0)} FPS (Target: >= 60 FPS)`);

  assert(avgFrameTimeMs <= 16.6, `Average frame time (${avgFrameTimeMs.toFixed(4)}ms) satisfies 60 FPS budget (<= 16.6ms)`);
  assert(effectiveFps >= 60, `Throughput capacity (${effectiveFps.toFixed(0)} FPS) >= 60 FPS sustained`);

  console.log('\n================================================================');
  console.log('🏆 BENCHMARK COMPLETED: ALL PERFORMANCE & MEMORY SLA GATES PASSED');
  console.log('================================================================\n');
}

runBenchmark().catch((err) => {
  console.error('Benchmark Error:', err);
  process.exit(1);
});
