import { Position } from '../types/order';

export interface PerformanceReport {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number; // %
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  expectedPayoff: number;
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  sharpeRatio: number;
  sortinoRatio: number;
}

export interface MonteCarloResult {
  iterations: number;
  medianProfit: number;
  worstCaseDrawdown: number;
  bestCaseProfit: number;
  riskOfRuinPercent: number; // Xác suất Drawdown > 50%
  percentile95Drawdown: number;
  simulationPaths: number[][]; // 10 representative paths for plotting
}

export interface DayHourHeatmapCell {
  day: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  dayName: string;
  hour: number; // 0 - 23
  pnl: number;
  tradesCount: number;
  winRate: number;
}

export class AnalyticsEngine {
  public static calculateReport(
    initialBalance: number,
    closedPositions: Position[]
  ): PerformanceReport {
    if (closedPositions.length === 0) {
      return {
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        winRate: 0,
        grossProfit: 0,
        grossLoss: 0,
        netProfit: 0,
        profitFactor: 0,
        expectedPayoff: 0,
        maxDrawdownAmount: 0,
        maxDrawdownPercent: 0,
        avgWin: 0,
        avgLoss: 0,
        riskRewardRatio: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        sharpeRatio: 0,
        sortinoRatio: 0
      };
    }

    let winTrades = 0;
    let lossTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    let currentConsecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    let currentBalance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdownAmount = 0;
    let maxDrawdownPercent = 0;

    const returns: number[] = [];

    for (const trade of closedPositions) {
      const pnl = trade.realizedPnL;
      const tradeReturn = pnl / currentBalance;
      returns.push(tradeReturn);

      currentBalance += pnl;
      if (currentBalance > peakBalance) {
        peakBalance = currentBalance;
      }

      const ddAmount = peakBalance - currentBalance;
      const ddPercent = peakBalance > 0 ? (ddAmount / peakBalance) * 100 : 0;

      if (ddAmount > maxDrawdownAmount) maxDrawdownAmount = ddAmount;
      if (ddPercent > maxDrawdownPercent) maxDrawdownPercent = ddPercent;

      if (pnl > 0) {
        winTrades++;
        grossProfit += pnl;
        currentConsecutiveWins++;
        currentConsecutiveLosses = 0;
        if (currentConsecutiveWins > maxConsecutiveWins) maxConsecutiveWins = currentConsecutiveWins;
      } else if (pnl < 0) {
        lossTrades++;
        grossLoss += Math.abs(pnl);
        currentConsecutiveLosses++;
        currentConsecutiveWins = 0;
        if (currentConsecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = currentConsecutiveLosses;
      }
    }

    const totalTrades = closedPositions.length;
    const winRate = Number(((winTrades / totalTrades) * 100).toFixed(2));
    const netProfit = Number((grossProfit - grossLoss).toFixed(2));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 999 : 0);
    const expectedPayoff = Number((netProfit / totalTrades).toFixed(2));

    const avgWin = winTrades > 0 ? Number((grossProfit / winTrades).toFixed(2)) : 0;
    const avgLoss = lossTrades > 0 ? Number((grossLoss / lossTrades).toFixed(2)) : 0;
    const riskRewardRatio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : (avgWin > 0 ? 999 : 0);

    // Tính Sharpe & Sortino (giả định Risk Free Rate = 0)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 0 
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length 
      : 0;
    const downsideStdDev = Math.sqrt(downsideVariance);

    const sharpeRatio = stdDev > 0 ? Number(((avgReturn / stdDev) * Math.sqrt(252)).toFixed(2)) : 0;
    const sortinoRatio = downsideStdDev > 0 ? Number(((avgReturn / downsideStdDev) * Math.sqrt(252)).toFixed(2)) : 0;

    return {
      totalTrades,
      winTrades,
      lossTrades,
      winRate,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      netProfit,
      profitFactor,
      expectedPayoff,
      maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
      avgWin,
      avgLoss,
      riskRewardRatio,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      sharpeRatio,
      sortinoRatio
    };
  }

  /**
   * Mô phỏng Monte Carlo (1,000 chu kỳ xáo trộn ngẫu nhiên thứ tự lệnh)
   */
  public static runMonteCarlo(
    initialBalance: number,
    closedPositions: Position[],
    iterations: number = 1000
  ): MonteCarloResult {
    if (closedPositions.length === 0) {
      return {
        iterations: 0,
        medianProfit: 0,
        worstCaseDrawdown: 0,
        bestCaseProfit: 0,
        riskOfRuinPercent: 0,
        percentile95Drawdown: 0,
        simulationPaths: []
      };
    }

    const tradePnls = closedPositions.map(p => p.realizedPnL);
    const finalProfits: number[] = [];
    const maxDrawdowns: number[] = [];
    const samplePaths: number[][] = [];
    let ruinCount = 0;

    for (let iter = 0; iter < iterations; iter++) {
      // Xáo trộn mảng PnL (Fisher-Yates Shuffle)
      const shuffled = [...tradePnls];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      let currentBalance = initialBalance;
      let peakBalance = initialBalance;
      let iterMaxDDPercent = 0;
      const pathPoints: number[] = [initialBalance];

      for (const pnl of shuffled) {
        currentBalance += pnl;
        pathPoints.push(currentBalance);
        if (currentBalance > peakBalance) peakBalance = currentBalance;

        const dd = peakBalance > 0 ? ((peakBalance - currentBalance) / peakBalance) * 100 : 0;
        if (dd > iterMaxDDPercent) iterMaxDDPercent = dd;
      }

      finalProfits.push(currentBalance - initialBalance);
      maxDrawdowns.push(iterMaxDDPercent);

      if (iterMaxDDPercent >= 50) {
        ruinCount++;
      }

      // Lưu 10 đường mẫu để vẽ đồ thị
      if (iter < 10) {
        samplePaths.push(pathPoints);
      }
    }

    finalProfits.sort((a, b) => a - b);
    maxDrawdowns.sort((a, b) => a - b);

    const medianProfit = finalProfits[Math.floor(finalProfits.length / 2)];
    const bestCaseProfit = finalProfits[finalProfits.length - 1];
    const worstCaseDrawdown = maxDrawdowns[maxDrawdowns.length - 1];
    const percentile95Drawdown = maxDrawdowns[Math.floor(maxDrawdowns.length * 0.95)];
    const riskOfRuinPercent = Number(((ruinCount / iterations) * 100).toFixed(1));

    return {
      iterations,
      medianProfit: Number(medianProfit.toFixed(2)),
      worstCaseDrawdown: Number(worstCaseDrawdown.toFixed(1)),
      bestCaseProfit: Number(bestCaseProfit.toFixed(2)),
      riskOfRuinPercent,
      percentile95Drawdown: Number(percentile95Drawdown.toFixed(1)),
      simulationPaths: samplePaths
    };
  }

  /**
   * Tính toán Ma trận Heatmap theo Ngày trong tuần & Khung Giờ
   */
  public static calculateHeatmap(closedPositions: Position[]): DayHourHeatmapCell[] {
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const heatmap: Record<string, { pnl: number; count: number; wins: number; day: number; hour: number }> = {};

    for (let d = 1; d <= 5; d++) { // Mon - Fri
      for (let h = 0; h < 24; h++) {
        heatmap[`${d}_${h}`] = { pnl: 0, count: 0, wins: 0, day: d, hour: h };
      }
    }

    for (const trade of closedPositions) {
      if (!trade.openTime) continue;
      const date = new Date(trade.openTime * 1000);
      const day = date.getUTCDay();
      const hour = date.getUTCHours();
      const key = `${day}_${hour}`;

      if (heatmap[key]) {
        heatmap[key].pnl += trade.realizedPnL;
        heatmap[key].count++;
        if (trade.realizedPnL > 0) heatmap[key].wins++;
      }
    }

    return Object.values(heatmap).map(cell => ({
      day: cell.day,
      dayName: days[cell.day],
      hour: cell.hour,
      pnl: Number(cell.pnl.toFixed(2)),
      tradesCount: cell.count,
      winRate: cell.count > 0 ? Number(((cell.wins / cell.count) * 100).toFixed(0)) : 0
    }));
  }
}
