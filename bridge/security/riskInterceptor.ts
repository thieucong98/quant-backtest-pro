/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * Pre-Trade Risk Shield Interceptor & High-Frequency Circuit Breaker
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import {
  PropFirmShieldRules,
  PreTradeRiskEvaluationResult,
  CircuitBreakerStatus,
} from '../../src/types/executionBridge';
import { BrokerAccount, BrokerPosition, BrokerType, UnifiedOrderRequest } from '../../src/types/broker';

export const DEFAULT_PROP_RULES: PropFirmShieldRules = {
  maxDailyLossPct: 5.0,
  maxTrailingDrawdownPct: 10.0,
  maxTotalOpenLots: 20.0,
  maxOrderLotSize: 5.0,
  newsRestrictionMinutes: 5,
  maxAllowedLatencyMs: 250,
  weekendHoldingRestriction: true,
};

export class PreTradeRiskShieldInterceptor {
  private rules: PropFirmShieldRules;
  private circuitBreaker: CircuitBreakerStatus;
  private initialDailyBalance: number;
  private peakEquity: number;
  private measuredLatencyMs: number = 25;
  private recentOrderSignatures: Map<string, number> = new Map();
  private highImpactNewsTimes: number[] = [];

  constructor(
    rules: Partial<PropFirmShieldRules> = {},
    initialDailyBalance: number = 100000,
    broker: BrokerType = 'SIMULATION'
  ) {
    this.rules = { ...DEFAULT_PROP_RULES, ...rules };
    this.initialDailyBalance = initialDailyBalance;
    this.peakEquity = initialDailyBalance;

    this.circuitBreaker = {
      isActive: false,
      broker,
      lastTripTimestamp: null,
      resetScheduledAt: null,
      consecutiveTimeouts: 0,
      averageLatencyMs: 25,
    };
  }

  public updateRules(newRules: Partial<PropFirmShieldRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }

  public getRules(): PropFirmShieldRules {
    return { ...this.rules };
  }

  public getCircuitBreakerStatus(): CircuitBreakerStatus {
    return { ...this.circuitBreaker };
  }

  public updateDailyBaseline(balance: number): void {
    this.initialDailyBalance = balance;
    this.peakEquity = balance;
  }

  public updateLatency(latencyMs: number): void {
    this.measuredLatencyMs = latencyMs;
    this.circuitBreaker.averageLatencyMs = Math.round(
      this.circuitBreaker.averageLatencyMs * 0.8 + latencyMs * 0.2
    );

    if (latencyMs > this.rules.maxAllowedLatencyMs) {
      this.tripCircuitBreaker(
        this.circuitBreaker.broker,
        'EXCESSIVE_LATENCY',
        `Network round-trip latency (${latencyMs}ms) exceeded threshold (${this.rules.maxAllowedLatencyMs}ms)`
      );
    }
  }

  public tripCircuitBreaker(
    broker: BrokerType,
    reason: 'EXCESSIVE_LATENCY' | 'MAX_DAILY_LOSS_BREACH' | 'MAX_OPEN_LOTS_EXCEEDED' | 'CONNECTION_DROP',
    message: string
  ): void {
    const now = Date.now();
    this.circuitBreaker.isActive = true;
    this.circuitBreaker.broker = broker;
    this.circuitBreaker.lastTripTimestamp = now;
    this.circuitBreaker.resetScheduledAt = now + 60000; // 60s cooldown
    this.circuitBreaker.consecutiveTimeouts++;
  }

  public resetCircuitBreaker(): void {
    this.circuitBreaker.isActive = false;
    this.circuitBreaker.lastTripTimestamp = null;
    this.circuitBreaker.resetScheduledAt = null;
    this.circuitBreaker.consecutiveTimeouts = 0;
  }

  public setNewsCalendar(newsTimestampsSeconds: number[]): void {
    this.highImpactNewsTimes = [...newsTimestampsSeconds];
  }

  public evaluatePreTradeRisk(params: {
    order: UnifiedOrderRequest & { clientOrderId: string };
    currentAccount: BrokerAccount;
    openPositions: BrokerPosition[];
    currentTimestamp?: number;
  }): PreTradeRiskEvaluationResult {
    const { order, currentAccount, openPositions } = params;
    const nowSec = params.currentTimestamp ?? Math.floor(Date.now() / 1000);

    // 1. Idempotent Duplicate Order Check
    this.cleanupDeduplicationCache(nowSec);
    if (this.recentOrderSignatures.has(order.clientOrderId)) {
      return {
        allowed: false,
        ruleViolated: 'IDEMPOTENT_DUPLICATE_ORDER',
        reason: `Duplicate order clientOrderId=${order.clientOrderId} received within cooldown window.`,
      };
    }

    // 2. Circuit Breaker Active Check
    if (this.circuitBreaker.isActive) {
      return {
        allowed: false,
        ruleViolated: 'CIRCUIT_BREAKER_LATENCY_EXCEEDED',
        reason: `Pre-Trade Circuit Breaker is active for broker ${this.circuitBreaker.broker}. Reset required.`,
      };
    }

    // 3. Round-trip Broker Latency Check
    if (this.measuredLatencyMs > this.rules.maxAllowedLatencyMs) {
      this.tripCircuitBreaker(
        this.circuitBreaker.broker,
        'EXCESSIVE_LATENCY',
        `Broker latency ${this.measuredLatencyMs}ms exceeds max allowed ${this.rules.maxAllowedLatencyMs}ms`
      );
      return {
        allowed: false,
        ruleViolated: 'CIRCUIT_BREAKER_LATENCY_EXCEEDED',
        reason: `Broker latency (${this.measuredLatencyMs}ms) breached SLA limit (${this.rules.maxAllowedLatencyMs}ms).`,
      };
    }

    // 4. Single Order Lot Size Check
    if (order.lotSize > this.rules.maxOrderLotSize) {
      return {
        allowed: false,
        ruleViolated: 'MAX_ORDER_LOT_SIZE_EXCEEDED',
        reason: `Order lot size (${order.lotSize}) exceeds maximum allowable per-order limit (${this.rules.maxOrderLotSize} lots).`,
      };
    }

    // 5. Cumulative Total Open Lots Check
    const currentTotalLots = openPositions.reduce((sum, pos) => sum + (pos.lotSize || 0), 0);
    const projectedTotalLots = currentTotalLots + order.lotSize;
    if (projectedTotalLots > this.rules.maxTotalOpenLots) {
      return {
        allowed: false,
        ruleViolated: 'MAX_OPEN_LOTS_EXCEEDED',
        reason: `Projected open lots (${projectedTotalLots.toFixed(2)}) exceeds maximum cumulative exposure limit (${this.rules.maxTotalOpenLots} lots).`,
      };
    }

    // 6. Max Daily Loss Breach Check
    const currentEquity = currentAccount.equity;
    const dailyPnL = currentEquity - this.initialDailyBalance;
    if (dailyPnL < 0) {
      const dailyLossPct = (Math.abs(dailyPnL) / this.initialDailyBalance) * 100;
      if (dailyLossPct >= this.rules.maxDailyLossPct) {
        this.tripCircuitBreaker(this.circuitBreaker.broker, 'MAX_DAILY_LOSS_BREACH', 'Max daily loss breached');
        return {
          allowed: false,
          ruleViolated: 'MAX_DAILY_LOSS_BREACH',
          reason: `Daily loss (${dailyLossPct.toFixed(2)}%) reached or breached max daily loss limit (${this.rules.maxDailyLossPct}%).`,
        };
      }
    }

    // 7. Max Trailing High-Water-Mark Drawdown Check
    if (currentEquity > this.peakEquity) {
      this.peakEquity = currentEquity;
    }
    const currentDrawdown = this.peakEquity - currentEquity;
    if (currentDrawdown > 0 && this.peakEquity > 0) {
      const drawdownPct = (currentDrawdown / this.peakEquity) * 100;
      if (drawdownPct >= this.rules.maxTrailingDrawdownPct) {
        return {
          allowed: false,
          ruleViolated: 'MAX_TRAILING_DRAWDOWN_BREACH',
          reason: `Trailing drawdown (${drawdownPct.toFixed(2)}%) breached high-water-mark limit (${this.rules.maxTrailingDrawdownPct}%).`,
        };
      }
    }

    // 8. Weekend Holding Restriction Check
    if (this.rules.weekendHoldingRestriction) {
      const date = new Date(nowSec * 1000);
      const day = date.getUTCDay();
      const hours = date.getUTCHours();
      // Friday after 21:00 UTC or Saturday/Sunday
      const isWeekendRisk = (day === 5 && hours >= 21) || day === 6 || day === 0;
      if (isWeekendRisk) {
        return {
          allowed: false,
          ruleViolated: 'WEEKEND_HOLDING_RESTRICTION',
          reason: `Weekend holding rule forbids new positions ahead of Friday market close (after 21:00 UTC).`,
        };
      }
    }

    // 9. High-Impact News Window Restriction Check
    if (this.rules.newsRestrictionMinutes > 0 && this.highImpactNewsTimes.length > 0) {
      const windowSec = this.rules.newsRestrictionMinutes * 60;
      for (const newsTime of this.highImpactNewsTimes) {
        if (Math.abs(nowSec - newsTime) <= windowSec) {
          return {
            allowed: false,
            ruleViolated: 'NEWS_WINDOW_RESTRICTION',
            reason: `Trading restricted within ${this.rules.newsRestrictionMinutes} minutes of high-impact news event.`,
          };
        }
      }
    }

    // Record order for idempotency deduplication (60s validity)
    this.recentOrderSignatures.set(order.clientOrderId, nowSec + 60);

    return {
      allowed: true,
      projectedRiskAmount: order.lotSize * 1000,
    };
  }

  private cleanupDeduplicationCache(currentSec: number): void {
    for (const [id, expiry] of this.recentOrderSignatures.entries()) {
      if (expiry <= currentSec) {
        this.recentOrderSignatures.delete(id);
      }
    }
  }
}
