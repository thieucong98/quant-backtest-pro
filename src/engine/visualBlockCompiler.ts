/**
 * Quant Backtest Pro — Visual Block Strategy Compiler (No-Code Quant Engine)
 * Features:
 *  - Visual AST Representation of Triggers, Operators, and Trade Actions
 *  - Forward Compiler: Visual Blocks -> Production JavaScript Engine Code
 *  - Reverse Decompiler: JavaScript Strategy -> Visual Blocks
 */

export type IndicatorTriggerType =
  | 'EMA_CROSS'
  | 'RSI_THRESHOLD'
  | 'MACD_CROSS'
  | 'BOLLINGER_BAND'
  | 'SMC_ORDER_BLOCK';

export type ComparisonOperator =
  | 'CROSS_ABOVE'
  | 'CROSS_BELOW'
  | 'LESS_THAN'
  | 'GREATER_THAN'
  | 'PRICE_TAPS';

export type TradeActionType = 'BUY' | 'SELL';

export interface VisualRuleBlock {
  id: string;
  trigger: IndicatorTriggerType;
  operator: ComparisonOperator;
  action: TradeActionType;
  // Trigger specific parameters
  param1: number; // e.g. emaFast or rsiPeriod or macdFast
  param2: number; // e.g. emaSlow or rsiThreshold or macdSlow
  param3?: number; // e.g. macdSignal or stdDev
  // Action parameters
  lotSize: number;
  slPips: number;
  tpPips: number;
  trailingStopPips?: number;
  comment?: string;
}

export interface VisualStrategyModel {
  name: string;
  description: string;
  rules: VisualRuleBlock[];
}

export const DEFAULT_VISUAL_STRATEGY: VisualStrategyModel = {
  name: 'No-Code Multi-Confluence Strategy',
  description: 'Built with Visual Block Strategy Builder',
  rules: [
    {
      id: 'rule_1',
      trigger: 'EMA_CROSS',
      operator: 'CROSS_ABOVE',
      action: 'BUY',
      param1: 9,
      param2: 21,
      lotSize: 0.1,
      slPips: 20,
      tpPips: 40,
      comment: 'Visual Block EMA Golden Cross'
    },
    {
      id: 'rule_2',
      trigger: 'EMA_CROSS',
      operator: 'CROSS_BELOW',
      action: 'SELL',
      param1: 9,
      param2: 21,
      lotSize: 0.1,
      slPips: 20,
      tpPips: 40,
      comment: 'Visual Block EMA Death Cross'
    }
  ]
};

export class VisualBlockCompiler {
  /**
   * Compiles an array of visual rule blocks into executable JavaScript code
   */
  public static compileBlocksToJs(model: VisualStrategyModel): string {
    const rules = model.rules || [];

    // Extract merged parameters
    const paramLines: string[] = [];
    const executionBlocks: string[] = [];

    rules.forEach((rule, idx) => {
      const prefix = `rule${idx + 1}_`;
      paramLines.push(`    ${prefix}lot: ${rule.lotSize},`);
      paramLines.push(`    ${prefix}sl: ${rule.slPips},`);
      paramLines.push(`    ${prefix}tp: ${rule.tpPips},`);

      if (rule.trigger === 'EMA_CROSS') {
        paramLines.push(`    ${prefix}emaFast: ${rule.param1},`);
        paramLines.push(`    ${prefix}emaSlow: ${rule.param2},`);

        if (rule.action === 'BUY') {
          executionBlocks.push(`    // Rule ${idx + 1}: EMA Golden Cross -> BUY
    const fast${idx} = indicators.ema(this.parameters.${prefix}emaFast, 0);
    const slow${idx} = indicators.ema(this.parameters.${prefix}emaSlow, 0);
    const prevFast${idx} = indicators.ema(this.parameters.${prefix}emaFast, 1);
    const prevSlow${idx} = indicators.ema(this.parameters.${prefix}emaSlow, 1);

    if (prevFast${idx} <= prevSlow${idx} && fast${idx} > slow${idx}) {
      api.buy({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || 'Block: BUY on EMA Cross'}'
      });
    }`);
        } else {
          executionBlocks.push(`    // Rule ${idx + 1}: EMA Death Cross -> SELL
    const fast${idx} = indicators.ema(this.parameters.${prefix}emaFast, 0);
    const slow${idx} = indicators.ema(this.parameters.${prefix}emaSlow, 0);
    const prevFast${idx} = indicators.ema(this.parameters.${prefix}emaFast, 1);
    const prevSlow${idx} = indicators.ema(this.parameters.${prefix}emaSlow, 1);

    if (prevFast${idx} >= prevSlow${idx} && fast${idx} < slow${idx}) {
      api.sell({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || 'Block: SELL on EMA Cross'}'
      });
    }`);
        }
      } else if (rule.trigger === 'RSI_THRESHOLD') {
        paramLines.push(`    ${prefix}rsiPeriod: ${rule.param1},`);
        paramLines.push(`    ${prefix}rsiThreshold: ${rule.param2},`);

        if (rule.action === 'BUY') {
          executionBlocks.push(`    // Rule ${idx + 1}: RSI Oversold Pullback -> BUY
    const rsi${idx} = indicators.rsi(this.parameters.${prefix}rsiPeriod, 0);
    const prevRsi${idx} = indicators.rsi(this.parameters.${prefix}rsiPeriod, 1);
    if (prevRsi${idx} < this.parameters.${prefix}rsiThreshold && rsi${idx} >= this.parameters.${prefix}rsiThreshold) {
      api.buy({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || 'Block: BUY on RSI Pullback'}'
      });
    }`);
        } else {
          executionBlocks.push(`    // Rule ${idx + 1}: RSI Overbought Pullback -> SELL
    const rsi${idx} = indicators.rsi(this.parameters.${prefix}rsiPeriod, 0);
    const prevRsi${idx} = indicators.rsi(this.parameters.${prefix}rsiPeriod, 1);
    if (prevRsi${idx} > this.parameters.${prefix}rsiThreshold && rsi${idx} <= this.parameters.${prefix}rsiThreshold) {
      api.sell({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || 'Block: SELL on RSI Pullback'}'
      });
    }`);
        }
      } else if (rule.trigger === 'MACD_CROSS') {
        paramLines.push(`    ${prefix}macdFast: ${rule.param1},`);
        paramLines.push(`    ${prefix}macdSlow: ${rule.param2},`);
        paramLines.push(`    ${prefix}macdSignal: ${rule.param3 || 9},`);

        if (rule.action === 'BUY') {
          executionBlocks.push(`    // Rule ${idx + 1}: MACD Bullish Crossover -> BUY
    const macdCurr${idx} = indicators.macd(this.parameters.${prefix}macdFast, this.parameters.${prefix}macdSlow, this.parameters.${prefix}macdSignal, 0);
    const macdPrev${idx} = indicators.macd(this.parameters.${prefix}macdFast, this.parameters.${prefix}macdSlow, this.parameters.${prefix}macdSignal, 1);
    if (macdPrev${idx}.macd < macdPrev${idx}.signal && macdCurr${idx}.macd >= macdCurr${idx}.signal) {
      api.buy({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || 'Block: BUY on MACD Cross'}'
      });
    }`);
        } else {
          executionBlocks.push(`    // Rule ${idx + 1}: MACD Bearish Crossover -> SELL
    const macdCurr${idx} = indicators.macd(this.parameters.${prefix}macdFast, this.parameters.${prefix}macdSlow, this.parameters.${prefix}macdSignal, 0);
    const macdPrev${idx} = indicators.macd(this.parameters.${prefix}macdFast, this.parameters.${prefix}macdSlow, this.parameters.${prefix}macdSignal, 1);
    if (macdPrev${idx}.macd > macdPrev${idx}.signal && macdCurr${idx}.macd <= macdCurr${idx}.signal) {
      api.sell({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || 'Block: SELL on MACD Cross'}'
      });
    }`);
        }
      } else if (rule.trigger === 'SMC_ORDER_BLOCK') {
        const orderBlockKind = rule.action === 'BUY' ? 'Bullish' : 'Bearish';
        executionBlocks.push(`    // Rule ${idx + 1}: SMC Order Block Tap -> ${rule.action}
    const lowest${idx} = indicators.lowest(10, 1);
    const highest${idx} = indicators.highest(10, 1);
    if (${rule.action === 'BUY' ? `candle.low <= lowest${idx} && candle.close > lowest${idx}` : `candle.high >= highest${idx} && candle.close < highest${idx}`}) {
      api.${rule.action.toLowerCase()}({
        lotSize: this.parameters.${prefix}lot,
        stopLossPips: this.parameters.${prefix}sl,
        takeProfitPips: this.parameters.${prefix}tp,
        comment: '${rule.comment || `Block: ${orderBlockKind} OB Tap`}'
      });
    }`);
      }
    });

    return `return {
  parameters: {
${paramLines.join('\n')}
  },

  onCandle(candle, indicators, account, api) {
    if (account.openPositionsCount > 0) return;

${executionBlocks.join('\n\n')}
  }
};`;
  }

  /**
   * Decompiles or creates reasonable visual blocks from existing JavaScript code
   */
  public static decompileJsToBlocks(code: string): VisualStrategyModel {
    const rules: VisualRuleBlock[] = [];

    const isRsi = code.includes('rsi(');
    const isMacd = code.includes('macd(');
    const isEma = code.includes('ema(');

    if (isRsi) {
      rules.push({
        id: 'rule_rsi_1',
        trigger: 'RSI_THRESHOLD',
        operator: 'LESS_THAN',
        action: 'BUY',
        param1: 14,
        param2: 30,
        lotSize: 0.1,
        slPips: 25,
        tpPips: 50,
        comment: 'RSI Oversold Pullback'
      });
      rules.push({
        id: 'rule_rsi_2',
        trigger: 'RSI_THRESHOLD',
        operator: 'GREATER_THAN',
        action: 'SELL',
        param1: 14,
        param2: 70,
        lotSize: 0.1,
        slPips: 25,
        tpPips: 50,
        comment: 'RSI Overbought Pullback'
      });
    } else if (isMacd) {
      rules.push({
        id: 'rule_macd_1',
        trigger: 'MACD_CROSS',
        operator: 'CROSS_ABOVE',
        action: 'BUY',
        param1: 12,
        param2: 26,
        param3: 9,
        lotSize: 0.1,
        slPips: 20,
        tpPips: 45,
        comment: 'MACD Bullish Cross'
      });
      rules.push({
        id: 'rule_macd_2',
        trigger: 'MACD_CROSS',
        operator: 'CROSS_BELOW',
        action: 'SELL',
        param1: 12,
        param2: 26,
        param3: 9,
        lotSize: 0.1,
        slPips: 20,
        tpPips: 45,
        comment: 'MACD Bearish Cross'
      });
    } else {
      // Default EMA cross
      rules.push({
        id: 'rule_ema_1',
        trigger: 'EMA_CROSS',
        operator: 'CROSS_ABOVE',
        action: 'BUY',
        param1: 9,
        param2: 21,
        lotSize: 0.1,
        slPips: 20,
        tpPips: 40,
        comment: 'EMA Golden Cross'
      });
      rules.push({
        id: 'rule_ema_2',
        trigger: 'EMA_CROSS',
        operator: 'CROSS_BELOW',
        action: 'SELL',
        param1: 9,
        param2: 21,
        lotSize: 0.1,
        slPips: 20,
        tpPips: 40,
        comment: 'EMA Death Cross'
      });
    }

    return {
      name: 'Extracted Visual Strategy',
      description: 'Imported from JavaScript source code',
      rules
    };
  }
}
