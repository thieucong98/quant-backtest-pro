import { Candle } from '../types/market';
import { AIStrategyDefinition, IndicatorLibrary, StrategyAccountInfo, StrategyExecutionAPI } from '../types/strategy';

export const PREBUILT_STRATEGIES: AIStrategyDefinition[] = [
  {
    id: 'strat_ema_scalp',
    name: 'EMA 9/21 Fast Scalper (Tín hiệu Nhanh)',
    description: 'Chiến lược lướt sóng nhanh: Mua khi EMA 9 cắt lên EMA 21; Bán khi EMA 9 cắt xuống EMA 21. Tín hiệu vào lệnh liên tục và rõ ràng khi tua nến.',
    parameters: {
      emaFast: 9,
      emaSlow: 21,
      slPips: 15,
      tpPips: 30,
      lotSize: 0.1
    },
    enabled: true,
    createdAt: Date.now(),
    code: `// EMA 9/21 Fast Scalper Strategy
return {
  parameters: {
    emaFast: 9,
    emaSlow: 21,
    slPips: 15,
    tpPips: 30,
    lotSize: 0.1
  },

  onCandle(candle, indicators, account, api) {
    const fast = indicators.ema(this.parameters.emaFast);
    const slow = indicators.ema(this.parameters.emaSlow);

    // Không mở thêm nếu đang có vị thế
    if (account.openPositionsCount > 0) return;

    // Tín hiệu BUY: Nến đóng trên EMA Fast và EMA Fast > EMA Slow
    if (candle.close > fast && fast > slow) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: EMA 9 > 21 Scalp'
      });
      api.log('[AI SIGNAL] Khớp BUY ' + this.parameters.lotSize + 'L @ ' + candle.close);
    }
    // Tín hiệu SELL: Nến đóng dưới EMA Fast và EMA Fast < EMA Slow
    else if (candle.close < fast && fast < slow) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: EMA 9 < 21 Scalp'
      });
      api.log('[AI SIGNAL] Khớp SELL ' + this.parameters.lotSize + 'L @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_rsi_pullback',
    name: 'RSI Dynamic Oversold/Overbought Pullback',
    description: 'Chiến lược bắt nhịp hồi: Mua khi RSI < 35 (Quá bán) và có nến xanh xác nhận; Bán khi RSI > 65 (Quá mua) và có nến đỏ.',
    parameters: {
      rsiPeriod: 14,
      rsiBuy: 35,
      rsiSell: 65,
      slPips: 20,
      tpPips: 40,
      lotSize: 0.1
    },
    enabled: false,
    createdAt: Date.now(),
    code: `// RSI Dynamic Pullback Strategy
return {
  parameters: {
    rsiPeriod: 14,
    rsiBuy: 35,
    rsiSell: 65,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  },

  onCandle(candle, indicators, account, api) {
    const rsi = indicators.rsi(this.parameters.rsiPeriod);

    if (account.openPositionsCount > 0) return;

    // BUY: RSI chạm quá bán + nến tăng
    if (rsi <= this.parameters.rsiBuy && candle.close > candle.open) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: RSI ' + rsi.toFixed(1)
      });
      api.log('[AI SIGNAL] Khớp BUY RSI Quá bán @ ' + candle.close);
    }
    // SELL: RSI chạm quá mua + nến giảm
    else if (rsi >= this.parameters.rsiSell && candle.close < candle.open) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: RSI ' + rsi.toFixed(1)
      });
      api.log('[AI SIGNAL] Khớp SELL RSI Quá mua @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_bollinger_breakout',
    name: 'Bollinger Bands Mean Reversion',
    description: 'Chiến lược bắt đỉnh đáy đảo chiều khi giá đâm thủng dải Bollinger Bands rồi đóng cửa quay lại vào trong dải.',
    parameters: {
      bbPeriod: 20,
      bbStdDev: 2,
      slPips: 20,
      tpPips: 40,
      lotSize: 0.1
    },
    enabled: false,
    createdAt: Date.now(),
    code: `// Bollinger Bands Mean Reversion Strategy
return {
  parameters: {
    bbPeriod: 20,
    bbStdDev: 2,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  },

  onCandle(candle, indicators, account, api) {
    const bb = indicators.bollingerBands(this.parameters.bbPeriod, this.parameters.bbStdDev);

    if (account.openPositionsCount > 0) return;

    // Giá nến trước đâm thủng Lower Band, nến này đóng cửa trở lại trên Lower Band
    if (candle.low <= bb.lower && candle.close > bb.lower) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: Bollinger Lower Rejection'
      });
      api.log('[AI SIGNAL] Khớp BUY BB Lower @ ' + candle.close);
    }
    // Giá nến trước chạm Upper Band, nến này đóng dưới Upper Band
    else if (candle.high >= bb.upper && candle.close < bb.upper) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: Bollinger Upper Rejection'
      });
      api.log('[AI SIGNAL] Khớp SELL BB Upper @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_macd_trend',
    name: 'MACD Zero Line + Momentum Crossover',
    description: 'Chiến lược xung lượng: Mua khi MACD Histogram chuyển từ âm sang dương; Bán khi Histogram chuyển từ dương sang âm.',
    parameters: {
      fast: 12,
      slow: 26,
      signal: 9,
      slPips: 20,
      tpPips: 45,
      lotSize: 0.1
    },
    enabled: false,
    createdAt: Date.now(),
    code: `// MACD Momentum Strategy
return {
  parameters: {
    fast: 12,
    slow: 26,
    signal: 9,
    slPips: 20,
    tpPips: 45,
    lotSize: 0.1
  },

  onCandle(candle, indicators, account, api) {
    const macd = indicators.macd(this.parameters.fast, this.parameters.slow, this.parameters.signal);

    if (account.openPositionsCount > 0) return;

    if (macd.histogram > 0 && macd.macd > macd.signal) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: MACD Bullish Crossover'
      });
      api.log('[AI SIGNAL] Khớp BUY MACD Bullish @ ' + candle.close);
    } else if (macd.histogram < 0 && macd.macd < macd.signal) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: MACD Bearish Crossover'
      });
      api.log('[AI SIGNAL] Khớp SELL MACD Bearish @ ' + candle.close);
    }
  }
};`
  }
];

export class StrategyRunner {
  private compiledStrategy: any = null;
  private parameters: Record<string, any> = {};

  public compile(code: string, parameters: Record<string, any> = {}): { success: boolean; error?: string } {
    try {
      this.parameters = { slPips: 20, tpPips: 40, lotSize: 0.1, ...parameters };
      const rawCode = code.trim();

      // Kiểm tra xem code đã có câu lệnh return hay chưa (bỏ qua comments)
      // Loại bỏ comment để kiểm tra cú pháp
      const uncommented = rawCode
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
        .trim();

      let functionBody = rawCode;
      if (!uncommented.startsWith('return')) {
        functionBody = `return (${rawCode});`;
      }

      // Khởi tạo hàm thực thi
      const factory = new Function(functionBody);
      this.compiledStrategy = factory();

      if (!this.compiledStrategy || typeof this.compiledStrategy.onCandle !== 'function') {
        throw new Error('Chiến lược phải trả về một đối tượng chứa phương thức onCandle(candle, indicators, account, api).');
      }

      // Merge parameters if defined inside the code
      if (this.compiledStrategy.parameters) {
        this.parameters = { ...this.parameters, ...this.compiledStrategy.parameters };
      }
      this.compiledStrategy.parameters = this.parameters;

      return { success: true };
    } catch (err: any) {
      this.compiledStrategy = null;
      return { success: false, error: err.message || 'Lỗi cú pháp chiến lược.' };
    }
  }

  public executeCandle(
    candle: Candle,
    indicators: IndicatorLibrary,
    account: StrategyAccountInfo,
    api: StrategyExecutionAPI
  ): void {
    if (!this.compiledStrategy || typeof this.compiledStrategy.onCandle !== 'function') return;

    try {
      this.compiledStrategy.parameters = this.parameters;
      this.compiledStrategy.onCandle(candle, indicators, account, api);
    } catch (err: any) {
      api.log(`[LỖI CHIẾN LƯỢC AI] ${err.message}`);
    }
  }
}
