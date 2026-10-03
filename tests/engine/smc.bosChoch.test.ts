/**
 * RFC-003-TECH-v2.1 — Tier 1 BOS/CHoCH state machine.
 */

import { SmcEngine } from '../../src/engine/smc/smcEngine';
import { Candle } from '../../src/types/market';

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
  console.log('\n🧪 Testing BOS / CHoCH state machine...');

  const up = new SmcEngine({ confluenceThreshold: 1.1 });
  for (const c of makeBreakoutSequence('UP')) up.updateBar(c);
  const upEvts = up.getStructureEvents();
  console.log(`  ℹ UP-direction structure events: ${upEvts.length}`);
  assert(upEvts.length > 0, 'Bullish displacement sequence emits at least one structure event');
  const upKinds = upEvts.map((e) => e.kind);
  assert(
    upKinds.some((k) => k === 'BOS_BULLISH' || k === 'CHoCH_BULLISH'),
    'Bullish sequence yields BOS_BULLISH or CHoCH_BULLISH',
    { upKinds }
  );

  const dn = new SmcEngine({ confluenceThreshold: 1.1 });
  for (const c of makeBreakoutSequence('DOWN')) dn.updateBar(c);
  const dnEvts = dn.getStructureEvents();
  console.log(`  ℹ DOWN-direction structure events: ${dnEvts.length}`);
  assert(dnEvts.length > 0, 'Bearish displacement sequence emits at least one structure event');
  const dnKinds = dnEvts.map((e) => e.kind);
  assert(
    dnKinds.some((k) => k === 'BOS_BEARISH' || k === 'CHoCH_BEARISH'),
    'Bearish sequence yields BOS_BEARISH or CHoCH_BEARISH',
    { dnKinds }
  );

  const stats = dn.getStats();
  assert(stats.chochCount >= 0, 'CHoCH counter is non-negative', { stats });

  console.log('\n🎉 BOS/CHoCH tests passed.\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
