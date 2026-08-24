import { Candle, InstrumentSpec } from '../types/market';
import { PerformanceReport, AnalyticsEngine } from './analytics';
import { IndicatorCalculator } from './indicators';
import { OrderMatchingEngine } from './orderMatchingEngine';

export interface OptimizationRange {
  min: number;
  max: number;
  step: number;
}

export interface OptimizationConfig {
  slRange: OptimizationRange;
  tpRange: OptimizationRange;
  lotSize?: number;
  initialBalance?: number;
  metricSortBy?: 'netProfit' | 'profitFactor' | 'winRate' | 'sharpeRatio' | 'riskRewardRatio';
}

export interface OptimizationResultItem {
  id: string;
  slPips: number;
  tpPips: number;
  riskRewardRatio: number;
  report: PerformanceReport;
  score: number;
  sparkline: number[];
  isBestOverall?: boolean;
  isBestWinRate?: boolean;
  isLowestDrawdown?: boolean;
  isBestSharpe?: boolean;
}

export interface HeatmapCell {
  slPips: number;
  tpPips: number;
  netProfit: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdownPercent: number;
}

export interface HeatmapMatrix {
  slValues: number[];
  tpValues: number[];
  cells: HeatmapCell[][]; // rows: tp, cols: sl
  minProfit: number;
  maxProfit: number;
}

export interface OptimizationSummary {
  symbol: string;
  totalCombinations: number;
  executionTimeMs: number;
  bestItem: OptimizationResultItem | null;
  bestWinRateItem: OptimizationResultItem | null;
  bestSharpeItem: OptimizationResultItem | null;
  lowestDrawdownItem: OptimizationResultItem | null;
  rankedResults: OptimizationResultItem[];
  heatmap: HeatmapMatrix;
}

export class StrategyOptimizerEngine {
  /**
   * Tự động xác định khoảng quét SL/TP mặc định tối ưu theo Symbol / Asset Category
   */
  public static getSymbolDefaultRanges(
    instrument: InstrumentSpec,
    candles?: Candle[]
  ): { slRange: OptimizationRange; tpRange: OptimizationRange } {
    const symbol = instrument.symbol.toUpperCase();
    const category = instrument.category;

    // 1. Precious Metals (Vàng, Bạc)
    if (category === 'METALS' || symbol.includes('XAU') || symbol.includes('GOLD')) {
      return {
        slRange: { min: 20, max: 100, step: 20 },  // 20, 40, 60, 80, 100
        tpRange: { min: 40, max: 200, step: 40 }   // 40, 80, 120, 160, 200
      };
    }

    // 2. Crypto (Bitcoin, Ethereum)
    if (category === 'CRYPTO' || symbol.includes('BTC') || symbol.includes('ETH')) {
      if (symbol.includes('ETH')) {
        return {
          slRange: { min: 50, max: 300, step: 50 },
          tpRange: { min: 100, max: 600, step: 100 }
        };
      }
      return {
        slRange: { min: 200, max: 1200, step: 250 },
        tpRange: { min: 400, max: 2500, step: 500 }
      };
    }

    // 3. Stock Indices (US30, NAS100, SPX500, GER40)
    if (category === 'INDICES' || symbol.includes('US30') || symbol.includes('NAS') || symbol.includes('SPX')) {
      return {
        slRange: { min: 30, max: 150, step: 30 },
        tpRange: { min: 60, max: 300, step: 60 }
      };
    }

    // 4. Forex Majors & Crosses
    if (symbol.includes('JPY')) {
      return {
        slRange: { min: 15, max: 60, step: 15 },
        tpRange: { min: 30, max: 120, step: 30 }
      };
    }

    // Default Forex
    return {
      slRange: { min: 10, max: 50, step: 10 },   // 10, 20, 30, 40, 50
      tpRange: { min: 20, max: 100, step: 20 }   // 20, 40, 60, 80, 100
    };
  }

  /**
   * Tạo danh sách các giá trị trong khoảng quét [min -> max] với bước nhảy step
   */
  public static generateSteps(range: OptimizationRange): number[] {
    const list: number[] = [];
    const min = Math.max(1, range.min);
    const max = Math.max(min, range.max);
    const step = Math.max(1, range.step);

    for (let val = min; val <= max + 0.0001; val += step) {
      list.push(Math.round(val * 100) / 100);
      if (list.length > 50) break; // Giới hạn an toàn
    }

    if (list.length === 0) list.push(min);
    return list;
  }

  /**
   * Cập nhật số pip SL và TP trong mã nguồn code chiến lược Javascript
   */
  public static replaceSLTPInCode(code: string, newSL: number, newTP: number): string {
    let updated = code;

    // 1. Cập nhật trong khối parameters
    // slPips: 20 -> slPips: newSL
    if (/slPips\s*:\s*\d+(\.\d+)?/i.test(updated)) {
      updated = updated.replace(/slPips\s*:\s*\d+(\.\d+)?/gi, `slPips: ${newSL}`);
    } else if (/stopLossPips\s*:\s*\d+(\.\d+)?/i.test(updated)) {
      updated = updated.replace(/stopLossPips\s*:\s*\d+(\.\d+)?/gi, `stopLossPips: ${newSL}`);
    }

    // tpPips: 40 -> tpPips: newTP
    if (/tpPips\s*:\s*\d+(\.\d+)?/i.test(updated)) {
      updated = updated.replace(/tpPips\s*:\s*\d+(\.\d+)?/gi, `tpPips: ${newTP}`);
    } else if (/takeProfitPips\s*:\s*\d+(\.\d+)?/i.test(updated)) {
      updated = updated.replace(/takeProfitPips\s*:\s*\d+(\.\d+)?/gi, `takeProfitPips: ${newTP}`);
    }

    return updated;
  }

  /**
   * Chạy mô phỏng Batch Optimization trên dữ liệu nến thực tế
   */
  public static async runBatchOptimization(
    strategyCode: string,
    baseParameters: Record<string, any>,
    candles: Candle[],
    instrument: InstrumentSpec,
    config: OptimizationConfig,
    onProgress?: (percent: number, current: number, total: number) => void
  ): Promise<OptimizationSummary> {
    const startTime = performance.now();
    const initialBalance = config.initialBalance || 10000;
    const lotSize = config.lotSize || 0.1;
    const sortBy = config.metricSortBy || 'netProfit';

    const slValues = this.generateSteps(config.slRange);
    const tpValues = this.generateSteps(config.tpRange);
    const totalCombinations = slValues.length * tpValues.length;

    if (totalCombinations === 0 || candles.length < 5) {
      throw new Error('Dữ liệu nến không đủ hoặc dải tham số không hợp lệ để tối ưu hóa.');
    }

    // Chuẩn bị mã hàm thực thi chiến lược
    const rawCode = strategyCode.trim();
    const uncommented = rawCode
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .trim();

    let functionBody = rawCode;
    if (!uncommented.startsWith('return')) {
      functionBody = `return (${rawCode});`;
    }

    // Pre-calculate indicator library once per candle series
    const indicatorCalc = new IndicatorCalculator(candles);
    const indicatorLib = indicatorCalc.createLibrary();

    const results: OptimizationResultItem[] = [];
    const heatmapCells: HeatmapCell[][] = [];

    let completedCount = 0;
    let minProfit = Infinity;
    let maxProfit = -Infinity;

    // Duyệt qua từng hàng TP (rows) và từng cột SL (cols)
    for (let tpIdx = 0; tpIdx < tpValues.length; tpIdx++) {
      const tpPips = tpValues[tpIdx];
      const rowCells: HeatmapCell[] = [];

      for (let slIdx = 0; slIdx < slValues.length; slIdx++) {
        const slPips = slValues[slIdx];

        // Cho phép UI render mượt mà bằng cách yield mỗi 5-10 iterations
        if (completedCount % 4 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        // Chạy backtest đơn lẻ cho tổ hợp (slPips, tpPips)
        const simResult = this.simulateSingleRun(
          functionBody,
          baseParameters,
          candles,
          instrument,
          initialBalance,
          lotSize,
          slPips,
          tpPips,
          indicatorCalc,
          indicatorLib
        );

        const report = simResult.report;
        const sparkline = simResult.sparkline;

        const netProfit = report.netProfit;
        if (netProfit < minProfit) minProfit = netProfit;
        if (netProfit > maxProfit) maxProfit = netProfit;

        // Tính điểm tổng hợp (Composite Score)
        // Ưu tiên Net Profit, Profit Factor > 1.2, Winrate > 40%, phạt nặng Drawdown lớn
        const pfBonus = report.profitFactor > 1.5 ? 20 : (report.profitFactor > 1.0 ? 10 : -10);
        const wrBonus = report.winRate >= 50 ? 15 : 0;
        const ddPenalty = report.maxDrawdownPercent > 20 ? -30 : (report.maxDrawdownPercent > 10 ? -10 : 0);
        const tradeCountBonus = report.totalTrades >= 5 ? 10 : (report.totalTrades === 0 ? -100 : -20);
        const score = report.netProfit + (pfBonus * 10) + (wrBonus * 5) + ddPenalty + tradeCountBonus;

        const rrRatio = Math.round((tpPips / (slPips || 1)) * 100) / 100;

        const item: OptimizationResultItem = {
          id: `opt_${slPips}_${tpPips}`,
          slPips,
          tpPips,
          riskRewardRatio: rrRatio,
          report,
          score,
          sparkline
        };

        results.push(item);

        rowCells.push({
          slPips,
          tpPips,
          netProfit: report.netProfit,
          winRate: report.winRate,
          totalTrades: report.totalTrades,
          profitFactor: report.profitFactor,
          maxDrawdownPercent: report.maxDrawdownPercent
        });

        completedCount++;
        if (onProgress) {
          const pct = Math.round((completedCount / totalCombinations) * 100);
          onProgress(pct, completedCount, totalCombinations);
        }
      }

      heatmapCells.push(rowCells);
    }

    if (minProfit === Infinity) minProfit = 0;
    if (maxProfit === -Infinity) maxProfit = 0;

    // Sắp xếp kết quả theo tiêu chí được chọn
    results.sort((a, b) => {
      if (sortBy === 'netProfit') return b.report.netProfit - a.report.netProfit;
      if (sortBy === 'profitFactor') return b.report.profitFactor - a.report.profitFactor;
      if (sortBy === 'winRate') return b.report.winRate - a.report.winRate;
      if (sortBy === 'sharpeRatio') return b.report.sharpeRatio - a.report.sharpeRatio;
      if (sortBy === 'riskRewardRatio') return b.riskRewardRatio - a.riskRewardRatio;
      return b.score - a.score;
    });

    // Tìm các danh hiệu tốt nhất
    let bestItem: OptimizationResultItem | null = results[0] || null;
    let bestWinRateItem: OptimizationResultItem | null = null;
    let bestSharpeItem: OptimizationResultItem | null = null;
    let lowestDrawdownItem: OptimizationResultItem | null = null;

    let highestWinRate = -1;
    let highestSharpe = -999;
    let lowestDD = Infinity;

    for (const r of results) {
      if (r.report.totalTrades >= 3) {
        if (r.report.winRate > highestWinRate) {
          highestWinRate = r.report.winRate;
          bestWinRateItem = r;
        }
        if (r.report.sharpeRatio > highestSharpe) {
          highestSharpe = r.report.sharpeRatio;
          bestSharpeItem = r;
        }
        if (r.report.maxDrawdownPercent < lowestDD && r.report.netProfit > 0) {
          lowestDD = r.report.maxDrawdownPercent;
          lowestDrawdownItem = r;
        }
      }
    }

    if (bestItem) bestItem.isBestOverall = true;
    if (bestWinRateItem) bestWinRateItem.isBestWinRate = true;
    if (bestSharpeItem) bestSharpeItem.isBestSharpe = true;
    if (lowestDrawdownItem) lowestDrawdownItem.isLowestDrawdown = true;

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      symbol: instrument.symbol,
      totalCombinations,
      executionTimeMs,
      bestItem,
      bestWinRateItem,
      bestSharpeItem,
      lowestDrawdownItem,
      rankedResults: results,
      heatmap: {
        slValues,
        tpValues,
        cells: heatmapCells,
        minProfit,
        maxProfit
      }
    };
  }

  /**
   * Chạy mô phỏng 1 lượt với cặp (slPips, tpPips)
   */
  private static simulateSingleRun(
    functionBody: string,
    baseParameters: Record<string, any>,
    candles: Candle[],
    instrument: InstrumentSpec,
    initialBalance: number,
    lotSize: number,
    slPips: number,
    tpPips: number,
    indicatorCalc: IndicatorCalculator,
    indicatorLib: any
  ): { report: PerformanceReport; sparkline: number[] } {
    try {
      const mergedParams = {
        ...baseParameters,
        slPips,
        tpPips,
        lotSize
      };

      // Khởi tạo thực thi hàm chiến lược
      const factory = new Function(functionBody);
      const stratInstance = factory();
      if (!stratInstance || typeof stratInstance.onCandle !== 'function') {
        return {
          report: AnalyticsEngine.calculateReport(initialBalance, []),
          sparkline: [initialBalance, initialBalance]
        };
      }

      stratInstance.parameters = mergedParams;

      // Khởi tạo OrderMatchingEngine in-memory độc lập
      const matchingEngine = new OrderMatchingEngine(initialBalance, instrument);
      const pipSize = instrument.pipSize;

      let currentCandle: Candle = candles[0];
      const sparkline: number[] = [initialBalance];
      const sampleInterval = Math.max(1, Math.floor(candles.length / 10));

      // Xây dựng API giả lập thực thi nhanh
      const api = {
        buy: (params: any) => {
          const useSLPips = params.stopLossPips !== undefined ? params.stopLossPips : slPips;
          const useTPPips = params.takeProfitPips !== undefined ? params.takeProfitPips : tpPips;

          let slPrice = params.stopLossPrice;
          let tpPrice = params.takeProfitPrice;
          if (useSLPips && !slPrice) slPrice = currentCandle.close - (useSLPips * pipSize);
          if (useTPPips && !tpPrice) tpPrice = currentCandle.close + (useTPPips * pipSize);

          matchingEngine.executeMarketOrder({
            side: 'BUY',
            lotSize: params.lotSize || lotSize,
            candle: currentCandle,
            stopLoss: slPrice,
            takeProfit: tpPrice,
            trailingStopPips: params.trailingStopPips,
            comment: params.comment || 'Opt Buy'
          });
        },
        sell: (params: any) => {
          const useSLPips = params.stopLossPips !== undefined ? params.stopLossPips : slPips;
          const useTPPips = params.takeProfitPips !== undefined ? params.takeProfitPips : tpPips;

          let slPrice = params.stopLossPrice;
          let tpPrice = params.takeProfitPrice;
          if (useSLPips && !slPrice) slPrice = currentCandle.close + (useSLPips * pipSize);
          if (useTPPips && !tpPrice) tpPrice = currentCandle.close - (useTPPips * pipSize);

          matchingEngine.executeMarketOrder({
            side: 'SELL',
            lotSize: params.lotSize || lotSize,
            candle: currentCandle,
            stopLoss: slPrice,
            takeProfit: tpPrice,
            trailingStopPips: params.trailingStopPips,
            comment: params.comment || 'Opt Sell'
          });
        },
        closeAll: () => {
          for (const p of [...matchingEngine.openPositions]) {
            matchingEngine.closePositionManual(p.id, currentCandle);
          }
        },
        closePosition: (posId: string) => {
          matchingEngine.closePositionManual(posId, currentCandle);
        },
        modifySLTP: (id: string, newSL?: number, newTP?: number) => {
          const p = matchingEngine.openPositions.find((pos) => pos.id === id);
          if (p) {
            if (newSL !== undefined) p.stopLoss = newSL;
            if (newTP !== undefined) p.takeProfit = newTP;
          }
        },
        log: () => {} // Bỏ qua log để tối đa tốc độ
      };

      // Vòng lặp nến thực thi
      const len = candles.length;
      for (let i = 0; i < len; i++) {
        currentCandle = candles[i];

        // Cập nhật giá nến hiện tại vào matching engine
        matchingEngine.processCandle(currentCandle);

        // Cập nhật cửa sổ nến point-in-time cho chỉ báo (không cấp phát mảng mới)
        indicatorCalc.setCandles(candles, i + 1);

        const accInfo = {
          balance: matchingEngine.balance,
          equity: matchingEngine.equity,
          freeMargin: matchingEngine.freeMargin,
          openPositionsCount: matchingEngine.openPositions.length,
          openPositions: matchingEngine.openPositions
        };

        // Gọi logic chiến lược
        stratInstance.onCandle(currentCandle, indicatorLib, accInfo, api);

        // Lấy mẫu điểm vốn định kỳ cho Sparkline
        if (i % sampleInterval === 0 || i === len - 1) {
          sparkline.push(Math.round(matchingEngine.equity * 100) / 100);
        }
      }

      // Đóng các vị thế còn mở tại nến cuối cùng để hạch toán PnL chính xác
      const lastCandle = candles[candles.length - 1];
      if (lastCandle && matchingEngine.openPositions.length > 0) {
        for (const p of [...matchingEngine.openPositions]) {
          matchingEngine.closePositionManual(p.id, lastCandle);
        }
      }

      sparkline[sparkline.length - 1] = Math.round(matchingEngine.equity * 100) / 100;

      const report = AnalyticsEngine.calculateReport(initialBalance, matchingEngine.closedPositions);
      return { report, sparkline };
    } catch (e) {
      return {
        report: AnalyticsEngine.calculateReport(initialBalance, []),
        sparkline: [initialBalance, initialBalance]
      };
    }
  }
}
