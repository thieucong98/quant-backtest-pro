/**
 * Quant Backtest Pro — Tier 1 SMC Perception Engine
 * Algorithmic Smart Money Concepts (Fractals, BOS/CHoCH, OB, FVG, Sweeps, Premium/Discount)
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 * Performance contract: O(1) amortized per bar, ≤ 1.8 ms target / 5 ms hard ceiling.
 * Author: Vulcan (Senior SWE) under Daedalus (CTO) architectural direction.
 */

import type { Candle } from '../../types/market';
import type {
  PivotState as Pivot,
  PivotKind,
  StructureEvent,
  StructureEventKind,
  OrderBlock,
  OBDirection,
  OBState,
  FairValueGap,
  FVGOriginKind,
  FVGState,
  LiquiditySweep,
  LiquidityKind,
  PremiumDiscountLocation,
  SMCFrameSnapshot,
  MTFSemanticVector,
  BiasTag,
  VolatilityBucket,
  TradingSession,
  SweepKind,
  StructureDirection,
  OBFillBucket,
  CoTStreamChunk,
  OverlayPrimitive,
} from '../../types/smc';

// =============================================================================
// Internal helpers — typed-array monotonic deque
// =============================================================================

class MonotonicMinMaxQueue {
  private readonly data: Int32Array;
  private readonly values: Float64Array;
  private head = 0;
  private tail = 0;

  constructor(capacity: number) {
    this.data = new Int32Array(capacity);
    this.values = new Float64Array(capacity);
  }

  reset(): void {
    this.head = 0;
    this.tail = 0;
  }

  pushMax(idx: number, value: number): void {
    while (this.tail > this.head && this.values[this.tail - 1] < value) {
      this.tail -= 1;
    }
    this.data[this.tail] = idx;
    this.values[this.tail] = value;
    this.tail += 1;
  }

  pushMin(idx: number, value: number): void {
    while (this.tail > this.head && this.values[this.tail - 1] > value) {
      this.tail -= 1;
    }
    this.data[this.tail] = idx;
    this.values[this.tail] = value;
    this.tail += 1;
  }

  evictLeft(boundary: number): void {
    while (this.head < this.tail && this.data[this.head] < boundary) {
      this.head += 1;
    }
  }

  front(): number {
    return this.data[this.head];
  }

  frontValue(): number {
    return this.values[this.head];
  }

  isEmpty(): boolean {
    return this.head === this.tail;
  }
}

// =============================================================================
// Engine configuration
// =============================================================================

export interface SmcEngineConfig {
  readonly symbol: string;
  readonly higherTF: 'D1' | 'H4';
  readonly lowerTF: 'M5' | 'M1';
  readonly fractalRadiusHTF: 5;
  readonly fractalRadiusLTF: 2;
  readonly confluenceThreshold: number;
  readonly obLookback: number;
  readonly fvgLookback: number;
  readonly sweepLookback: number;
  readonly pivotLookback: number;
  readonly atrPeriod: number;
  readonly maxActiveOBs: number;
  readonly maxActiveFVGs: number;
  readonly maxSweeps: number;
  readonly wickRejectionMin: number;
  readonly volumeMultiplierMin: number;
  readonly bslEqualToleranceATR: number;
}

export interface SmcEngineStats {
  lastBarLatencyMs: number;
  avgLatencyMs: number;
  heapAllocBytes: number;
  framesEmitted: number;
  barsProcessed: number;
  pivotsConfirmed: number;
  bosCount: number;
  chochCount: number;
  obsTracked: number;
  fvgsTracked: number;
  sweepsDetected: number;
  gateTriggers: number;
}

const DEFAULT_CONFIG: SmcEngineConfig = {
  symbol: 'BTCUSDT',
  higherTF: 'H4',
  lowerTF: 'M5',
  fractalRadiusHTF: 5,
  fractalRadiusLTF: 2,
  confluenceThreshold: 0.75,
  obLookback: 200,
  fvgLookback: 200,
  sweepLookback: 100,
  pivotLookback: 256,
  atrPeriod: 14,
  maxActiveOBs: 32,
  maxActiveFVGs: 16,
  maxSweeps: 8,
  wickRejectionMin: 0.5,
  volumeMultiplierMin: 1.5,
  bslEqualToleranceATR: 0.25,
};

// =============================================================================
// SmcEngine — Tier 1 main class
// =============================================================================

export class SmcEngine {
  private cfg: SmcEngineConfig;
  private readonly highQueue: MonotonicMinMaxQueue;
  private readonly lowQueue: MonotonicMinMaxQueue;
  private readonly pivots: Pivot[] = [];
  private readonly orderBlocks: OrderBlock[] = [];
  private readonly fvgs: FairValueGap[] = [];
  private readonly sweeps: LiquiditySweep[] = [];
  private readonly structureEvents: StructureEvent[] = [];

  private readonly ohlcRing: Float64Array;
  private readonly htfCloseRing: Float64Array;
  private readonly ringCapacity: number;
  private ringHead = 0;
  private ringFilled = 0;

  private readonly atrRing: Float64Array;
  private atrHead = 0;
  private atrFilled = 0;
  private atrSum = 0;
  private prevClose = NaN;
  private currentATR = 0;

  private readonly volSmaRing: Float64Array;
  private volSmaHead = 0;
  private volSmaFilled = 0;
  private volSmaSum = 0;
  private currentVolSma = 0;

  private trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  private lastSH: Pivot | null = null;
  private lastSL: Pivot | null = null;
  private lastEvent: StructureEvent | null = null;
  private lastEventBar = -1;
  private htfBias: BiasTag = 'NEUTRAL';

  private lastOpposingCandle: { barIndex: number; candle: Candle } | null = null;
  private lastThreeCandles: [Candle, Candle, Candle] | null = null;

  private dealingRangeHigh = 0;
  private dealingRangeLow = 0;

  private barsProcessed = 0;
  private currentBarIndex = 0;
  private currentBarTimestamp = 0;
  private lastBarLatencyMs = 0;
  private totalLatencyMs = 0;
  private heapAllocBytes = 0;
  private framesEmitted = 0;
  private bosCount = 0;
  private chochCount = 0;
  private sweepsDetected = 0;
  private gateTriggers = 0;
  private lastFrameSnapshot: SMCFrameSnapshot | null = null;

  constructor(config: Partial<SmcEngineConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    const cap = Math.max(this.cfg.pivotLookback * 2, 2048);
    this.ringCapacity = cap;
    this.highQueue = new MonotonicMinMaxQueue(cap);
    this.lowQueue = new MonotonicMinMaxQueue(cap);
    this.ohlcRing = new Float64Array(cap * 4);
    this.htfCloseRing = new Float64Array(cap);
    this.atrRing = new Float64Array(this.cfg.atrPeriod);
    this.volSmaRing = new Float64Array(20);
  }

  reset(preservePivots = false): void {
    this.highQueue.reset();
    this.lowQueue.reset();
    this.ringHead = 0;
    this.ringFilled = 0;
    this.atrHead = 0;
    this.atrFilled = 0;
    this.atrSum = 0;
    this.volSmaHead = 0;
    this.volSmaFilled = 0;
    this.volSmaSum = 0;
    this.currentVolSma = 0;
    this.prevClose = NaN;
    this.currentATR = 0;
    this.trend = 'NEUTRAL';
    this.lastSH = null;
    this.lastSL = null;
    this.lastEvent = null;
    this.lastEventBar = -1;
    this.htfBias = 'NEUTRAL';
    this.lastOpposingCandle = null;
    this.lastThreeCandles = null;
    this.dealingRangeHigh = 0;
    this.dealingRangeLow = 0;
    this.barsProcessed = 0;
    this.currentBarIndex = 0;
    this.currentBarTimestamp = 0;
    this.lastBarLatencyMs = 0;
    this.totalLatencyMs = 0;
    this.heapAllocBytes = 0;
    this.framesEmitted = 0;
    this.bosCount = 0;
    this.chochCount = 0;
    this.sweepsDetected = 0;
    this.gateTriggers = 0;
    this.lastFrameSnapshot = null;
    if (!preservePivots) {
      this.pivots.length = 0;
      this.orderBlocks.length = 0;
      this.fvgs.length = 0;
      this.sweeps.length = 0;
      this.structureEvents.length = 0;
    }
  }

  setGateThreshold(sigmaMin: number): void {
    this.cfg = { ...this.cfg, confluenceThreshold: sigmaMin };
  }

  updateBar(bar: Candle, higherTFBar?: Candle): SMCFrameSnapshot | null {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.currentBarTimestamp = bar.timestamp;
    this.currentBarIndex = this.barsProcessed;

    this.pushOHLC(bar);
    if (higherTFBar) {
      this.htfCloseRing[(this.ringHead - 1 + this.ringCapacity) % this.ringCapacity] = higherTFBar.close;
      this.updateHTFBias(higherTFBar);
    }
    this.pushVolumeSMA(bar.volume);

    this.updateATR(bar);

    const winHTF = this.cfg.fractalRadiusHTF;
    this.highQueue.evictLeft(this.currentBarIndex - winHTF);
    this.lowQueue.evictLeft(this.currentBarIndex - winHTF);
    this.highQueue.pushMax(this.currentBarIndex, bar.high);
    this.lowQueue.pushMin(this.currentBarIndex, bar.low);

    this.detectFractals(bar);
    this.detectStructure(bar);
    this.updateOrderBlocks(bar);
    this.detectFVG(bar);
    this.updateFVGs(bar);
    this.detectSweep(bar);
    this.updateDealingRange();

    if (this.lastThreeCandles === null) {
      this.lastThreeCandles = [bar, bar, bar];
    } else {
      this.lastThreeCandles = [this.lastThreeCandles[1], this.lastThreeCandles[2], bar];
    }

    this.barsProcessed += 1;
    const frame = this.buildFrameSnapshot(bar);
    this.lastFrameSnapshot = frame;
    this.framesEmitted += 1;

    const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.lastBarLatencyMs = t1 - t0;
    this.totalLatencyMs += this.lastBarLatencyMs;
    return frame;
  }

  bulkReplay(bars: readonly Candle[], htfBars?: readonly Candle[]): SMCFrameSnapshot | null {
    let htfCursor = 0;
    let lastFrame: SMCFrameSnapshot | null = null;
    for (let idx = 0; idx < bars.length; idx += 1) {
      const bar = bars[idx];
      let htfBar: Candle | undefined;
      if (htfBars && htfCursor < htfBars.length) {
        while (htfCursor + 1 < htfBars.length && htfBars[htfCursor + 1].timestamp <= bar.timestamp) {
          htfCursor += 1;
        }
        htfBar = htfBars[htfCursor];
      }
      lastFrame = this.updateBar(bar, htfBar);
    }
    return lastFrame;
  }

  buildFrameSnapshot(bar: Candle): SMCFrameSnapshot {
    const location = this.computeLocation(bar.close);
    const mtf = this.toMTFVector();
    const score = this.computeConfluenceScore(bar, mtf);
    const shouldFire = score >= this.cfg.confluenceThreshold;
    if (shouldFire) this.gateTriggers += 1;

    const activeOBs = this.orderBlocks
      .filter(o => o.state === 'UNMITIGATED' || o.state === 'PARTIAL' || o.state === 'FULLY_MITIGATED')
      .slice(-this.cfg.maxActiveOBs)
      .map(o => o.id);
    const activeFVGs = this.fvgs
      .filter(f => f.state === 'OPEN' || f.state === 'PARTIAL')
      .slice(-this.cfg.maxActiveFVGs)
      .map(f => f.id);
    const recentSwps = this.sweeps
      .slice(-this.cfg.maxSweeps)
      .map(s => s.id);

    const lastEvtBarAgo = this.lastEventBar >= 0 ? (this.barsProcessed - 1 - this.lastEventBar) : 9999;

    return {
      barIndex: this.barsProcessed - 1,
      timestamp: bar.timestamp,
      close: bar.close,
      trend: this.trend,
      structure: (this.lastEvent?.kind ?? 'NONE') as StructureEventKind,
      lastPivotId: this.lastSH?.id ?? this.lastSL?.id ?? null,
      lastEventBarAgo: lastEvtBarAgo,
      premiumDiscount: location,
      dealingRangeHigh: this.dealingRangeHigh,
      dealingRangeLow: this.dealingRangeLow,
      equilibrium: (this.dealingRangeHigh + this.dealingRangeLow) / 2,
      activeOrderBlocks: activeOBs,
      activeFairValueGaps: activeFVGs,
      recentSweeps: recentSwps,
      atr14: this.currentATR,
      confluenceScore: score,
      shouldFireLLM: shouldFire,
    };
  }

  getPivots(): readonly Pivot[] {
    return this.pivots;
  }

  getOrderBlocks(): readonly OrderBlock[] {
    return this.orderBlocks;
  }

  getFVGs(): readonly FairValueGap[] {
    return this.fvgs;
  }

  getSweeps(): readonly LiquiditySweep[] {
    return this.sweeps;
  }

  getStructureEvents(): readonly StructureEvent[] {
    return this.structureEvents;
  }

  getStats(): SmcEngineStats {
    return {
      lastBarLatencyMs: this.lastBarLatencyMs,
      avgLatencyMs: this.barsProcessed > 0 ? this.totalLatencyMs / this.barsProcessed : 0,
      heapAllocBytes: this.heapAllocBytes,
      framesEmitted: this.framesEmitted,
      barsProcessed: this.barsProcessed,
      pivotsConfirmed: this.pivots.length,
      bosCount: this.bosCount,
      chochCount: this.chochCount,
      obsTracked: this.orderBlocks.length,
      fvgsTracked: this.fvgs.length,
      sweepsDetected: this.sweepsDetected,
      gateTriggers: this.gateTriggers,
    };
  }

  toMTFVector(): MTFSemanticVector {
    const h4Bias = this.htfBias;
    const d1Bias = this.htfBias;
    const midPrice =
      this.lastSH && this.lastSL
        ? (this.lastSH.price + this.lastSL.price) / 2
        : this.ohlcRing[((this.ringHead - 1 + this.ringCapacity) % this.ringCapacity) * 4 + 3] || 1;
    const location = this.computeLocation(midPrice);
    const activeOB = this.findActiveOB();
    const activeFVG = this.findActiveFVG();
    const recentSwp = this.sweeps.length > 0 ? this.sweeps[this.sweeps.length - 1] : null;
    const recentBarsAgo = recentSwp ? Math.max(0, this.barsProcessed - 1 - recentSwp.originBarIndex) : 9999;

    const lastChoch = this.findLastCHoCH();
    const lastChochBarsAgo = lastChoch ? Math.max(0, this.barsProcessed - 1 - (lastChoch.confirmedBarIndex ?? 0)) : 9999;
    const chochDir: StructureDirection =
      lastChoch && (lastChoch.kind === 'CHoCH_BULLISH' || lastChoch.kind === 'CHoCH_BEARISH')
        ? (lastChoch.kind === 'CHoCH_BULLISH' ? 'BULLISH' : 'BEARISH')
        : 'NONE';

    return {
      bias: { h4: h4Bias, d1: d1Bias },
      location,
      activeOB: {
        direction: activeOB?.direction ?? 'BULLISH',
        state: activeOB?.state ?? 'UNMITIGATED',
        fillRatioBucket: this.bucketFillRatio(activeOB?.fillRatio ?? 0),
      },
      activeFVG: {
        direction: activeFVG?.direction ?? 'BULLISH',
        state: activeFVG?.state ?? 'OPEN',
        fillRatioBucket: this.bucketFillRatio(activeFVG?.fillRatio ?? 0),
      },
      recentSweep: {
        kind: recentSwp ? (recentSwp.kind === 'BSL_SWEEP' ? 'BSL' : 'SSL') : 'NONE',
        barsAgo: recentBarsAgo,
      },
      recentCHoCH: {
        direction: chochDir,
        barsAgo: lastChochBarsAgo,
      },
      volatility: {
        atrBucket: this.bucketATR(),
        session: this.guessSession(),
      },
    };
  }

  // ===========================================================================
  // Internal — OHLC ring / ATR / Volume SMA / HTF bias
  // ===========================================================================

  private pushOHLC(bar: Candle): void {
    const head = this.ringHead;
    this.ohlcRing[head * 4 + 0] = bar.open;
    this.ohlcRing[head * 4 + 1] = bar.high;
    this.ohlcRing[head * 4 + 2] = bar.low;
    this.ohlcRing[head * 4 + 3] = bar.close;
    this.ringHead = (head + 1) % this.ringCapacity;
    if (this.ringFilled < this.ringCapacity) this.ringFilled += 1;
  }

  private pushVolumeSMA(volume: number): void {
    const head = this.volSmaHead;
    if (this.volSmaFilled < this.volSmaRing.length) {
      this.volSmaRing[head] = volume;
      this.volSmaSum += volume;
      this.volSmaFilled += 1;
    } else {
      this.volSmaSum -= this.volSmaRing[head];
      this.volSmaRing[head] = volume;
      this.volSmaSum += volume;
    }
    this.volSmaHead = (head + 1) % this.volSmaRing.length;
    if (this.volSmaFilled > 0) {
      this.currentVolSma = this.volSmaSum / this.volSmaFilled;
    }
  }

  private updateATR(bar: Candle): void {
    const prev = this.prevClose;
    if (Number.isNaN(prev)) {
      const tr = bar.high - bar.low;
      this.atrRing[this.atrHead] = tr;
      this.atrSum = tr;
      this.atrFilled = Math.min(this.atrFilled + 1, this.atrRing.length);
    } else {
      const tr = Math.max(
        bar.high - bar.low,
        Math.abs(bar.high - prev),
        Math.abs(bar.low - prev),
      );
      this.atrSum -= this.atrRing[this.atrHead];
      this.atrRing[this.atrHead] = tr;
      this.atrSum += tr;
    }
    this.atrHead = (this.atrHead + 1) % this.atrRing.length;
    this.prevClose = bar.close;
    if (this.atrFilled > 0) {
      this.currentATR = this.atrSum / this.atrFilled;
    }
  }

  private updateHTFBias(bar: Candle): void {
    if (bar.close > bar.open) this.htfBias = 'BULLISH';
    else if (bar.close < bar.open) this.htfBias = 'BEARISH';
    else this.htfBias = 'NEUTRAL';
  }

  // ===========================================================================
  // Fractal detection
  // ===========================================================================

  private detectFractals(bar: Candle): void {
    const K = this.cfg.fractalRadiusHTF;
    if (this.barsProcessed < K) return;
    const pivotIdx = this.currentBarIndex - K;
    if (pivotIdx < 0) return;
    if (!this.highQueue.isEmpty() && this.highQueue.front() === pivotIdx) {
      const price = this.highQueue.frontValue();
      const newP: Pivot = {
        id: `SH-${pivotIdx}`,
        barIndex: pivotIdx,
        timestamp: pivotIdx,
        price,
        kind: 'HIGH' as PivotKind,
        radius: 5 as const,
      };
      this.pivots.push(newP);
      this.lastSH = newP;
      this.lastOpposingCandle = this.findLastCandle();
    }
    if (!this.lowQueue.isEmpty() && this.lowQueue.front() === pivotIdx) {
      const price = this.lowQueue.frontValue();
      const newP: Pivot = {
        id: `SL-${pivotIdx}`,
        barIndex: pivotIdx,
        timestamp: pivotIdx,
        price,
        kind: 'LOW' as PivotKind,
        radius: 5 as const,
      };
      this.pivots.push(newP);
      this.lastSL = newP;
      this.lastOpposingCandle = this.findLastCandle();
    }
  }

  private findLastCandle(): { barIndex: number; candle: Candle } | null {
    if (this.barsProcessed < 1) return null;
    const idx = (this.ringHead - 2 + this.ringCapacity) % this.ringCapacity;
    const open = this.ohlcRing[idx * 4 + 0];
    if (open === 0 && this.barsProcessed === 1) return null;
    const candle: Candle = {
      timestamp: this.currentBarTimestamp - 1,
      open,
      high: this.ohlcRing[idx * 4 + 1],
      low: this.ohlcRing[idx * 4 + 2],
      close: this.ohlcRing[idx * 4 + 3],
      volume: 0,
    };
    return { barIndex: this.barsProcessed - 2, candle };
  }

  // ===========================================================================
  // Structure (BOS / CHoCH)
  // ===========================================================================

  private detectStructure(bar: Candle): void {
    if (!this.lastSH && !this.lastSL) return;
    const prevTrend = this.trend;
    const close = bar.close;
    if (this.lastSH && close > this.lastSH.price) {
      const isChoch = prevTrend === 'BEARISH';
      const evt: StructureEvent = {
        id: `${isChoch ? 'CHoCH' : 'BOS'}-BULL-${this.barsProcessed}`,
        kind: isChoch ? 'CHoCH_BULLISH' : 'BOS_BULLISH',
        pivotId: this.lastSH.id,
        brokenPrice: this.lastSH.price,
        confirmedBarIndex: this.barsProcessed - 1,
        timestamp: bar.timestamp,
      };
      this.lastEvent = evt;
      this.lastEventBar = this.barsProcessed - 1;
      this.structureEvents.push(evt);
      if (isChoch) {
        this.chochCount += 1;
        this.registerOB(evt, 'BULLISH');
      } else {
        this.bosCount += 1;
      }
      this.trend = 'BULLISH';
    } else if (this.lastSL && close < this.lastSL.price) {
      const isChoch = prevTrend === 'BULLISH';
      const evt: StructureEvent = {
        id: `${isChoch ? 'CHoCH' : 'BOS'}-BEAR-${this.barsProcessed}`,
        kind: isChoch ? 'CHoCH_BEARISH' : 'BOS_BEARISH',
        pivotId: this.lastSL.id,
        brokenPrice: this.lastSL.price,
        confirmedBarIndex: this.barsProcessed - 1,
        timestamp: bar.timestamp,
      };
      this.lastEvent = evt;
      this.lastEventBar = this.barsProcessed - 1;
      this.structureEvents.push(evt);
      if (isChoch) {
        this.chochCount += 1;
        this.registerOB(evt, 'BEARISH');
      } else {
        this.bosCount += 1;
      }
      this.trend = 'BEARISH';
    }
  }

  private registerOB(evt: StructureEvent, dir: OBDirection): void {
    const opp = this.lastOpposingCandle;
    if (!opp) return;
    const c = opp.candle;
    const ob: OrderBlock = {
      id: `OB-${this.barsProcessed}-${dir}`,
      direction: dir,
      top: dir === 'BULLISH' ? Math.max(c.open, c.close) : c.high,
      bottom: dir === 'BULLISH' ? c.low : Math.min(c.open, c.close),
      originBarIndex: opp.barIndex,
      timestamp: opp.candle.timestamp,
      state: 'UNMITIGATED' as OBState,
      fillRatio: 0,
    };
    void evt;
    this.orderBlocks.push(ob);
    if (this.orderBlocks.length > this.cfg.obLookback) {
      this.orderBlocks.splice(0, this.orderBlocks.length - this.cfg.obLookback);
    }
  }

  // ===========================================================================
  // OB mitigation / violation
  // ===========================================================================

  private updateOrderBlocks(bar: Candle): void {
    for (const ob of this.orderBlocks) {
      if (ob.state === 'VIOLATED') continue;
      const ce = (ob.top + ob.bottom) / 2;
      if (ob.direction === 'BULLISH') {
        if (bar.low <= ob.bottom) {
          ob.state = 'VIOLATED';
          ob.fillRatio = 1;
        } else if (bar.low <= ce) {
          ob.state = 'FULLY_MITIGATED';
          ob.fillRatio = Math.max(ob.fillRatio, (ob.top - bar.low) / Math.max(1e-9, ob.top - ob.bottom));
        } else if (bar.low < ob.top) {
          ob.state = 'PARTIAL';
          ob.fillRatio = Math.max(ob.fillRatio, (ob.top - bar.low) / Math.max(1e-9, ob.top - ob.bottom));
        }
      } else {
        if (bar.high >= ob.top) {
          ob.state = 'VIOLATED';
          ob.fillRatio = 1;
        } else if (bar.high >= ce) {
          ob.state = 'FULLY_MITIGATED';
          ob.fillRatio = Math.max(ob.fillRatio, (bar.high - ob.bottom) / Math.max(1e-9, ob.top - ob.bottom));
        } else if (bar.high > ob.bottom) {
          ob.state = 'PARTIAL';
          ob.fillRatio = Math.max(ob.fillRatio, (bar.high - ob.bottom) / Math.max(1e-9, ob.top - ob.bottom));
        }
      }
      ob.fillRatio = Math.min(1, Math.max(0, ob.fillRatio));
    }
  }

  // ===========================================================================
  // FVG detection (imbalance) & mitigation
  // ===========================================================================

  private detectFVG(bar: Candle): void {
    if (!this.lastThreeCandles) return;
    const [c0, , c2] = this.lastThreeCandles;
    if (c2.low > c0.high) {
      const fvg: FairValueGap = {
        id: `FVG-BULL-${this.barsProcessed}`,
        direction: 'BULLISH' as FVGOriginKind,
        top: c2.low,
        bottom: c0.high,
        ce: (c2.low + c0.high) / 2,
        originBarIndex: this.barsProcessed - 1,
        timestamp: bar.timestamp,
        state: 'OPEN' as FVGState,
        fillRatio: 0,
      };
      this.fvgs.push(fvg);
    }
    if (c2.high < c0.low) {
      const fvg: FairValueGap = {
        id: `FVG-BEAR-${this.barsProcessed}`,
        direction: 'BEARISH' as FVGOriginKind,
        top: c0.low,
        bottom: c2.high,
        ce: (c0.low + c2.high) / 2,
        originBarIndex: this.barsProcessed - 1,
        timestamp: bar.timestamp,
        state: 'OPEN' as FVGState,
        fillRatio: 0,
      };
      this.fvgs.push(fvg);
    }
    if (this.fvgs.length > this.cfg.fvgLookback) {
      this.fvgs.splice(0, this.fvgs.length - this.cfg.fvgLookback);
    }
  }

  private updateFVGs(bar: Candle): void {
    for (const fvg of this.fvgs) {
      if (fvg.state === 'FILLED') continue;
      if (fvg.direction === 'BULLISH') {
        if (bar.low <= fvg.bottom) {
          fvg.state = 'FILLED';
          fvg.fillRatio = 1;
        } else if (bar.low < fvg.top) {
          const fill = (fvg.top - bar.low) / Math.max(1e-9, fvg.top - fvg.bottom);
          fvg.fillRatio = Math.max(fvg.fillRatio, fill);
          fvg.state = fvg.fillRatio >= 1 ? 'FILLED' : fvg.fillRatio > 0 ? 'PARTIAL' : 'OPEN';
        }
      } else {
        if (bar.high >= fvg.top) {
          fvg.state = 'FILLED';
          fvg.fillRatio = 1;
        } else if (bar.high > fvg.bottom) {
          const fill = (bar.high - fvg.bottom) / Math.max(1e-9, fvg.top - fvg.bottom);
          fvg.fillRatio = Math.max(fvg.fillRatio, fill);
          fvg.state = fvg.fillRatio >= 1 ? 'FILLED' : fvg.fillRatio > 0 ? 'PARTIAL' : 'OPEN';
        }
      }
      fvg.fillRatio = Math.min(1, Math.max(0, fvg.fillRatio));
    }
  }

  // ===========================================================================
  // Liquidity Sweep detection
  // ===========================================================================

  private detectSweep(bar: Candle): void {
    if (this.currentATR <= 0 || this.ringFilled < 5) return;
    const tol = this.cfg.bslEqualToleranceATR * this.currentATR;
    const lookback = Math.min(50, this.ringFilled - 1);
    if (lookback < 2) return;
    const highsCount = new Map<number, number>();
    const lowsCount = new Map<number, number>();
    for (let k = 1; k <= lookback; k += 1) {
      const idx = (this.ringHead - 1 - k + this.ringCapacity) % this.ringCapacity;
      const h = this.ohlcRing[idx * 4 + 1];
      const l = this.ohlcRing[idx * 4 + 2];
      let matchedHigh = false;
      for (const [base, count] of highsCount) {
        if (Math.abs(h - base) <= tol) {
          highsCount.set(base, count + 1);
          matchedHigh = true;
          break;
        }
      }
      if (!matchedHigh) highsCount.set(h, 1);
      let matchedLow = false;
      for (const [base, count] of lowsCount) {
        if (Math.abs(l - base) <= tol) {
          lowsCount.set(base, count + 1);
          matchedLow = true;
          break;
        }
      }
      if (!matchedLow) lowsCount.set(l, 1);
    }
    let bslPool: number | null = null;
    let sslPool: number | null = null;
    for (const [base, count] of highsCount) {
      if (count >= 2) {
        bslPool = base;
        break;
      }
    }
    for (const [base, count] of lowsCount) {
      if (count >= 2) {
        sslPool = base;
        break;
      }
    }

    const range = bar.high - bar.low;
    if (range <= 0) return;
    const volSma = this.currentVolSma;
    if (bslPool !== null && bar.high > bslPool && bar.close < bslPool) {
      const upperWick = bar.high - Math.max(bar.open, bar.close);
      const wickRatio = upperWick / range;
      const volMult = volSma > 0 ? bar.volume / volSma : 0;
      if (wickRatio >= this.cfg.wickRejectionMin && volMult >= this.cfg.volumeMultiplierMin) {
        this.recordSweep('BSL_SWEEP', bslPool, wickRatio, volMult, this.barsProcessed - 1, bar.timestamp);
      }
    }
    if (sslPool !== null && bar.low < sslPool && bar.close > sslPool) {
      const lowerWick = Math.min(bar.open, bar.close) - bar.low;
      const wickRatio = lowerWick / range;
      const volMult = volSma > 0 ? bar.volume / volSma : 0;
      if (wickRatio >= this.cfg.wickRejectionMin && volMult >= this.cfg.volumeMultiplierMin) {
        this.recordSweep('SSL_SWEEP', sslPool, wickRatio, volMult, this.barsProcessed - 1, bar.timestamp);
      }
    }
  }

  private recordSweep(kind: LiquidityKind, poolLevel: number, wickRatio: number, volMult: number, barIdx: number, ts: number): void {
    const sw: LiquiditySweep = {
      id: `SW-${kind}-${this.barsProcessed}`,
      kind,
      poolLevel,
      wickRejectionRatio: wickRatio,
      volumeMultiplier: volMult,
      originBarIndex: barIdx,
      timestamp: ts,
    };
    this.sweeps.push(sw);
    this.sweepsDetected += 1;
    if (this.sweeps.length > this.cfg.sweepLookback) {
      this.sweeps.splice(0, this.sweeps.length - this.cfg.sweepLookback);
    }
  }

  // ===========================================================================
  // Premium / Discount / EQ
  // ===========================================================================

  private updateDealingRange(): void {
    if (!this.lastSH || !this.lastSL) return;
    this.dealingRangeHigh = Math.max(this.lastSH.price, this.lastSL.price);
    this.dealingRangeLow = Math.min(this.lastSH.price, this.lastSL.price);
  }

  private computeLocation(price: number): PremiumDiscountLocation {
    if (this.dealingRangeHigh === 0 || this.dealingRangeLow === 0) return 'EQUILIBRIUM';
    const eq = (this.dealingRangeHigh + this.dealingRangeLow) / 2;
    const tol = Math.max(this.currentATR * 0.1, 1e-9);
    if (price > eq + tol) return 'PREMIUM';
    if (price < eq - tol) return 'DISCOUNT';
    return 'EQUILIBRIUM';
  }

  // ===========================================================================
  // Confluence scoring
  // ===========================================================================

  computeConfluenceScore(bar: Candle, mtf: MTFSemanticVector): number {
    let score = 0;
    const side: 'BULLISH' | 'BEARISH' = bar.close >= bar.open ? 'BULLISH' : 'BEARISH';
    if ((side === 'BULLISH' && mtf.bias.h4 === 'BULLISH') || (side === 'BEARISH' && mtf.bias.h4 === 'BEARISH')) {
      score += 0.3;
    }
    const obTapped = this.orderBlocks.some(
      o => (o.state === 'UNMITIGATED' || o.state === 'PARTIAL') && bar.low <= o.top && bar.high >= o.bottom,
    );
    const fvgTapped = this.fvgs.some(
      f => (f.state === 'OPEN' || f.state === 'PARTIAL') && bar.low <= f.top && bar.high >= f.bottom,
    );
    if (obTapped || fvgTapped) score += 0.3;
    const recentSwp = this.sweeps.find(s => this.barsProcessed - 1 - s.originBarIndex <= 8);
    if (recentSwp) score += 0.2;
    const lastChoch = this.findLastCHoCH();
    if (lastChoch && this.barsProcessed - 1 - (lastChoch.confirmedBarIndex ?? 0) <= 12) score += 0.2;
    return Math.min(1, score);
  }

  // ===========================================================================
  // MTF vector helpers
  // ===========================================================================

  private findActiveOB(): OrderBlock | null {
    for (let k = this.orderBlocks.length - 1; k >= 0; k -= 1) {
      const o = this.orderBlocks[k];
      if (o.state === 'UNMITIGATED' || o.state === 'PARTIAL' || o.state === 'FULLY_MITIGATED') return o;
    }
    return null;
  }

  private findActiveFVG(): FairValueGap | null {
    for (let k = this.fvgs.length - 1; k >= 0; k -= 1) {
      const f = this.fvgs[k];
      if (f.state === 'OPEN' || f.state === 'PARTIAL') return f;
    }
    return null;
  }

  private findLastCHoCH(): StructureEvent | null {
    if (!this.lastEvent) return null;
    if (this.lastEvent.kind === 'CHoCH_BULLISH' || this.lastEvent.kind === 'CHoCH_BEARISH') return this.lastEvent;
    return null;
  }

  private bucketFillRatio(fr: number): OBFillBucket {
    if (fr <= 0) return 0;
    if (fr <= 0.25) return 25;
    if (fr <= 0.5) return 50;
    if (fr <= 0.75) return 75;
    return 100;
  }

  private bucketATR(): VolatilityBucket {
    if (this.currentATR <= 0 || this.ringFilled === 0) return 'LOW';
    const ref = this.ohlcRing[((this.ringHead - 1 + this.ringCapacity) % this.ringCapacity) * 4 + 3] || 1e-9;
    const ratio = this.currentATR / Math.max(1e-9, ref);
    if (ratio < 0.002) return 'LOW';
    if (ratio < 0.02) return 'NORMAL';
    if (ratio < 0.05) return 'HIGH';
    return 'EXTREME';
  }

  private guessSession(): TradingSession {
    const ts = this.currentBarTimestamp > 1e12 ? this.currentBarTimestamp : this.currentBarTimestamp * 1000;
    const d = new Date(ts);
    const h = d.getUTCHours();
    if (h >= 0 && h < 7) return 'ASIA';
    if (h >= 7 && h < 12) return 'LONDON';
    if (h >= 12 && h < 16) return 'NY';
    if (h >= 16 && h < 21) return 'OVERLAP';
    return 'OVERLAP';
  }

  // ===========================================================================
  // Overlay projection
  // ===========================================================================

  toOverlayPrimitives(): OverlayPrimitive[] {
    const out: OverlayPrimitive[] = [];
    for (const ob of this.orderBlocks) {
      if (ob.state !== 'UNMITIGATED' && ob.state !== 'PARTIAL' && ob.state !== 'FULLY_MITIGATED') continue;
      out.push({
        id: ob.id,
        kind: ob.direction === 'BULLISH' ? 'ORDER_BLOCK_BULLISH' : 'ORDER_BLOCK_BEARISH',
        timeStart: ob.timestamp,
        timeEnd: ob.timestamp + 1000 * 60 * 60,
        priceHigh: ob.top,
        priceLow: ob.bottom,
        color: ob.direction === 'BULLISH' ? '#22c55e' : '#ef4444',
        alpha: 0.18,
        label: ob.id,
      });
    }
    for (const fvg of this.fvgs) {
      if (fvg.state !== 'OPEN' && fvg.state !== 'PARTIAL') continue;
      out.push({
        id: fvg.id,
        kind: fvg.direction === 'BULLISH' ? 'FVG_BULLISH' : 'FVG_BEARISH',
        timeStart: fvg.timestamp,
        timeEnd: fvg.timestamp + 1000 * 60 * 30,
        priceHigh: fvg.top,
        priceLow: fvg.bottom,
        color: fvg.direction === 'BULLISH' ? '#3b82f6' : '#a855f7',
        alpha: 0.12,
        label: fvg.id,
      });
    }
    for (const sw of this.sweeps.slice(-this.cfg.maxSweeps)) {
      out.push({
        id: sw.id,
        kind: sw.kind === 'BSL_SWEEP' ? 'SWEEP_BSL' : 'SWEEP_SSL',
        timeStart: sw.timestamp,
        timeEnd: sw.timestamp + 1000 * 60 * 15,
        priceHigh: sw.poolLevel + this.currentATR * 0.5,
        priceLow: sw.poolLevel - this.currentATR * 0.5,
        color: sw.kind === 'BSL_SWEEP' ? '#f97316' : '#06b6d4',
        alpha: 0.22,
        label: sw.id,
      });
    }
    return out;
  }

  emitCoTChunk(type: CoTStreamChunk['type'], delta: string): CoTStreamChunk {
    return { type, delta, timestamp: Date.now() };
  }
}

export function createSmcEngine(config: Partial<SmcEngineConfig> = {}): SmcEngine {
  return new SmcEngine(config);
}
