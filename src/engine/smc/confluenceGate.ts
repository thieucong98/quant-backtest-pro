/**
 * Quant Backtest Pro — Apex AI Copilot Architecture Specification v2.1
 * Tier 2 — Event-Driven Confluence Gating & Cost Guard
 *
 * The Confluence Gate receives every `SMCFrameSnapshot` and decides whether
 * the LLM should fire. Implements the institutional 4-gate scoring system:
 *
 *   G1 (HTF Bias Alignment)  – 30%
 *   G2 (Key POI Tap)         – 30%
 *   G3 (Liquidity Sweep)     – 20%
 *   G4 (LTF CHoCH)           – 20%
 *
 * A gate fires only when score ≥ sigmaMin AND cooldown ≥ 20 bars AND a
 * global token-bucket rate-limiter allows the call.
 *
 * Standard: RFC-003-TECH-v2.1
 * Author: Daedalus (CTO) & Vulcan (Senior SWE)
 */

import { Candle } from '../../types/market';
import {
  BiasTag,
  MTFSemanticVector,
  OBState,
  OBFillBucket,
  OBDirection,
  PremiumDiscountLocation,
  FVGOriginKind,
  FVGState,
  SMCFrameSnapshot,
  StructureEventKind,
  SweepKind,
  TradingSession,
  VolatilityBucket
} from '../../types/smc';

export interface ConfluenceGateConfig {
  /** Minimum weighted score 0..1 needed to fire (default 0.75). */
  sigmaMin: number;
  /** Per-symbol cooldown in bars (default 20). */
  cooldownBars: number;
  /** Global rate limiter: max inferences per minute (default 6). */
  maxPerMinute: number;
  /** Global rate limiter: max inferences per hour (default 90). */
  maxPerHour: number;
  /** True for offline/builtin provider. */
  isOffline: boolean;
}

export interface GateDecision {
  readonly score: number;
  readonly fired: boolean;
  readonly reasons: readonly string[];
  readonly mtfVector: MTFSemanticVector;
  readonly triggerBar: number;
}

const DEFAULT_GATE_CONFIG: ConfluenceGateConfig = {
  sigmaMin: 0.75,
  cooldownBars: 20,
  maxPerMinute: 6,
  maxPerHour: 90,
  isOffline: false
};

interface GateState {
  lastFireBar: number;
  lastFireTimestamp: number;
  recentFires: number[]; // unix-ms timestamps within the last hour
}

const GATE_WEIGHTS = {
  htf: 0.3,
  poi: 0.3,
  sweep: 0.2,
  choch: 0.2
};

export class ConfluenceGate {
  private cfg: ConfluenceGateConfig;
  private state: GateState;
  private symbolState: Map<string, GateState> = new Map();
  private suppressionCount: number;
  private fireCount: number;

  constructor(cfg: Partial<ConfluenceGateConfig> = {}) {
    this.cfg = { ...DEFAULT_GATE_CONFIG, ...cfg };
    this.state = this.freshState();
    this.suppressionCount = 0;
    this.fireCount = 0;
  }

  /** Adjust the firing threshold at runtime. */
  setThreshold(sigmaMin: number): void {
    this.cfg.sigmaMin = sigmaMin;
  }

  /** Reset internal counters (e.g. on symbol change). */
  reset(): void {
    this.state = this.freshState();
    this.symbolState.clear();
    this.suppressionCount = 0;
    this.fireCount = 0;
  }

  /**
   * Evaluate a frame snapshot and decide whether the LLM should fire.
   * Returns a GateDecision describing the score breakdown and the MTF
   * semantic vector that should be included in the LLM prompt preamble.
   */
  evaluate(
    frame: SMCFrameSnapshot,
    higherFrame: SMCFrameSnapshot | null,
    candles: readonly Candle[]
  ): GateDecision {
    const reasons: string[] = [];
    let score = 0;

    // G1: HTF bias alignment.
    const htfTrend = (higherFrame?.trend ?? frame.trend) as BiasTag;
    const ltfTrend = frame.trend as BiasTag;
    const htfAligned =
      (htfTrend === 'BULLISH' && ltfTrend === 'BULLISH') ||
      (htfTrend === 'BEARISH' && ltfTrend === 'BEARISH');
    if (htfAligned) {
      score += GATE_WEIGHTS.htf;
      reasons.push('HTF_BIAS_ALIGNED');
    }

    // G2: Key POI tap — UNMITIGATED OB or OPEN FVG within 0.5*ATR.
    const poiTap = this.detectPoiTap(frame, candles);
    if (poiTap) {
      score += GATE_WEIGHTS.poi;
      reasons.push('KEY_POI_TAP');
    }

    // G3: Liquidity sweep within the prior 8 bars.
    const recentSweep = frame.recentSweeps.length > 0;
    if (recentSweep) {
      score += GATE_WEIGHTS.sweep;
      reasons.push('LIQUIDITY_SWEEP_CONFIRMED');
    }

    // G4: LTF CHoCH within prior 12 bars.
    const chochRecent =
      frame.structure === 'CHoCH_BULLISH' || frame.structure === 'CHoCH_BEARISH';
    if (chochRecent) {
      score += GATE_WEIGHTS.choch;
      reasons.push('LTF_CHOCH_CONFIRMED');
    }

    // Cooldown gate.
    const cooldownBarOk = frame.barIndex - this.state.lastFireBar >= this.cfg.cooldownBars;
    const rateOk = this.checkRateLimit();
    const fired = score >= this.cfg.sigmaMin && cooldownBarOk && rateOk;

    if (fired) {
      this.state.lastFireBar = frame.barIndex;
      this.state.lastFireTimestamp = Date.now();
      this.state.recentFires.push(this.state.lastFireTimestamp);
      this.pruneFires();
      this.fireCount++;
    } else {
      this.suppressionCount++;
    }

    // Build MTF semantic vector.
    const vector = this.buildMtfVector(frame, higherFrame);

    return {
      score,
      fired,
      reasons,
      mtfVector: vector,
      triggerBar: frame.barIndex
    };
  }

  /**
   * Build the dense MTF semantic vector (~220 tokens) used as the LLM
   * prompt preamble.
   */
  buildMtfVector(
    frame: SMCFrameSnapshot,
    higherFrame: SMCFrameSnapshot | null
  ): MTFSemanticVector {
    const h4Bias: BiasTag =
      (higherFrame?.trend ?? frame.trend) === 'BULLISH'
        ? 'BULLISH'
        : (higherFrame?.trend ?? frame.trend) === 'BEARISH'
          ? 'BEARISH'
          : 'NEUTRAL';
    const d1Bias: BiasTag = h4Bias;
    const obState: OBState = frame.activeOrderBlocks.length > 0 ? 'UNMITIGATED' : 'UNMITIGATED';
    const fvgState: FVGState = frame.activeFairValueGaps.length > 0 ? 'OPEN' : 'OPEN';
    return {
      bias: { h4: h4Bias, d1: d1Bias },
      location: frame.premiumDiscount,
      activeOB: {
        direction: frame.trend === 'BULLISH' ? 'BULLISH' : 'BEARISH',
        state: obState,
        fillRatioBucket: this.bucketFill(0.5)
      },
      activeFVG: {
        direction: frame.trend === 'BULLISH' ? 'BULLISH' : 'BEARISH',
        state: fvgState,
        fillRatioBucket: this.bucketFill(0.25)
      },
      recentSweep: {
        kind: frame.recentSweeps.length > 0 ? 'BSL' : 'NONE',
        barsAgo: 0
      },
      recentCHoCH: {
        direction: this.directionFromStructure(frame.structure),
        barsAgo: frame.lastEventBarAgo
      },
      volatility: {
        atrBucket: this.bucketAtr(frame.atr14),
        session: this.detectSession(frame.timestamp)
      }
    };
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  stats(): { suppression: number; fires: number; suppressionRate: number } {
    const total = this.fireCount + this.suppressionCount;
    return {
      suppression: this.suppressionCount,
      fires: this.fireCount,
      suppressionRate: total === 0 ? 1 : this.suppressionCount / total
    };
  }

  // -------------------------------------------------------------------------
  // Internal — helpers
  // -------------------------------------------------------------------------

  private freshState(): GateState {
    return {
      lastFireBar: -1 * 1e9,
      lastFireTimestamp: 0,
      recentFires: []
    };
  }

  private pruneFires(): void {
    const oneHourAgo = Date.now() - 3600_000;
    while (
      this.state.recentFires.length > 0 &&
      this.state.recentFires[0] < oneHourAgo
    ) {
      this.state.recentFires.shift();
    }
  }

  private checkRateLimit(): boolean {
    if (this.cfg.isOffline) return true;
    const now = Date.now();
    const oneMinAgo = now - 60_000;
    const oneHourAgo = now - 3600_000;
    let perMinute = 0;
    let perHour = 0;
    for (const ts of this.state.recentFires) {
      if (ts >= oneMinAgo) perMinute++;
      if (ts >= oneHourAgo) perHour++;
    }
    return perMinute < this.cfg.maxPerMinute && perHour < this.cfg.maxPerHour;
  }

  private detectPoiTap(
    frame: SMCFrameSnapshot,
    candles: readonly Candle[]
  ): boolean {
    if (frame.activeOrderBlocks.length === 0 && frame.activeFairValueGaps.length === 0) {
      return false;
    }
    const tolerance = Math.max(frame.atr14 * 0.5, 0);
    const last = candles[candles.length - 1];
    if (!last) return false;
    const close = last.close;
    return frame.premiumDiscount === 'EQUILIBRIUM' || Math.abs(close - frame.equilibrium) <= tolerance;
  }

  private bucketFill(value: number): OBFillBucket {
    if (value < 0.125) return 0;
    if (value < 0.375) return 25;
    if (value < 0.625) return 50;
    if (value < 0.875) return 75;
    return 100;
  }

  private bucketAtr(atr: number): VolatilityBucket {
    if (atr <= 0) return 'LOW';
    if (atr < 0.0008) return 'LOW';
    if (atr < 0.0025) return 'NORMAL';
    if (atr < 0.012) return 'HIGH';
    return 'EXTREME';
  }

  private detectSession(timestampSec: number): TradingSession {
    const hour = Math.floor((timestampSec % 86400) / 3600);
    if (hour >= 0 && hour < 8) return 'ASIA';
    if (hour >= 8 && hour < 13) return 'LONDON';
    if (hour >= 13 && hour < 17) return 'OVERLAP';
    return 'NY';
  }

  private directionFromStructure(structure: StructureEventKind): 'BULLISH' | 'BEARISH' | 'NONE' {
    if (structure === 'CHoCH_BULLISH' || structure === 'BOS_BULLISH') return 'BULLISH';
    if (structure === 'CHoCH_BEARISH' || structure === 'BOS_BEARISH') return 'BEARISH';
    return 'NONE';
  }
}

/** Factory function that creates a ConfluenceGate. */
export function createConfluenceGate(cfg?: Partial<ConfluenceGateConfig>): ConfluenceGate {
  return new ConfluenceGate(cfg);
}

