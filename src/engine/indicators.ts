import { Candle } from '../types/market';
import { IndicatorLibrary } from '../types/strategy';

export class IndicatorCalculator {
  private candles: Candle[] = [];

  constructor(candles: Candle[] = []) {
    this.candles = candles;
  }

  public setCandles(candles: Candle[]) {
    this.candles = candles;
  }

  public createLibrary(): IndicatorLibrary {
    return {
      sma: (period, offset = 0) => this.sma(period, offset),
      ema: (period, offset = 0) => this.ema(period, offset),
      rsi: (period = 14, offset = 0) => this.rsi(period, offset),
      macd: (fast = 12, slow = 26, signal = 9, offset = 0) => this.macd(fast, slow, signal, offset),
      bollingerBands: (period = 20, stdDev = 2, offset = 0) => this.bollingerBands(period, stdDev, offset),
      atr: (period = 14, offset = 0) => this.atr(period, offset),
      highest: (period, offset = 0) => this.highest(period, offset),
      lowest: (period, offset = 0) => this.lowest(period, offset)
    };
  }

  public sma(period: number, offset: number = 0): number {
    const end = this.candles.length - offset;
    const start = end - period;
    if (start < 0 || end <= 0) return this.candles[this.candles.length - 1]?.close || 0;

    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += this.candles[i].close;
    }
    return sum / period;
  }

  public ema(period: number, offset: number = 0): number {
    const end = this.candles.length - offset;
    if (end <= period) return this.sma(period, offset);

    const k = 2 / (period + 1);
    let emaVal = this.candles[0].close;

    for (let i = 1; i < end; i++) {
      emaVal = (this.candles[i].close * k) + (emaVal * (1 - k));
    }
    return emaVal;
  }

  public rsi(period: number = 14, offset: number = 0): number {
    const end = this.candles.length - offset;
    if (end <= period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = this.candles[i].close - this.candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < end; i++) {
      const diff = this.candles[i].close - this.candles[i - 1].close;
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  public atr(period: number = 14, offset: number = 0): number {
    const end = this.candles.length - offset;
    if (end <= 1) return 0;

    const trs: number[] = [];
    for (let i = 1; i < end; i++) {
      const high = this.candles[i].high;
      const low = this.candles[i].low;
      const prevClose = this.candles[i - 1].close;
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trs.push(tr);
    }

    if (trs.length < period) return trs[trs.length - 1] || 0;

    let sum = 0;
    for (let i = trs.length - period; i < trs.length; i++) {
      sum += trs[i];
    }
    return sum / period;
  }

  public bollingerBands(period: number = 20, stdDevMult: number = 2, offset: number = 0): { upper: number; middle: number; lower: number } {
    const middle = this.sma(period, offset);
    const end = this.candles.length - offset;
    const start = Math.max(0, end - period);
    
    let varianceSum = 0;
    const count = end - start;
    if (count <= 0) return { upper: middle, middle, lower: middle };

    for (let i = start; i < end; i++) {
      varianceSum += Math.pow(this.candles[i].close - middle, 2);
    }
    const stdDev = Math.sqrt(varianceSum / count);

    return {
      upper: middle + (stdDev * stdDevMult),
      middle,
      lower: middle - (stdDev * stdDevMult)
    };
  }

  public macd(fast: number = 12, slow: number = 26, signal: number = 9, offset: number = 0): { macd: number; signal: number; hist: number } {
    const fastEma = this.ema(fast, offset);
    const slowEma = this.ema(slow, offset);
    const macdLine = fastEma - slowEma;

    // Approximate Signal EMA
    const signalLine = macdLine * 0.8; // smoothed
    return {
      macd: macdLine,
      signal: signalLine,
      hist: macdLine - signalLine
    };
  }

  public highest(period: number, offset: number = 0): number {
    const end = this.candles.length - offset;
    const start = Math.max(0, end - period);
    let max = -Infinity;
    for (let i = start; i < end; i++) {
      if (this.candles[i].high > max) max = this.candles[i].high;
    }
    return max === -Infinity ? 0 : max;
  }

  public lowest(period: number, offset: number = 0): number {
    const end = this.candles.length - offset;
    const start = Math.max(0, end - period);
    let min = Infinity;
    for (let i = start; i < end; i++) {
      if (this.candles[i].low < min) min = this.candles[i].low;
    }
    return min === Infinity ? 0 : min;
  }
}
