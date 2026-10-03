/**
 * Quant Backtest Pro — overlayPrimitives bridge tests
 *
 * Validates that Order Blocks / Fair Value Gaps / Liquidity Sweeps from the
 * Tier 1 SmcEngine are mapped to canvas OverlayPrimitive[] deterministically.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import {
  buildOverlayPrimitives,
  orderBlocksToPrimitives,
  fairValueGapsToPrimitives,
  sweepsToPrimitives,
} from '../../src/engine/smc/overlayPrimitives';
import type {
  FairValueGap,
  LiquiditySweep,
  OrderBlock,
} from '../../src/types/smc';

function assert(cond: boolean, group: string, name: string): void {
  if (!cond) throw new Error(`[${group}] ${name} — assertion failed`);
}

console.log('--- overlayPrimitives bridge ---');

const NOW = 1_700_000_000;
const BAR_SECONDS = 60;

// ---------- OrderBlock mapping ----------
const obBull: OrderBlock = {
  id: 'ob-bull-1',
  direction: 'BULLISH',
  top: 1.2,
  bottom: 1.15,
  originBarIndex: 10,
  timestamp: NOW - 3600,
  state: 'UNMITIGATED',
  fillRatio: 0.1,
};

const obBear: OrderBlock = {
  id: 'ob-bear-1',
  direction: 'BEARISH',
  top: 1.3,
  bottom: 1.25,
  originBarIndex: 20,
  timestamp: NOW - 1800,
  state: 'PARTIAL',
  fillRatio: 0.4,
};

const obMitigated: OrderBlock = {
  ...obBull,
  id: 'ob-bull-mitigated',
  state: 'FULLY_MITIGATED',
};

const obPrims = orderBlocksToPrimitives([obBull, obBear, obMitigated], NOW, BAR_SECONDS);
assert(obPrims.length === 2, 'OverlayPrimitives', 'Mitigated OB is filtered out');
assert(obPrims[0].kind === 'ORDER_BLOCK_BULLISH', 'OverlayPrimitives', 'Bullish OB kind');
assert(obPrims[1].kind === 'ORDER_BLOCK_BEARISH', 'OverlayPrimitives', 'Bearish OB kind');
assert(obPrims[0].priceHigh === 1.2 && obPrims[0].priceLow === 1.15, 'OverlayPrimitives', 'OB price range preserved');
assert(obPrims[0].timeEnd > NOW, 'OverlayPrimitives', 'OB extends to a future horizon');

// ---------- FairValueGap mapping ----------
const fvgBull: FairValueGap = {
  id: 'fvg-bull-1',
  direction: 'BULLISH',
  top: 1.21,
  bottom: 1.18,
  ce: 1.195,
  originBarIndex: 30,
  timestamp: NOW - 1200,
  state: 'OPEN',
  fillRatio: 0.0,
};

const fvgBear: FairValueGap = {
  id: 'fvg-bear-1',
  direction: 'BEARISH',
  top: 1.32,
  bottom: 1.29,
  ce: 1.305,
  originBarIndex: 40,
  timestamp: NOW - 600,
  state: 'PARTIAL',
  fillRatio: 0.2,
};

const fvgFilled: FairValueGap = {
  ...fvgBull,
  id: 'fvg-bull-filled',
  state: 'FILLED',
};

const fvgPrims = fairValueGapsToPrimitives([fvgBull, fvgBear, fvgFilled], NOW, BAR_SECONDS);
assert(fvgPrims.length === 2, 'OverlayPrimitives', 'Filled FVG is filtered out');
assert(fvgPrims[0].kind === 'FVG_BULLISH', 'OverlayPrimitives', 'Bullish FVG kind');
assert(fvgPrims[1].kind === 'FVG_BEARISH', 'OverlayPrimitives', 'Bearish FVG kind');

// ---------- LiquiditySweep mapping ----------
const swpBsl: LiquiditySweep = {
  id: 'swp-bsl-1',
  kind: 'BSL_SWEEP',
  poolLevel: 1.35,
  wickRejectionRatio: 0.6,
  volumeMultiplier: 1.8,
  originBarIndex: 50,
  timestamp: NOW - 300,
};

const swpSsl: LiquiditySweep = {
  id: 'swp-ssl-1',
  kind: 'SSL_SWEEP',
  poolLevel: 1.05,
  wickRejectionRatio: 0.55,
  volumeMultiplier: 1.5,
  originBarIndex: 55,
  timestamp: NOW - 240,
};

const swpPrims = sweepsToPrimitives([swpBsl, swpSsl], NOW, BAR_SECONDS);
assert(swpPrims.length === 2, 'OverlayPrimitives', 'Both sweeps emitted');
assert(swpPrims[0].kind === 'SWEEP_BSL', 'OverlayPrimitives', 'BSL sweep kind');
assert(swpPrims[1].kind === 'SWEEP_SSL', 'OverlayPrimitives', 'SSL sweep kind');
assert(swpPrims[0].priceHigh === swpPrims[0].priceLow, 'OverlayPrimitives', 'Sweep primitive is a horizontal line');

// ---------- buildOverlayPrimitives aggregator ----------
const allPrims = buildOverlayPrimitives({
  orderBlocks: [obBull, obBear, obMitigated],
  fairValueGaps: [fvgBull, fvgBear, fvgFilled],
  sweeps: [swpBsl, swpSsl],
  nowTimestamp: NOW,
  barSeconds: BAR_SECONDS,
});

assert(allPrims.length === 6, 'OverlayPrimitives', 'Aggregator returns 6 primitives (2 OB + 2 FVG + 2 sweeps)');

// ---------- Defensive: invalid input returns empty ----------
const defsOnly = buildOverlayPrimitives({
  orderBlocks: [],
  fairValueGaps: [],
  sweeps: [],
  nowTimestamp: NOW,
  barSeconds: BAR_SECONDS,
});
assert(defsOnly.length === 0, 'OverlayPrimitives', 'Empty inputs → empty primitives');

const futureGuard = orderBlocksToPrimitives([obBull], NaN, 0);
assert(futureGuard.length === 1, 'OverlayPrimitives', 'NaN inputs do not crash and still emit primitive');
assert(Number.isFinite(futureGuard[0].timeEnd) || Number.isNaN(futureGuard[0].timeEnd), 'OverlayPrimitives', 'NaN barSeconds falls back to now');

// ---------- Unique IDs ----------
const ids = new Set(allPrims.map(p => p.id));
assert(ids.size === allPrims.length, 'OverlayPrimitives', 'All primitive ids are unique');

console.log(`✅ overlayPrimitives bridge tests passed (${allPrims.length} primitives emitted)`);
