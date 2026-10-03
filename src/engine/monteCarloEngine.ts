/**
 * Quant Backtest Pro — Prop Firm Pass Probability & Monte Carlo Engine
 * Features:
 *  - 1,000-Path Bootstrap Monte Carlo Simulation
 *  - Prop Firm Challenge Rule Guardrails:
 *    • Profit Target: +10% ($1,000 on $10,000)
 *    • Max Daily Loss Limit: -5% ($500 on $10,000)
 *    • Max Trailing Drawdown: -10% ($1,000 on $10,000)
 *  - Confidence Intervals: 5th percentile (VaR 95), 50th percentile (Median), 95th percentile
 *  - Prop Firm Quality Rating: Elite (⭐⭐⭐⭐⭐), Solid (⭐⭐⭐⭐), Moderate (⭐⭐⭐), High Risk (⚠️)
 */

export interface MonteCarloSimulationResult {
  simulationsCount: number;
  initialBalance: number;
  passTargetRate: number; // e.g. 84.5%
  dailyLossBreachRisk: number; // e.g. 2.1%
  maxDrawdownBreachRisk: number; // e.g. 4.3%
  medianFinalBalance: number;
  worstCaseFinalBalance: number; // 5th percentile
  bestCaseFinalBalance: number; // 95th percentile
  maxObservedDrawdown: number;
  starRating: 'ELITE' | 'SOLID' | 'MODERATE' | 'HIGH_RISK';
  samplePaths: { pathIndex: number; curve: number[] }[];
}

export class MonteCarloEngine {
  /**
   * Runs 1,000 random bootstrap iterations across trade PnL history
   */
  public static runPropFirmSimulation(
    tradePnLs: number[],
    initialBalance: number = 10000,
    iterations: number = 1000,
    targetProfitPct: number = 10, // 10%
    maxDailyLossPct: number = 5, // 5%
    maxOverallDrawdownPct: number = 10 // 10%
  ): MonteCarloSimulationResult {
    const defaultPnLs = tradePnLs && tradePnLs.length > 0 ? tradePnLs : [80, -40, 110, -50, 95, -35, 120, -45, 60, -30];
    const nTrades = defaultPnLs.length;
    const targetBalance = initialBalance * (1 + targetProfitPct / 100);
    const maxDailyLossAmount = initialBalance * (maxDailyLossPct / 100);
    const maxDrawdownAmount = initialBalance * (maxOverallDrawdownPct / 100);

    let passedCount = 0;
    let dailyLossBreachCount = 0;
    let maxDrawdownBreachCount = 0;
    const finalBalances: number[] = [];
    let maxOverallDdObserved = 0;
    const samplePaths: { pathIndex: number; curve: number[] }[] = [];

    // Monte Carlo permutations
    for (let sim = 0; sim < iterations; sim++) {
      let balance = initialBalance;
      let peak = initialBalance;
      let breachedDD = false;
      let breachedDaily = false;
      let hitTarget = false;
      const curve: number[] = [initialBalance];

      // Simulate sequential order execution over random samples
      const stepsCount = Math.max(nTrades, 30);
      for (let step = 0; step < stepsCount; step++) {
        // Random bootstrap pick with replacement
        const randomTrade = defaultPnLs[Math.floor(Math.random() * nTrades)];
        balance += randomTrade;
        curve.push(balance);

        if (balance > peak) {
          peak = balance;
        }

        const currentDd = peak - balance;
        if (currentDd > maxOverallDdObserved) {
          maxOverallDdObserved = currentDd;
        }

        // Check overall DD limit
        if (currentDd >= maxDrawdownAmount) {
          breachedDD = true;
        }

        // Daily loss approximation (single bad trade or loss cluster)
        if (randomTrade < -maxDailyLossAmount || currentDd >= maxDailyLossAmount) {
          breachedDaily = true;
        }

        // Target hit before breach
        if (balance >= targetBalance && !breachedDD && !breachedDaily) {
          hitTarget = true;
        }
      }

      if (hitTarget) passedCount++;
      if (breachedDaily) dailyLossBreachCount++;
      if (breachedDD) maxDrawdownBreachCount++;
      finalBalances.push(balance);

      // Keep 10 sample paths for rendering
      if (sim < 10) {
        samplePaths.push({ pathIndex: sim, curve });
      }
    }

    finalBalances.sort((a, b) => a - b);
    const worstCaseIdx = Math.floor(iterations * 0.05);
    const medianIdx = Math.floor(iterations * 0.5);
    const bestCaseIdx = Math.floor(iterations * 0.95);

    const passRate = Number(((passedCount / iterations) * 100).toFixed(1));
    const dailyRisk = Number(((dailyLossBreachCount / iterations) * 100).toFixed(1));
    const ddRisk = Number(((maxDrawdownBreachCount / iterations) * 100).toFixed(1));

    let starRating: MonteCarloSimulationResult['starRating'] = 'HIGH_RISK';
    if (passRate >= 75 && ddRisk <= 5 && dailyRisk <= 5) {
      starRating = 'ELITE';
    } else if (passRate >= 55 && ddRisk <= 12) {
      starRating = 'SOLID';
    } else if (passRate >= 35) {
      starRating = 'MODERATE';
    }

    return {
      simulationsCount: iterations,
      initialBalance,
      passTargetRate: passRate,
      dailyLossBreachRisk: dailyRisk,
      maxDrawdownBreachRisk: ddRisk,
      medianFinalBalance: Math.round(finalBalances[medianIdx]),
      worstCaseFinalBalance: Math.round(finalBalances[worstCaseIdx]),
      bestCaseFinalBalance: Math.round(finalBalances[bestCaseIdx]),
      maxObservedDrawdown: Math.round(maxOverallDdObserved),
      starRating,
      samplePaths
    };
  }
}
