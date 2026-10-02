/**
 * Quant Backtest Pro — Apex AI Copilot Architecture Specification v2.1
 * Algorithmic SMC (Smart Money Concepts) Perception Engine Data Contracts
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 * Author: Daedalus (CTO) & Vulcan (Senior SWE)
 */

import { Candle } from './market';

// =============================================================================
// 1. Fractal Pivots (Williams Fractals, K=5 HTF, K=2 LTF)
// =============================================================================

export type PivotKind = 'HIGH' | 'LOW';

export interface PivotState {
  readonly id: string;
  readonly barIndex: number;
  readonly timestamp: number;
  readonly price: number;
  readonly kind: PivotKind;
  readonly radius: 2 | 5;
}

// =============================================================================
// 2. Market Structure: Break-of-Structure & Change-of-Character
// =============================================================================

export type StructureEventKind =
  | 'BOS_BULLISH'
  | 'BOS_BEARISH'
  | 'CHoCH_BULLISH'
  | 'CHoCH_BEARISH'
  | 'NONE';

export interface StructureEvent {
  readonly id: string;
  readonly kind: StructureEventKind;
  readonly pivotId: string;
  readonly brokenPrice: number;
  readonly confirmedBarIndex: number;
  readonly timestamp: number;
}

// =============================================================================
// 3. Order Blocks (OB) — UNMITIGATED -> VIOLATED Lifecycle
// =============================================================================

export type OBDirection = 'BULLISH' | 'BEARISH';
export type OBState = 'UNMITIGATED' | 'PARTIAL' | 'MITIGATED' | 'FULLY_MITIGATED' | 'VIOLATED' | 'BREAKER';

export interface OrderBlock {
  readonly id: string;
  readonly direction: OBDirection;
  readonly top: number;
  readonly bottom: number;
  readonly originBarIndex: number;
  readonly timestamp: number;
  state: OBState;
  fillRatio: number; // 0..1
}

// =============================================================================
// 4. Fair Value Gaps (FVG) & Inverted FVGs (IFVG)
// =============================================================================

export type FVGState = 'OPEN' | 'PARTIAL' | 'FILLED' | 'INVERTED_IFVG';
export type FVGOriginKind = 'BULLISH' | 'BEARISH';

export interface FairValueGap {
  readonly id: string;
  readonly direction: FVGOriginKind;
  readonly top: number;
  readonly bottom: number;
  readonly ce: number;
  readonly originBarIndex: number;
  readonly timestamp: number;
  state: FVGState;
  fillRatio: number; // 0..1
}

// =============================================================================
// 5. Liquidity Sweeps (BSL / SSL — Equal-Highs / Equal-Lows Pools)
// =============================================================================

export type LiquidityKind = 'BSL_SWEEP' | 'SSL_SWEEP';

export interface LiquiditySweep {
  readonly id: string;
  readonly kind: LiquidityKind;
  readonly poolLevel: number;
  readonly wickRejectionRatio: number;
  readonly volumeMultiplier: number;
  readonly originBarIndex: number;
  readonly timestamp: number;
}

// =============================================================================
// 6. Premium / Discount Equilibrium (Fibonacci Dealing Range)
// =============================================================================

export type PremiumDiscountLocation = 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';

// =============================================================================
// 7. Frame Snapshot (60 Hz coalesced, sent to main thread)
// =============================================================================

export interface SMCFrameSnapshot {
  readonly barIndex: number;
  readonly timestamp: number;
  readonly close: number;
  readonly trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  readonly structure: StructureEventKind;
  readonly lastPivotId: string | null;
  readonly lastEventBarAgo: number;
  readonly premiumDiscount: PremiumDiscountLocation;
  readonly dealingRangeHigh: number;
  readonly dealingRangeLow: number;
  readonly equilibrium: number;
  readonly activeOrderBlocks: readonly string[];
  readonly activeFairValueGaps: readonly string[];
  readonly recentSweeps: readonly string[];
  readonly atr14: number;
  readonly confluenceScore: number;
  readonly shouldFireLLM: boolean;
}

// =============================================================================
// 8. Worker Inbound Actions (Main -> Worker)
// =============================================================================

export type SMCWorkerInboundAction =
  | {
      kind: 'SMC_INIT_CONFIG';
      payload: {
        symbol: string;
        higherTF: 'D1' | 'H4';
        lowerTF: 'M5' | 'M1';
        fractalRadiusHTF: 5;
        fractalRadiusLTF: 2;
        confluenceThreshold: number;
      };
    }
  | {
      kind: 'SMC_UPDATE_BAR';
      payload: {
        bar: Candle;
        higherTFCandle?: Candle;
      };
    }
  | {
      kind: 'SMC_BULK_REPLAY';
      payload: {
        bars: readonly Candle[];
        higherTFBars?: readonly Candle[];
      };
    }
  | {
      kind: 'SMC_RESET_STATE';
      payload: {
        preservePivots: boolean;
      };
    }
  | {
      kind: 'SMC_SET_GATE_THRESHOLD';
      payload: {
        sigmaMin: number;
      };
    };

// =============================================================================
// 9. Worker Outbound Events (Worker -> Main)
// =============================================================================

export type SMCWorkerOutboundEvent =
  | {
      kind: 'SMC_FRAME_SNAPSHOT';
      payload: SMCFrameSnapshot;
    }
  | {
      kind: 'SMC_PIVOT_CONFIRMED';
      payload: {
        pivot: PivotState;
        affectedOBs: readonly string[];
      };
    }
  | {
      kind: 'SMC_CONFLUENCE_TRIGGER';
      payload: {
        score: number;
        mtfVector: MTFSemanticVector;
        triggerBar: number;
      };
    }
  | {
      kind: 'SMC_PERFORMANCE_METRICS';
      payload: {
        lastBarLatencyMs: number;
        avgLatencyMs: number;
        heapAllocBytes: number;
        framesEmitted: number;
      };
    };

// =============================================================================
// 10. Multi-Timeframe Semantic Vector (~220 token prompt preamble)
// =============================================================================

export type BiasTag = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type OBFillBucket = 0 | 25 | 50 | 75 | 100;
export type VolatilityBucket = 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
export type TradingSession = 'ASIA' | 'LONDON' | 'NY' | 'OVERLAP';
export type SweepKind = 'BSL' | 'SSL' | 'NONE';
export type StructureDirection = 'BULLISH' | 'BEARISH' | 'NONE';

export interface MTFSemanticVector {
  readonly bias: {
    h4: BiasTag;
    d1: BiasTag;
  };
  readonly location: PremiumDiscountLocation;
  readonly activeOB: {
    direction: OBDirection;
    state: OBState;
    fillRatioBucket: OBFillBucket;
  };
  readonly activeFVG: {
    direction: FVGOriginKind;
    state: FVGState;
    fillRatioBucket: OBFillBucket;
  };
  readonly recentSweep: {
    kind: SweepKind;
    barsAgo: number;
  };
  readonly recentCHoCH: {
    direction: StructureDirection;
    barsAgo: number;
  };
  readonly volatility: {
    atrBucket: VolatilityBucket;
    session: TradingSession;
  };
}

export const MTF_TOKEN_BUDGET = 220;
export const MTF_PROMPT_TARGET = 218;

// =============================================================================
// 11. ActionPlan JSON Contract (Browser-side validation)
// =============================================================================

export type ActionSide = 'LONG' | 'SHORT' | 'NO_TRADE';

export type InstitutionalCheckTag =
  | 'HTF_BIAS_ALIGNED'
  | 'KEY_POI_TAP'
  | 'LIQUIDITY_SWEEP_CONFIRMED'
  | 'LTF_CHOCH_CONFIRMED';

export interface ActionPlan {
  readonly side: ActionSide;
  readonly entry: number;
  readonly stopLoss: number;
  readonly takeProfit: readonly number[];
  readonly rrRatio: number;
  readonly rationale: string;
  readonly institutionalChecks: readonly InstitutionalCheckTag[];
  readonly confidence: number;
  readonly mtfVector?: MTFSemanticVector;
}

export interface CoTStreamChunk {
  readonly type: 'reasoning' | 'action' | 'done' | 'error';
  readonly delta: string;
  readonly timestamp: number;
}

// =============================================================================
// 12. Canvas Overlay Primitives (rendered directly on chart canvas)
// =============================================================================

export type OverlayPrimitiveKind =
  | 'ORDER_BLOCK_BULLISH'
  | 'ORDER_BLOCK_BEARISH'
  | 'FVG_BULLISH'
  | 'FVG_BEARISH'
  | 'SWEEP_BSL'
  | 'SWEEP_SSL'
  | 'RR_TARGET';

export interface OverlayPrimitive {
  readonly id: string;
  readonly kind: OverlayPrimitiveKind;
  readonly timeStart: number;
  readonly timeEnd: number;
  readonly priceHigh: number;
  readonly priceLow: number;
  readonly color: string;
  readonly alpha: number;
  readonly label?: string;
}

// =============================================================================
// 13. Type Guards
// =============================================================================

export function isSMCWorkerInboundAction(msg: unknown): msg is SMCWorkerInboundAction {
  if (typeof msg !== 'object' || msg === null) return false;
  const k = (msg as { kind?: unknown }).kind;
  return typeof k === 'string' && k.startsWith('SMC_');
}

export function isSMCWorkerOutboundEvent(msg: unknown): msg is SMCWorkerOutboundEvent {
  if (typeof msg !== 'object' || msg === null) return false;
  const k = (msg as { kind?: unknown }).kind;
  return (
    typeof k === 'string' &&
    (k === 'SMC_FRAME_SNAPSHOT' ||
      k === 'SMC_PIVOT_CONFIRMED' ||
      k === 'SMC_CONFLUENCE_TRIGGER' ||
      k === 'SMC_PERFORMANCE_METRICS')
  );
}
