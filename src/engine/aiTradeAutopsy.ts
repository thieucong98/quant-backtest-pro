/**
 * Quant Backtest Pro — AI Trade Post-Mortem & Forensic Diagnostic Engine
 * "Khám Nghiệm Lệnh Thua"
 * Features:
 *  - Blackbox trade snapshot extraction (Price, PnL, Indicators, SMC Context, News Events)
 *  - Algorithmic Forensic Diagnosis & Root Cause Classification
 *  - Discipline Score (0 - 100) computation
 *  - Actionable Quantitative Prescription
 */

import { Position } from '../types/order';
import { Candle, InstrumentSpec } from '../types/market';
import { EconomicNewsEvent } from '../config/newsEvents';
import { MTFSemanticVector } from '../types/smc';

export type AutopsyRootCause =
  | 'NEWS_COLLISION'
  | 'COUNTER_HTF_TREND'
  | 'FOMO_PRICE_CHASE'
  | 'SL_MANAGEMENT_FAILURE'
  | 'PROBABILISTIC_LOSS';

export interface AutopsyTelemetry {
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  realizedPnL: number;
  lossPips: number;
  entryTime: number;
  exitTime: number;
  durationMinutes: number;
  rsiAtEntry?: number;
  atrAtEntry?: number;
  htfBias?: string;
  dealingRangeLoc?: string;
  nearbyNews?: EconomicNewsEvent | null;
}

export interface TradeAutopsyReport {
  tradeId: string;
  disciplineScore: number; // 0 - 100
  rootCause: AutopsyRootCause;
  rootCauseTitle: string;
  marketContext: string;
  prescription: string[];
  telemetry: AutopsyTelemetry;
}

export class AITradeAutopsyEngine {
  /**
   * Diagnoses a closed losing trade based on comprehensive market telemetry
   */
  public static diagnoseTrade(
    trade: Position,
    instrument: InstrumentSpec,
    candles: Candle[],
    economicNews: EconomicNewsEvent[] = [],
    mtfVector?: MTFSemanticVector | null
  ): TradeAutopsyReport {
    const pip = instrument.pipSize || 0.0001;
    const entryPrice = trade.entryPrice;
    const exitPrice = trade.closePrice ?? trade.entryPrice;
    const isBuy = trade.side === 'BUY';
    const lossPips = isBuy
      ? Number(((entryPrice - exitPrice) / pip).toFixed(1))
      : Number(((exitPrice - entryPrice) / pip).toFixed(1));

    const entryTime = trade.openTime;
    const exitTime = trade.closeTime ?? Date.now();
    const durationMinutes = Math.max(Math.round((exitTime - entryTime) / 60000), 1);

    // 1. Check for nearby High Impact economic news within ±30 mins
    const entryEpoch = Math.floor(entryTime / 1000);
    const nearbyNews = economicNews.find(
      (n) =>
        n.impact === 'HIGH' &&
        Math.abs(n.timestamp - entryEpoch) <= 1800
    ) || null;

    // 2. Multi-Timeframe SMC Bias Check
    const htfH4 = mtfVector?.bias?.h4 || 'NEUTRAL';
    const loc = mtfVector?.location || 'EQUILIBRIUM';
    const isCounterTrend =
      (isBuy && (htfH4 === 'BEARISH' || loc === 'PREMIUM')) ||
      (!isBuy && (htfH4 === 'BULLISH' || loc === 'DISCOUNT'));

    // 3. Quick entry indicators estimation from candles
    let rsiEstimate = 50;
    let atrEstimate = 0.0015;
    if (candles && candles.length > 20) {
      const closes = candles.slice(-20).map((c) => c.close);
      const changes = closes.slice(1).map((c, i) => c - closes[i]);
      const gains = changes.filter((c) => c > 0).reduce((a, b) => a + b, 0) / 14;
      const losses = Math.abs(changes.filter((c) => c < 0).reduce((a, b) => a + b, 0)) / 14;
      const rs = losses > 0 ? gains / losses : 1;
      rsiEstimate = Math.round(100 - 100 / (1 + rs));
      atrEstimate = Math.abs(candles[candles.length - 1].high - candles[candles.length - 1].low);
    }

    const isFomo =
      (isBuy && rsiEstimate > 72) ||
      (!isBuy && rsiEstimate < 28);

    const isSlFailure = lossPips > 50 || !trade.stopLoss;

    // Determine primary root cause and discipline score
    let rootCause: AutopsyRootCause = 'PROBABILISTIC_LOSS';
    let disciplineScore = 88;
    let rootCauseTitle = 'Valid Setup Executed (Probabilistic Loss)';
    let marketContext = `Asset: ${instrument.symbol} | Dealing Range: ${loc} | HTF Bias: ${htfH4}. Entry price conformed to technical setup, but random market noise hit SL.`;
    const prescription: string[] = [];

    if (nearbyNews) {
      rootCause = 'NEWS_COLLISION';
      disciplineScore = 42;
      rootCauseTitle = `High-Impact News Collision: ${nearbyNews.title} (${nearbyNews.currency})`;
      marketContext = `Position opened within 30 minutes of high-impact event "${nearbyNews.title}". Violent volatility spikes caused severe slippage and immediate stop-out.`;
      prescription.push('Activate Pre-News Auto Blackout filter (pause trades ±15 mins around Red News).');
      prescription.push('Check the Economic Calendar tab before taking manual or bot discretionary trades.');
    } else if (isCounterTrend) {
      rootCause = 'COUNTER_HTF_TREND';
      disciplineScore = 55;
      rootCauseTitle = `Counter-Trend Violation: Trading Against Higher-Timeframe ${htfH4} Trend`;
      marketContext = `Attempted ${trade.side} order while H4 Institutional Bias was ${htfH4} in ${loc} zone. Institutional liquidity swept the order book against the position.`;
      prescription.push('Always align entry direction with H4 / D1 Bias.');
      prescription.push('Enforce rule: Never BUY in Premium dealing range, never SELL in Discount dealing range.');
    } else if (isFomo) {
      rootCause = 'FOMO_PRICE_CHASE';
      disciplineScore = 48;
      rootCauseTitle = 'FOMO Price Chasing at Overextended Extremes';
      marketContext = `Entry occurred when RSI was extended at ${rsiEstimate}. Price had already completed its primary expansion leg and pulled back violently.`;
      prescription.push('Wait for pullbacks to Value Areas or Fair Value Gaps (FVG) instead of market-order chasing.');
      prescription.push('Use Limit orders with patience at structural key levels.');
    } else if (isSlFailure) {
      rootCause = 'SL_MANAGEMENT_FAILURE';
      disciplineScore = 35;
      rootCauseTitle = 'Discipline Breach: Stop Loss Too Wide or Uncontrolled';
      marketContext = `Loss of ${lossPips} pips exceeded the planned risk budget per trade.`;
      prescription.push('Cap maximum risk per trade at 1.0% - 2.0% of total balance.');
      prescription.push('Always pre-set hard Stop Loss at market entry.');
    } else {
      prescription.push('Maintain discipline and keep trading the edge. Every profitable system experiences controlled variance.');
      prescription.push('Continue respecting your Risk:Reward ratio (minimum 1:1.5 - 1:2.0).');
    }

    const telemetry: AutopsyTelemetry = {
      symbol: instrument.symbol,
      side: trade.side,
      entryPrice,
      exitPrice,
      lotSize: trade.lotSize,
      realizedPnL: trade.realizedPnL || 0,
      lossPips,
      entryTime,
      exitTime,
      durationMinutes,
      rsiAtEntry: rsiEstimate,
      atrAtEntry: atrEstimate,
      htfBias: htfH4,
      dealingRangeLoc: loc,
      nearbyNews
    };

    return {
      tradeId: trade.id,
      disciplineScore,
      rootCause,
      rootCauseTitle,
      marketContext,
      prescription,
      telemetry
    };
  }
}
