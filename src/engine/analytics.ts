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
  calmarRatio: number;
  systemQualityNumber: number;
  sqnRating: string;
  avgHoldingTimeMinutes: number;
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

export interface DailyCalendarCell {
  dateStr: string; // '2026-08-15'
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  pnl: number;
  tradesCount: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
}

export interface MonthlyCalendarGroup {
  monthKey: string; // '2026-08'
  monthLabel: string;
  year: number;
  month: number;
  totalPnL: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  profitableDaysCount: number;
  lossDaysCount: number;
  bestDay: { dateStr: string; pnl: number } | null;
  worstDay: { dateStr: string; pnl: number } | null;
  days: Record<string, DailyCalendarCell>;
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
        sortinoRatio: 0,
        calmarRatio: 0,
        systemQualityNumber: 0,
        sqnRating: 'N/A',
        avgHoldingTimeMinutes: 0
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

    let totalHoldingTimeMs = 0;
    let currentBalance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdownAmount = 0;
    let maxDrawdownPercent = 0;

    const returns: number[] = [];
    const pnls: number[] = [];

    for (const trade of closedPositions) {
      const pnl = trade.realizedPnL;
      const tradeReturn = pnl / currentBalance;
      returns.push(tradeReturn);
      pnls.push(pnl);

      if (trade.openTime && trade.closeTime) {
        totalHoldingTimeMs += (trade.closeTime - trade.openTime);
      }

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

    // Calmar Ratio = Annualized Net Return / Max Drawdown %
    const totalReturnPercent = (netProfit / initialBalance) * 100;
    const calmarRatio = maxDrawdownPercent > 0 
      ? Number((totalReturnPercent / maxDrawdownPercent).toFixed(2))
      : (totalReturnPercent > 0 ? 99.0 : 0);

    // System Quality Number (SQN) by Van Tharp: SQN = sqrt(N) * (mean PnL / stdDev PnL)
    const meanPnl = netProfit / totalTrades;
    const pnlVariance = pnls.reduce((sum, p) => sum + Math.pow(p - meanPnl, 2), 0) / totalTrades;
    const pnlStdDev = Math.sqrt(pnlVariance);
    const systemQualityNumber = pnlStdDev > 0 
      ? Number((Math.sqrt(totalTrades) * (meanPnl / pnlStdDev)).toFixed(2))
      : 0;

    let sqnRating = 'Below Average';
    if (systemQualityNumber >= 5.0) sqnRating = 'Holy Grail 🏆';
    else if (systemQualityNumber >= 3.0) sqnRating = 'Excellent ⭐';
    else if (systemQualityNumber >= 2.5) sqnRating = 'Good 👍';
    else if (systemQualityNumber >= 2.0) sqnRating = 'Average';
    else if (systemQualityNumber >= 1.6) sqnRating = 'Below Average';
    else sqnRating = 'Poor ⚠️';

    const avgHoldingTimeMinutes = totalTrades > 0 && totalHoldingTimeMs > 0
      ? Math.round(totalHoldingTimeMs / (totalTrades * 60))
      : 0;

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
      sortinoRatio,
      calmarRatio,
      systemQualityNumber,
      sqnRating,
      avgHoldingTimeMinutes
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
      const tMs = trade.openTime > 1e11 ? trade.openTime : trade.openTime * 1000;
      const date = new Date(tMs);
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

  /**
   * Tính toán Lịch PnL theo Ngày & Tháng Cụ Thể (Calendar Heatmap)
   */
  public static calculateMonthlyCalendars(closedPositions: Position[]): MonthlyCalendarGroup[] {
    const monthsMap: Record<string, {
      year: number;
      month: number;
      days: Record<string, DailyCalendarCell>;
    }> = {};

    for (const trade of closedPositions) {
      if (!trade.openTime) continue;
      const tMs = trade.openTime > 1e11 ? trade.openTime : trade.openTime * 1000;
      const date = new Date(tMs);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1; // 1-12
      const day = date.getUTCDate();
      const dayOfWeek = date.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
      
      const monthKey = `${year}-${month < 10 ? '0' + month : month}`;
      const dateStr = `${monthKey}-${day < 10 ? '0' + day : day}`;

      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {
          year,
          month,
          days: {}
        };
      }

      if (!monthsMap[monthKey].days[dateStr]) {
        monthsMap[monthKey].days[dateStr] = {
          dateStr,
          year,
          month,
          day,
          dayOfWeek,
          pnl: 0,
          tradesCount: 0,
          winTrades: 0,
          lossTrades: 0,
          winRate: 0
        };
      }

      const cell = monthsMap[monthKey].days[dateStr];
      cell.pnl += trade.realizedPnL;
      cell.tradesCount++;
      if (trade.realizedPnL > 0) cell.winTrades++;
      else if (trade.realizedPnL < 0) cell.lossTrades++;
      cell.winRate = cell.tradesCount > 0 ? Number(((cell.winTrades / cell.tradesCount) * 100).toFixed(0)) : 0;
      cell.pnl = Number(cell.pnl.toFixed(2));
    }

    const monthKeys = Object.keys(monthsMap).sort();
    if (monthKeys.length === 0) {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() + 1;
      const monthKey = `${year}-${month < 10 ? '0' + month : month}`;
      return [{
        monthKey,
        monthLabel: `Tháng ${month < 10 ? '0' + month : month} / ${year}`,
        year,
        month,
        totalPnL: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        winRate: 0,
        profitableDaysCount: 0,
        lossDaysCount: 0,
        bestDay: null,
        worstDay: null,
        days: {}
      }];
    }

    return monthKeys.map(mKey => {
      const g = monthsMap[mKey];
      const dayValues = Object.values(g.days);
      const totalPnL = Number(dayValues.reduce((sum, d) => sum + d.pnl, 0).toFixed(2));
      const totalTrades = dayValues.reduce((sum, d) => sum + d.tradesCount, 0);
      const winTrades = dayValues.reduce((sum, d) => sum + d.winTrades, 0);
      const lossTrades = dayValues.reduce((sum, d) => sum + d.lossTrades, 0);
      const winRate = totalTrades > 0 ? Number(((winTrades / totalTrades) * 100).toFixed(1)) : 0;
      
      const profitableDaysCount = dayValues.filter(d => d.pnl > 0).length;
      const lossDaysCount = dayValues.filter(d => d.pnl < 0).length;
      
      const sortedByPnL = [...dayValues].sort((a, b) => b.pnl - a.pnl);
      const bestDay = sortedByPnL.length > 0 && sortedByPnL[0].pnl > 0 ? { dateStr: sortedByPnL[0].dateStr, pnl: sortedByPnL[0].pnl } : null;
      const worstDay = sortedByPnL.length > 0 && sortedByPnL[sortedByPnL.length - 1].pnl < 0 
        ? { dateStr: sortedByPnL[sortedByPnL.length - 1].dateStr, pnl: sortedByPnL[sortedByPnL.length - 1].pnl } 
        : null;

      return {
        monthKey: mKey,
        monthLabel: `Tháng ${g.month < 10 ? '0' + g.month : g.month} / ${g.year}`,
        year: g.year,
        month: g.month,
        totalPnL,
        totalTrades,
        winTrades,
        lossTrades,
        winRate,
        profitableDaysCount,
        lossDaysCount,
        bestDay,
        worstDay,
        days: g.days
      };
    });
  }
}
