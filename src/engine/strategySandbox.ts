import { Candle } from '../types/market';
import { AIStrategyDefinition, IndicatorLibrary, StrategyAccountInfo, StrategyExecutionAPI } from '../types/strategy';

export const PREBUILT_STRATEGIES: AIStrategyDefinition[] = [
  {
    id: 'strat_ema_rsi',
    name: 'EMA 200 Trend + RSI Pullback',
    description: 'Chiến lược đánh thuận xu hướng: Mua khi giá nằm trên EMA 200 và RSI quá bán dưới 35; Bán khi giá dưới EMA 200 và RSI quá mua trên 65.',
    parameters: {
      emaPeriod: 200,
      rsiPeriod: 14,
      rsiOversold: 35,
      rsiOverbought: 65,
      slPips: 20,
      tpPips: 40,
      lotSize: 0.1
    },
    enabled: true,
    createdAt: Date.now(),
    code: `// EMA 200 Trend + RSI Pullback Strategy
return {
  onCandle(candle, indicators, account, api) {
    const ema200 = indicators.ema(this.parameters.emaPeriod);
    const rsi14 = indicators.rsi(this.parameters.rsiPeriod);

    // Không mở lệnh mới nếu đang có lệnh mở
    if (account.openPositionsCount > 0) return;

    // Tín hiệu BUY: Nến đóng trên EMA 200 và RSI chạm vùng quá bán
    if (candle.close > ema200 && rsi14 < this.parameters.rsiOversold) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: RSI ' + rsi14.toFixed(1) + ' < ' + this.parameters.rsiOversold
      });
      api.log('[AI SIGNAL] Khớp BUY ' + this.parameters.lotSize + 'L @ ' + candle.close);
    }
    // Tín hiệu SELL: Nến đóng dưới EMA 200 và RSI chạm vùng quá mua
    else if (candle.close < ema200 && rsi14 > this.parameters.rsiOverbought) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: RSI ' + rsi14.toFixed(1) + ' > ' + this.parameters.rsiOverbought
      });
      api.log('[AI SIGNAL] Khớp SELL ' + this.parameters.lotSize + 'L @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_bollinger_breakout',
    name: 'Bollinger Bands Mean Reversion',
    description: 'Chiến lược bắt đỉnh đáy đảo chiều khi giá thoát khỏi dải Bollinger Bands rồi quay trở lại vào trong.',
    parameters: {
      bbPeriod: 20,
      bbStdDev: 2,
      slPips: 25,
      tpPips: 50,
      lotSize: 0.1
    },
    enabled: false,
    createdAt: Date.now(),
    code: `// Bollinger Bands Mean Reversion Strategy
return {
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
  }
];

export class StrategyRunner {
  private compiledStrategy: any = null;
  private parameters: Record<string, any> = {};

  public compile(code: string, parameters: Record<string, any> = {}): { success: boolean; error?: string } {
    try {
      this.parameters = parameters;
      // Wrap code in a safe function
      const cleanCode = code.trim();
      let functionBody = cleanCode;
      if (!cleanCode.startsWith('return')) {
        functionBody = `return (${cleanCode});`;
      }

      // Khởi tạo hàm thực thi
      const factory = new Function(functionBody);
      this.compiledStrategy = factory();
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
