/**
 * Quant Backtest Pro — Apex AI Copilot
 * Bridge: SmcEngine internal state → canvas OverlayPrimitive[].
 *
 * The Tier 1 SmcEngine tracks Order Blocks, Fair Value Gaps and Liquidity
 * Sweeps as typed arrays. The SmcCanvasOverlayPainter consumes a flat
 * `OverlayPrimitive[]` (id, kind, timeStart, timeEnd, priceHigh, priceLow,
 * color, alpha, label?). This module performs that mapping while keeping
 * the conversion deterministic and side-effect free.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import type {
  FairValueGap,
  LiquiditySweep,
  OverlayPrimitive,
  OrderBlock,
} from '../../types/smc';

const OB_BULLISH_COLOR = 'rgba(16, 185, 129, 0.18)';
const OB_BEARISH_COLOR = 'rgba(239, 68, 68, 0.18)';
const OB_BULLISH_BORDER = 'rgba(16, 185, 129, 0.9)';
const OB_BEARISH_BORDER = 'rgba(239, 68, 68, 0.9)';
const FVG_BULLISH_COLOR = 'rgba(56, 189, 248, 0.22)';
const FVG_BEARISH_COLOR = 'rgba(244, 114, 182, 0.22)';
const FVG_BULLISH_BORDER = 'rgba(56, 189, 248, 0.85)';
const FVG_BEARISH_BORDER = 'rgba(244, 114, 182, 0.85)';
const SWEEP_BSL_COLOR = 'rgba(250, 204, 21, 0.85)';
const SWEEP_SSL_COLOR = 'rgba(168, 85, 247, 0.85)';

const VISIBLE_HORIZON_BARS = 240;

export interface OverlayProjectionInput {
  readonly orderBlocks: readonly OrderBlock[];
  readonly fairValueGaps: readonly FairValueGap[];
  readonly sweeps: readonly LiquiditySweep[];
  readonly nowTimestamp: number;
  readonly barSeconds: number;
}

function horizonTimestamp(now: number, barSeconds: number): number {
  if (!Number.isFinite(now) || !Number.isFinite(barSeconds) || barSeconds <= 0) {
    return now;
  }
  return now + VISIBLE_HORIZON_BARS * barSeconds;
}

export function orderBlocksToPrimitives(
  blocks: readonly OrderBlock[],
  now: number,
  barSeconds: number,
): OverlayPrimitive[] {
  const end = horizonTimestamp(now, barSeconds);
  const out: OverlayPrimitive[] = [];
  for (const ob of blocks) {
    if (ob.state === 'FULLY_MITIGATED' || ob.state === 'VIOLATED' || ob.state === 'BREAKER') {
      continue;
    }
    const isBull = ob.direction === 'BULLISH';
    out.push({
      id: ob.id,
      kind: isBull ? 'ORDER_BLOCK_BULLISH' : 'ORDER_BLOCK_BEARISH',
      timeStart: ob.timestamp,
      timeEnd: end,
      priceHigh: ob.top,
      priceLow: ob.bottom,
      color: isBull ? OB_BULLISH_COLOR : OB_BEARISH_COLOR,
      alpha: 0.18,
      label: isBull ? OB_BULLISH_BORDER : OB_BEARISH_BORDER,
    });
  }
  return out;
}

export function fairValueGapsToPrimitives(
  gaps: readonly FairValueGap[],
  now: number,
  barSeconds: number,
): OverlayPrimitive[] {
  const end = horizonTimestamp(now, barSeconds);
  const out: OverlayPrimitive[] = [];
  for (const fvg of gaps) {
    if (fvg.state === 'FILLED' || fvg.state === 'INVERTED_IFVG') continue;
    const isBull = fvg.direction === 'BULLISH';
    out.push({
      id: fvg.id,
      kind: isBull ? 'FVG_BULLISH' : 'FVG_BEARISH',
      timeStart: fvg.timestamp,
      timeEnd: end,
      priceHigh: fvg.top,
      priceLow: fvg.bottom,
      color: isBull ? FVG_BULLISH_COLOR : FVG_BEARISH_COLOR,
      alpha: 0.22,
      label: isBull ? FVG_BULLISH_BORDER : FVG_BEARISH_BORDER,
    });
  }
  return out;
}

export function sweepsToPrimitives(
  sweeps: readonly LiquiditySweep[],
  now: number,
  barSeconds: number,
): OverlayPrimitive[] {
  const end = horizonTimestamp(now, barSeconds);
  const out: OverlayPrimitive[] = [];
  for (const sw of sweeps) {
    const isBsl = sw.kind === 'BSL_SWEEP';
    out.push({
      id: sw.id,
      kind: isBsl ? 'SWEEP_BSL' : 'SWEEP_SSL',
      timeStart: sw.timestamp,
      timeEnd: end,
      priceHigh: sw.poolLevel,
      priceLow: sw.poolLevel,
      color: isBsl ? SWEEP_BSL_COLOR : SWEEP_SSL_COLOR,
      alpha: 0.9,
      label: isBsl ? 'BSL' : 'SSL',
    });
  }
  return out;
}

export function buildOverlayPrimitives(input: OverlayProjectionInput): OverlayPrimitive[] {
  const { orderBlocks, fairValueGaps, sweeps, nowTimestamp, barSeconds } = input;
  return [
    ...orderBlocksToPrimitives(orderBlocks, nowTimestamp, barSeconds),
    ...fairValueGapsToPrimitives(fairValueGaps, nowTimestamp, barSeconds),
    ...sweepsToPrimitives(sweeps, nowTimestamp, barSeconds),
  ];
}
