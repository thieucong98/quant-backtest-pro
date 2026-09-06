import { Candle } from '../../types/market';
import { IndicatorLibrary, StrategyAccountInfo, StrategyExecutionAPI } from '../../types/strategy';

/**
 * Strategy Pattern Interface for algorithmic trading systems
 */
export interface IQuantStrategy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  parameters: Record<string, any>;
  onCandle(candle: Candle, indicators: IndicatorLibrary, account: StrategyAccountInfo, api: StrategyExecutionAPI): void;
  reset?(): void;
}

/**
 * Strategy Context (Execution Harness)
 */
export class StrategyExecutionContext {
  private strategy: IQuantStrategy | null = null;

  constructor(strategy?: IQuantStrategy) {
    if (strategy) {
      this.strategy = strategy;
    }
  }

  public setStrategy(strategy: IQuantStrategy): void {
    if (this.strategy?.reset) {
      this.strategy.reset();
    }
    this.strategy = strategy;
  }

  public getStrategy(): IQuantStrategy | null {
    return this.strategy;
  }

  public updateParameters(params: Record<string, any>): void {
    if (this.strategy) {
      this.strategy.parameters = { ...this.strategy.parameters, ...params };
    }
  }

  public execute(candle: Candle, indicators: IndicatorLibrary, account: StrategyAccountInfo, api: StrategyExecutionAPI): void {
    if (!this.strategy) return;
    this.strategy.onCandle(candle, indicators, account, api);
  }
}

/**
 * Prebuilt Concrete Strategy: Fast EMA Crossover
 */
export class EMACrossoverStrategy implements IQuantStrategy {
  public readonly id = 'strat_ema_crossover';
  public readonly name = 'EMA 9/21 Trend Scalper';
  public readonly description = 'Executes BUY when fast EMA crosses above slow EMA; executes SELL when fast crosses below slow.';
  public parameters = {
    emaFast: 9,
    emaSlow: 21,
    slPips: 15,
    tpPips: 30,
    lotSize: 0.1
  };

  public onCandle(candle: Candle, indicators: IndicatorLibrary, account: StrategyAccountInfo, api: StrategyExecutionAPI): void {
    const fast = indicators.ema(this.parameters.emaFast);
    const slow = indicators.ema(this.parameters.emaSlow);

    if (account.openPositionsCount > 0) return;

    if (candle.close > fast && fast > slow) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'StrategyPattern BUY: EMA'
      });
      api.log(`[STRATEGY PATTERN] BUY Filled @ ${candle.close}`);
    } else if (candle.close < fast && fast < slow) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'StrategyPattern SELL: EMA'
      });
      api.log(`[STRATEGY PATTERN] SELL Filled @ ${candle.close}`);
    }
  }
}

/**
 * Prebuilt Concrete Strategy: RSI Mean Reversion
 */
export class RSIMeanReversionStrategy implements IQuantStrategy {
  public readonly id = 'strat_rsi_reversion';
  public readonly name = 'RSI Dynamic Oversold/Overbought Reversal';
  public readonly description = 'Enters trades when RSI hits extreme zones with candlestick confirmation.';
  public parameters = {
    rsiPeriod: 14,
    rsiBuy: 30,
    rsiSell: 70,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  };

  public onCandle(candle: Candle, indicators: IndicatorLibrary, account: StrategyAccountInfo, api: StrategyExecutionAPI): void {
    const rsi = indicators.rsi(this.parameters.rsiPeriod);

    if (account.openPositionsCount > 0) return;

    if (rsi <= this.parameters.rsiBuy && candle.close > candle.open) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'StrategyPattern BUY: RSI Reversal'
      });
      api.log(`[STRATEGY PATTERN] BUY RSI Oversold (${rsi.toFixed(1)}) @ ${candle.close}`);
    } else if (rsi >= this.parameters.rsiSell && candle.close < candle.open) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'StrategyPattern SELL: RSI Reversal'
      });
      api.log(`[STRATEGY PATTERN] SELL RSI Overbought (${rsi.toFixed(1)}) @ ${candle.close}`);
    }
  }
}
