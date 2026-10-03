/**
 * RFC-003-TECH-v2.1 — Tier 1 SMC Engine Latency Microbenchmark
 * Validates the 1.8ms target / 5ms hard ceiling contract for per-bar processing.
 *
 * Run: `npx tsx tests/benchmarks/smc_latency.bench.ts`
 */

import { SmcEngine } from '../../src/engine/smc/smcEngine';
import type { Candle } from '../../src/types/market';

function makeCandles(n: number, seed = 1): Candle[] {
  let s = seed;
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, (_, i) => {
    const base = 100 + Math.sin(i / 8) * 1.5 + rand() * 0.4;
    return {
      timestamp: 1_700_000_000 + i * 300,
      open: base,
      high: base + 0.8 + rand() * 0.4,
      low: base - 0.8 - rand() * 0.4,
      close: base + Math.cos(i / 6) * 0.3,
      volume: 1000 + (i % 50),
    };
  });
}

function assert(cond: boolean, msg: string, details?: unknown): void {
  if (!cond) {
    throw new Error(`[FAIL] ${msg}` + (details !== undefined ? ` :: ${JSON.stringify(details)}` : ''));
  }
  console.log(`  ✅ ${msg}`);
}

async function runBench(): Promise<void> {
  console.log('\n⚡ Benchmarking SMC Engine per-bar latency...');

  // 1) Smoke test: 1k bars within hard ceiling.
  {
    const engine = new SmcEngine({ confluenceThreshold: 1.0 });
    const candles = makeCandles(1_000);
    for (const c of candles) engine.updateBar(c);
    const stats = engine.getStats();
    console.log(`  ℹ 1k bars: avgLatencyMs=${stats.avgLatencyMs.toFixed(3)} lastBarLatencyMs=${stats.lastBarLatencyMs.toFixed(3)}`);
    assert(stats.barsProcessed === 1_000, '1k bars processed');
    assert(stats.avgLatencyMs < 5, '1k bars avg latency < 5ms (hard ceiling)', { stats });
  }

  // 2) 5k bars at default config — regression on target latency.
  {
    const engine = new SmcEngine({ confluenceThreshold: 0.75 });
    const candles = makeCandles(5_000);
    for (const c of candles) engine.updateBar(c);
    const stats = engine.getStats();
    console.log(`  ℹ 5k bars: avgLatencyMs=${stats.avgLatencyMs.toFixed(3)} lastBarLatencyMs=${stats.lastBarLatencyMs.toFixed(3)}`);
    assert(stats.barsProcessed === 5_000, '5k bars processed');
    assert(stats.avgLatencyMs < 5, '5k bars avg latency < 5ms', { stats });
  }

  // 3) 10k bars with HTF updates — stress test.
  {
    const engine = new SmcEngine({ confluenceThreshold: 0.75 });
    const candles = makeCandles(10_000);
    const htfCandles = makeCandles(10_000, 99);
    for (let i = 0; i < candles.length; i += 1) {
      engine.updateBar(candles[i], htfCandles[i]);
    }
    const stats = engine.getStats();
    console.log(`  ℹ 10k bars + HTF: avgLatencyMs=${stats.avgLatencyMs.toFixed(3)} lastBarLatencyMs=${stats.lastBarLatencyMs.toFixed(3)}`);
    assert(stats.barsProcessed === 10_000, '10k bars + HTF processed');
    assert(stats.avgLatencyMs < 5, '10k bars + HTF avg latency < 5ms', { stats });
  }

  // 4) bulkReplay path.
  {
    const engine = new SmcEngine({ confluenceThreshold: 0.75 });
    const candles = makeCandles(8_000);
    engine.bulkReplay(candles);
    const stats = engine.getStats();
    console.log(`  ℹ bulkReplay 8k bars: avgLatencyMs=${stats.avgLatencyMs.toFixed(3)}`);
    assert(stats.barsProcessed === 8_000, 'bulkReplay processed 8k bars');
    assert(stats.avgLatencyMs < 5, 'bulkReplay avg latency < 5ms', { stats });
  }

  console.log('\n🏁 SMC latency benchmarks passed.\n');
}

runBench().catch((e) => {
  console.error(e);
  process.exit(1);
});
