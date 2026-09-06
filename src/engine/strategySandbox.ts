import { Candle } from '../types/market';
import { AIStrategyDefinition, IndicatorLibrary, StrategyAccountInfo, StrategyExecutionAPI } from '../types/strategy';

export const PREBUILT_STRATEGIES: AIStrategyDefinition[] = [
  {
    id: 'strat_ema_scalp',
    name: 'EMA 9/21 Fast Scalper',
    description: 'Fast scalping strategy: BUY when EMA 9 crosses above EMA 21; SELL when EMA 9 crosses below EMA 21.',
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

    // Only 1 position at a time
    if (account.openPositionsCount > 0) return;

    // BUY Signal: Candle closes above EMA Fast and EMA Fast > Slow
    if (candle.close > fast && fast > slow) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: EMA 9 > 21 Scalp'
      });
      api.log('[AI SIGNAL] Filled BUY ' + this.parameters.lotSize + 'L @ ' + candle.close);
    }
    // SELL Signal: Candle closes below EMA Fast and EMA Fast < Slow
    else if (candle.close < fast && fast < slow) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: EMA 9 < 21 Scalp'
      });
      api.log('[AI SIGNAL] Filled SELL ' + this.parameters.lotSize + 'L @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_rsi_pullback',
    name: 'RSI Dynamic Oversold/Overbought Pullback',
    description: 'Pullback reversal strategy: BUY when RSI < 35 with bullish candle; SELL when RSI > 65 with bearish candle.',
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

    // BUY: RSI Oversold + Bullish candle
    if (rsi <= this.parameters.rsiBuy && candle.close > candle.open) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: RSI ' + rsi.toFixed(1)
      });
      api.log('[AI SIGNAL] Filled BUY RSI Oversold @ ' + candle.close);
    }
    // SELL: RSI Overbought + Bearish candle
    else if (rsi >= this.parameters.rsiSell && candle.close < candle.open) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: RSI ' + rsi.toFixed(1)
      });
      api.log('[AI SIGNAL] Filled SELL RSI Overbought @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_bollinger_breakout',
    name: 'Bollinger Bands Mean Reversion',
    description: 'Mean reversion strategy when price pierces outside Bollinger Bands and reverses back inside.',
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

    if (candle.low <= bb.lower && candle.close > bb.lower) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: Bollinger Lower Rejection'
      });
      api.log('[AI SIGNAL] Filled BUY BB Lower @ ' + candle.close);
    }
    else if (candle.high >= bb.upper && candle.close < bb.upper) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: Bollinger Upper Rejection'
      });
      api.log('[AI SIGNAL] Filled SELL BB Upper @ ' + candle.close);
    }
  }
};`
  },
  {
    id: 'strat_macd_trend',
    name: 'MACD Zero Line + Momentum Crossover',
    description: 'Momentum strategy: BUY when MACD Histogram flips positive; SELL when Histogram flips negative.',
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
      api.log('[AI SIGNAL] Filled BUY MACD Bullish @ ' + candle.close);
    } else if (macd.histogram < 0 && macd.macd < macd.signal) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: MACD Bearish Crossover'
      });
      api.log('[AI SIGNAL] Filled SELL MACD Bearish @ ' + candle.close);
    }
  }
};`
  }
];

export function validateStrategyCode(code: string): { valid: boolean; error?: string } {
  const rawCode = code.trim();
  const uncommented = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .trim();

  // 1. Obfuscation detection: Block hex/unicode escape sequences often used to hide dangerous keywords
  const escapePatterns = [
    /\\x[0-9a-fA-F]{2}/,
    /\\u[0-9a-fA-F]{4}/,
    /\\u\{[0-9a-fA-F]+\}/
  ];
  for (const p of escapePatterns) {
    if (p.test(uncommented)) {
      return {
        valid: false,
        error: 'Security Violation: Escape sequences (\\x, \\u) are prohibited in quant strategies.'
      };
    }
  }

  // 2. Dynamic property indexing with concatenation: e.g. ['c' + 'onstructor'] or ["win" + "dow"]
  if (/\[\s*['"`][^'"`\]]*['"`]\s*\+/.test(uncommented) || /\+\s*['"`][^'"`\]]*['"`]\s*\]/.test(uncommented)) {
    return {
      valid: false,
      error: 'Security Violation: Dynamic property string concatenation is prohibited in quant strategies.'
    };
  }

  // 3. Infinite loop / denial-of-service patterns
  if (/while\s*\(\s*(true|1)\s*\)/i.test(uncommented) || /for\s*\(\s*;\s*;\s*\)/.test(uncommented)) {
    return {
      valid: false,
      error: 'Security Violation: Unbounded loops (while(true) / for(;;)) are prohibited.'
    };
  }

  // 4. Forbidden keywords and prototype traversal identifiers
  const forbiddenPatterns = [
    /\bconstructor\b/i,
    /\bprototype\b/i,
    /__proto__/i,
    /\beval\s*\(/i,
    /\bFunction\s*\(/,
    /\bwindow\b/i,
    /\bdocument\b/i,
    /\blocalStorage\b/i,
    /\bsessionStorage\b/i,
    /\bindexedDB\b/i,
    /\bcookie\b/i,
    /\bfetch\b/i,
    /\bXMLHttpRequest\b/i,
    /\bWebSocket\b/i,
    /\bimport\b/i,
    /\bimportScripts\b/i,
    /\bglobalThis\b/i,
    /\bprocess\b/i,
    /\bReflect\b/i,
    /\bProxy\b/i,
    /\bgetPrototypeOf\b/i,
    /\bsetPrototypeOf\b/i,
    /\blookupGetter\b/i,
    /\blookupSetter\b/i,
    /\bdefineGetter\b/i,
    /\bdefineSetter\b/i,
    /\bWorker\b/i,
    /\bSharedWorker\b/i,
    /\bServiceWorker\b/i,
    /\btop\b/i,
    /\bparent\b/i,
    /\bframes\b/i,
    /\bopener\b/i,
    /\blocation\b/i,
    /\bnavigator\b/i,
    /\bsetTimeout\b/i,
    /\bsetInterval\b/i,
    /\bsetImmediate\b/i,
    /\balert\b/i,
    /\bconfirm\b/i,
    /\bprompt\b/i,
    /\bpostMessage\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(uncommented)) {
      return {
        valid: false,
        error: `Security Violation: Restricted token detected (${pattern}). Prototype access, DOM, network, and storage are strictly forbidden.`
      };
    }
  }

  return { valid: true };
}

export class StrategyRunner {
  private compiledStrategy: any = null;
  private parameters: Record<string, any> = {};
  private consecutiveErrorCount: number = 0;

  public compile(code: string, parameters: Record<string, any> = {}): { success: boolean; error?: string } {
    try {
      this.parameters = { slPips: 20, tpPips: 40, lotSize: 0.1, ...parameters };
      this.consecutiveErrorCount = 0;
      const rawCode = code.trim();

      const validation = validateStrategyCode(rawCode);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const uncommented = rawCode
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
        .trim();

      let functionBody = rawCode;
      if (!uncommented.startsWith('return')) {
        functionBody = `return (${rawCode});`;
      }

      // Complete shadow environment of all host globals
      const sandboxPreamble = `
        const window = undefined;
        const document = undefined;
        const localStorage = undefined;
        const sessionStorage = undefined;
        const indexedDB = undefined;
        const fetch = undefined;
        const WebSocket = undefined;
        const XMLHttpRequest = undefined;
        const globalThis = undefined;
        const self = undefined;
        const top = undefined;
        const parent = undefined;
        const frames = undefined;
        const opener = undefined;
        const location = undefined;
        const navigator = undefined;
        const Reflect = undefined;
        const Proxy = undefined;
        const Worker = undefined;
        const SharedWorker = undefined;
        const ServiceWorker = undefined;
        const setTimeout = undefined;
        const setInterval = undefined;
        const setImmediate = undefined;
        const alert = undefined;
        const prompt = undefined;
        const confirm = undefined;
        const postMessage = undefined;
      `;
      const factory = new Function(sandboxPreamble + functionBody);
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
    if (this.consecutiveErrorCount >= 5) {
      // Auto-halt faulty strategy to prevent freeze/log flooding
      return;
    }

    const startTime = performance.now();
    try {
      this.compiledStrategy.parameters = this.parameters;
      this.compiledStrategy.onCandle(candle, indicators, account, api);
      this.consecutiveErrorCount = 0;

      const elapsed = performance.now() - startTime;
      if (elapsed > 50) {
        console.warn(`[STRATEGY SANDBOX WARNING] Execution took ${elapsed.toFixed(1)}ms on candle ${candle.timestamp}`);
      }
    } catch (err: any) {
      this.consecutiveErrorCount++;
      api.log(`[LỖI CHIẾN LƯỢC AI] ${err.message}`);
      if (this.consecutiveErrorCount >= 5) {
        api.log('[LỖI CHIẾN LƯỢC AI] Đã tạm dừng chiến lược do vượt quá 5 lỗi liên tiếp.');
      }
    }
  }
}
