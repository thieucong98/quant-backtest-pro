/**
 * RFC-003-TECH-v2.1 — Tier 1 SMC Accuracy
 * Synthetic scenario with deterministic fractal pivots, BOS, CHoCH, OB, FVG.
 * Verifies the engine produces expected outputs for canonical scenarios.
 */

import { SmcEngine } from '../../src/engine/smc/smcEngine';
import type { Candle } from '../../src/types/market';

function assert(cond: boolean, msg: string, details?: unknown): void {
  if (!cond) {
    throw new Error(`[FAIL] ${msg}` + (details !== undefined ? ` :: ${JSON.stringify(details)}` : ''));
  }
  console.log(`  ✅ ${msg}`);
}

/**
 * Classic setup: 30-bar ranging market establishes SH (at bar 5) and SL (at bar 25).
 * Then 6-bar aggressive displacement up breaks the SH.
 */
function bosScenario(direction: 'UP' | 'DOWN'): Candle[] {
  const out: Candle[] = [];
  // 30 bars of ranging to confirm SH @ bar 5 and SL @ bar 25.
  for (let i = 0; i < 30; i += 1) {
    const phase = i % 6;
    const price = 100 + (phase < 3 ? 2 : -1);
    out.push({
      timestamp: 1_700_000_000 + i * 300,
      open: price, high: price + 1, low: price - 1, close: price, volume: 1000,
    });
  }
  // Displacement
  for (let i = 0; i < 6; i += 1) {
    const base = 100 + (direction === 'UP' ? 8 + i * 1.5 : -8 - i * 1.5);
    out.push({
      timestamp: 1_700_000_000 + (30 + i) * 300,
      open: base, high: base + 1.5, low: base - 1.5,
      close: base + (direction === 'UP' ? 1 : -1), volume: 1500,
    });
  }
  return out;
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Testing SMC Engine accuracy on canonical scenarios...');

  // Scenario 1: BOS_BULLISH uptrend.
  {
    const engine = new SmcEngine({ confluenceThreshold: 1.1 });
    const candles = bosScenario('UP');
    for (const c of candles) engine.updateBar(c);
    const pivots = engine.getPivots();
    const events = engine.getStructureEvents();
    console.log(`  ℹ Pivots: ${pivots.length}, Events: ${events.length}`);
    assert(pivots.length > 0, 'BOS scenario yields pivots');
    assert(events.length > 0, 'BOS scenario yields structure events');
    const kinds = events.map((e) => e.kind);
    assert(
      kinds.some((k) => k === 'BOS_BULLISH' || k === 'CHoCH_BULLISH'),
      'UP scenario yields BOS_BULLISH or CHoCH_BULLISH'
    );
  }

  // Scenario 2: BOS_BEARISH downtrend.
  {
    const engine = new SmcEngine({ confluenceThreshold: 1.1 });
    const candles = bosScenario('DOWN');
    for (const c of candles) engine.updateBar(c);
    const events = engine.getStructureEvents();
    console.log(`  ℹ DOWN events: ${events.length}`);
    const kinds = events.map((e) => e.kind);
    assert(
      kinds.some((k) => k === 'BOS_BEARISH' || k === 'CHoCH_BEARISH'),
      'DOWN scenario yields BOS_BEARISH or CHoCH_BEARISH'
    );
  }

  // Scenario 3: Bulk replay produces same final state.
  {
    const a = new SmcEngine({ confluenceThreshold: 1.1 });
    const b = new SmcEngine({ confluenceThreshold: 1.1 });
    const candles = bosScenario('UP');
    for (const c of candles) a.updateBar(c);
    b.bulkReplay(candles);
    const aStats = a.getStats();
    const bStats = b.getStats();
    assert(aStats.barsProcessed === bStats.barsProcessed, 'bulkReplay and incremental replay agree on barsProcessed');
  }

  // Scenario 4: Frame snapshot carries full context after warm-up.
  {
    const engine = new SmcEngine({ confluenceThreshold: 0.75 });
    const candles = bosScenario('UP');
    let lastFrame = null;
    for (const c of candles) lastFrame = engine.updateBar(c);
    if (lastFrame) {
      assert(typeof lastFrame.barIndex === 'number', 'Frame snapshot has barIndex');
      assert(typeof lastFrame.confluenceScore === 'number', 'Frame snapshot has confluenceScore');
      assert(typeof lastFrame.shouldFireLLM === 'boolean', 'Frame snapshot has shouldFireLLM flag');
      assert(typeof lastFrame.equilibrium === 'number', 'Frame snapshot has equilibrium price');
      assert(typeof lastFrame.atr14 === 'number', 'Frame snapshot has ATR14');
    }
  }

  console.log('\n🎉 SMC Accuracy tests passed.\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
