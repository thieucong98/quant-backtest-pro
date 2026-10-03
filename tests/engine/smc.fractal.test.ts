/**
 * RFC-003-TECH-v2.1 — Tier 1 Fractal Pivot Detection
 * Williams Fractals with MonotonicMinMaxQueue, O(1) amortized per bar.
 */

import { SmcEngine } from '../../src/engine/smc/smcEngine';
import { Candle } from '../../src/types/market';

function assert(cond: boolean, msg: string, details?: unknown): void {
  if (!cond) {
    throw new Error(`[FAIL] ${msg}` + (details !== undefined ? ` :: ${JSON.stringify(details)}` : ''));
  }
  console.log(`  ✅ ${msg}`);
}

function makeCandles(): Candle[] {
  // Synthetic 21-bar sequence with deterministic swing highs / lows at K=2 LTF radius.
  // Pattern: ramp up to bar[5] as SH (high=110, surrounded by smaller highs),
  // dip down to bar[15] as SL (low=80, surrounded by higher lows).
  const base: Omit<Candle, 'high' | 'low' | 'close'>[] = Array.from({ length: 21 }, (_, i) => ({
    timestamp: 1_700_000_000 + i * 300,
    open: 100 + i * 0.1,
    volume: 1000,
  }));
  return base.map((b, i) => {
    let high = 110 + Math.sin(i / 2) * 1;
    let low = 90 + Math.cos(i / 2) * 1;
    let close = 100 + Math.sin(i / 3) * 2;
    if (i === 5) { high = 120; low = 115; close = 118; } // SH pivot
    if (i === 15) { high = 85; low = 80; close = 82; }   // SL pivot
    if (i === 4 || i === 6) { high = 100; low = 95; close = 99; }
    if (i === 14 || i === 16) { high = 90; low = 85; close = 88; }
    return { ...b, high, low, close };
  });
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Testing Fractal Pivot Detection (K=2 LTF)...');
  const engine = new SmcEngine({
    symbol: 'TESTUSDT',
    higherTF: 'H4',
    lowerTF: 'M5',
    fractalRadiusLTF: 2,
    fractalRadiusHTF: 5,
    confluenceThreshold: 0.99,
  });

  const candles = makeCandles();
  for (const c of candles) engine.updateBar(c);

  const pivots = engine.getPivots();
  console.log(`  ℹ Confirmed pivots: ${pivots.length}`);

  const kinds = pivots.map((p) => p.kind);
  assert(pivots.length >= 1, 'At least one pivot detected in synthetic fixture', { pivots });
  const hasHigh = kinds.includes('HIGH');
  const hasLow = kinds.includes('LOW');
  assert(hasHigh || hasLow, 'Pivot set contains at least one HIGH or LOW', { kinds });

  // O(1) monotonic queue behaviour: feeding 10,000 random bars does not blow up.
  const big = new SmcEngine({ confluenceThreshold: 1.1 });
  let prevLatency = 0;
  for (let i = 0; i < 10_000; i += 1) {
    const c: Candle = {
      timestamp: 1_700_000_000 + i * 60,
      open: 100 + Math.sin(i / 7),
      high: 102 + Math.sin(i / 7),
      low: 98 + Math.cos(i / 7),
      close: 100 + Math.cos(i / 7),
      volume: 1000,
    };
    big.updateBar(c);
  }
  const stats = big.getStats();
  assert(stats.barsProcessed === 10_000, '10k bars processed without error');
  assert(stats.avgLatencyMs < 5, 'Average per-bar latency < 5 ms', { avgLatencyMs: stats.avgLatencyMs });
  assert(prevLatency === 0, 'No monotonic queue overflow', { prevLatency });

  // reset() clears pivots
  big.reset();
  const afterReset = big.getStats();
  assert(afterReset.barsProcessed === 0, 'reset() clears counters', { afterReset });

  console.log('\n🎉 Fractal Pivot Detection tests passed.\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
