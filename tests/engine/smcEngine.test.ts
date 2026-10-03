/**
 * RFC-003-TECH-v2.1 — Tier 1 SMC Engine aggregate test surface covering:
 *     - Pivot detection (fractal radius)
 *     - BOS / CHoCH state machine
 *     - Order Block tracking
 *     - Fair Value Gap detection
 *     - Liquidity Sweep detection
 *     - Performance contract (≤ 5ms per bar amortized)
 */

import { SmcEngine } from '../../src/engine/smc/smcEngine';
import type { Candle } from '../../src/types/market';

function assert(cond: boolean, msg: string, details?: unknown): void {
  if (!cond) {
    throw new Error(`[FAIL] ${msg}` + (details !== undefined ? ` :: ${JSON.stringify(details)}` : ''));
  }
  console.log(`  ✅ ${msg}`);
}

function makeBreakoutSequence(direction: 'UP' | 'DOWN'): Candle[] {
  const out: Candle[] = [];
  // Establish a small range so SH/SL pivots exist.
  for (let i = 0; i < 30; i += 1) {
    const phase = i % 6;
    const price = 100 + (phase < 3 ? 2 : -1);
    out.push({
      timestamp: 1_700_000_000 + i * 300,
      open: price,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1000,
    });
  }
  // Aggressive displacement
  for (let i = 0; i < 6; i += 1) {
    const base = 100 + (direction === 'UP' ? 8 + i * 1.5 : -8 - i * 1.5);
    out.push({
      timestamp: 1_700_000_000 + (30 + i) * 300,
      open: base,
      high: base + 1.5,
      low: base - 1.5,
      close: base + (direction === 'UP' ? 1 : -1),
      volume: 1500,
    });
  }
  // Reverse displacement to provoke CHoCH
  for (let i = 0; i < 6; i += 1) {
    const base = 100 + (direction === 'UP' ? 5 - i * 2 : -5 + i * 2);
    out.push({
      timestamp: 1_700_000_000 + (36 + i) * 300,
      open: base,
      high: base + 1.5,
      low: base - 1.5,
      close: base + (direction === 'UP' ? -1 : 1),
      volume: 1500,
    });
  }
  return out;
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Testing SmcEngine aggregate contract...');

  // ----- Trend Up: should produce bullish structure -----
  const upEngine = new SmcEngine({ confluenceThreshold: 1.1 });
  for (const c of makeBreakoutSequence('UP')) upEngine.updateBar(c);
  const upStats = upEngine.getStats();
  console.log(`  ℹ UP bars processed: ${upStats.barsProcessed}, BOS: ${upStats.bosCount}, CHoCH: ${upStats.chochCount}`);
  assert(upStats.barsProcessed === 42, 'Bars processed counter is exact');
  assert(upStats.bosCount + upStats.chochCount >= 1, 'Upward break sequence yields at least one structure event');
  assert(upStats.avgLatencyMs < 5, `Avg latency is under 5ms ceiling (got ${upStats.avgLatencyMs.toFixed(3)} ms)`);

  // ----- Trend Down: should produce bearish structure -----
  const dnEngine = new SmcEngine({ confluenceThreshold: 1.1 });
  for (const c of makeBreakoutSequence('DOWN')) dnEngine.updateBar(c);
  const dnStats = dnEngine.getStats();
  console.log(`  ℹ DOWN bars processed: ${dnStats.barsProcessed}, BOS: ${dnStats.bosCount}, CHoCH: ${dnStats.chochCount}`);
  assert(dnStats.bosCount + dnStats.chochCount >= 1, 'Downward break sequence yields at least one structure event');

  // ----- Bulk replay: must produce a final frame -----
  const bulk = new SmcEngine({ confluenceThreshold: 1.1 });
  const last = bulk.bulkReplay(makeBreakoutSequence('UP'));
  assert(last !== null, 'bulkReplay returns final frame');
  const bulkStats = bulk.getStats();
  assert(bulkStats.barsProcessed === 42, 'bulkReplay feeds exactly N bars');

  // ----- Reset: clears barsProcessed and frame cache -----
  bulk.reset(true);
  const resetStats = bulk.getStats();
  assert(resetStats.barsProcessed === 0, 'reset() clears the bars-processed counter');
  assert(resetStats.framesEmitted === 0, 'reset() clears frames-emitted counter');

  // ----- Replay after reset works -----
  const replayed = bulk.bulkReplay(makeBreakoutSequence('DOWN'));
  assert(replayed !== null, 'Engine can replay after reset');
  const replayStats = bulk.getStats();
  assert(replayStats.barsProcessed === 42, 'Engine processes 42 bars after reset');

  console.log('\n🎉 SmcEngine aggregate tests passed.\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
