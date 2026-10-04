import { Candle } from '../types/market';
import { IndicatorLibrary } from '../types/strategy';

export class IndicatorCalculator {
  private candles: Candle[] = [];
  private effectiveLength: number = 0;

  constructor(candles: Candle[] = []) {
    this.setCandles(candles);
  }

  public setCandles(candles: Candle[], length?: number) {
    this.candles = candles;
    this.effectiveLength = length !== undefined ? Math.min(candles.length, length) : candles.length;
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

  private sanitizeOffset(offset: any): number {
    if (typeof offset === 'number' && !isNaN(offset)) {
      return Math.max(0, Math.floor(offset));
    }
    return 0;
  }

  private sanitizePeriod(period: any, defaultPeriod: number = 14): number {
    if (typeof period === 'number' && !isNaN(period) && period > 0) {
      return Math.max(1, Math.floor(period));
    }
    return defaultPeriod;
  }

  public sma(period: number, offset: number = 0): number {
    const safePeriod = this.sanitizePeriod(period, 14);
    const safeOffset = this.sanitizeOffset(offset);
    const end = this.effectiveLength - safeOffset;
    const start = end - safePeriod;
    if (start < 0 || end <= 0) return this.candles[this.effectiveLength - 1]?.close || 0;

    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += this.candles[i].close;
    }
    return sum / safePeriod;
  }

  public ema(period: number, offset: number = 0): number {
    const safePeriod = this.sanitizePeriod(period, 14);
    const safeOffset = this.sanitizeOffset(offset);
    const end = this.effectiveLength - safeOffset;
    if (end <= safePeriod) return this.sma(safePeriod, safeOffset);

    const k = 2 / (safePeriod + 1);
    let emaVal = this.candles[0].close;

    for (let i = 1; i < end; i++) {
      emaVal = (this.candles[i].close * k) + (emaVal * (1 - k));
    }
    return emaVal;
  }

  public rsi(period: number = 14, offset: number = 0): number {
    const safePeriod = this.sanitizePeriod(period, 14);
    const safeOffset = this.sanitizeOffset(offset);
    const end = this.effectiveLength - safeOffset;
    if (end <= safePeriod + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= safePeriod; i++) {
      const diff = this.candles[i].close - this.candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / safePeriod;
    let avgLoss = losses / safePeriod;

    for (let i = safePeriod + 1; i < end; i++) {
      const diff = this.candles[i].close - this.candles[i - 1].close;
      if (diff >= 0) {
        avgGain = (avgGain * (safePeriod - 1) + diff) / safePeriod;
        avgLoss = (avgLoss * (safePeriod - 1)) / safePeriod;
      } else {
        avgGain = (avgGain * (safePeriod - 1)) / safePeriod;
        avgLoss = (avgLoss * (safePeriod - 1) - diff) / safePeriod;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  public atr(period: number = 14, offset: number = 0): number {
    const safePeriod = this.sanitizePeriod(period, 14);
    const safeOffset = this.sanitizeOffset(offset);
    const end = this.effectiveLength - safeOffset;
    if (end <= 1) return 0;

    const trs: number[] = [];
    for (let i = 1; i < end; i++) {
      const high = this.candles[i].high;
      const low = this.candles[i].low;
      const prevClose = this.candles[i - 1].close;
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trs.push(tr);
    }

    if (trs.length < safePeriod) return trs[trs.length - 1] || 0;

    let sum = 0;
    for (let i = trs.length - safePeriod; i < trs.length; i++) {
      sum += trs[i];
    }
    return sum / safePeriod;
  }

  public bollingerBands(period: number = 20, stdDevMult: number = 2, offset: number = 0): { upper: number; middle: number; lower: number } {
    const safePeriod = this.sanitizePeriod(period, 20);
    const safeOffset = this.sanitizeOffset(offset);
    const middle = this.sma(safePeriod, safeOffset);
    const end = this.effectiveLength - safeOffset;
    const start = Math.max(0, end - safePeriod);
    
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

  public macd(fast: number = 12, slow: number = 26, signal: number = 9, offset: number = 0): { macd: number; signal: number; hist: number; histogram: number } {
    const safeOffset = this.sanitizeOffset(offset);
    const safeFast = this.sanitizePeriod(fast, 12);
    const safeSlow = this.sanitizePeriod(slow, 26);
    const safeSignal = this.sanitizePeriod(signal, 9);
    const fastEma = this.ema(safeFast, safeOffset);
    const slowEma = this.ema(safeSlow, safeOffset);
    const macdLine = fastEma - slowEma;

    // Approximate Signal EMA
    const signalLine = macdLine * 0.8; // smoothed
    const histValue = macdLine - signalLine;
    return {
      macd: macdLine,
      signal: signalLine,
      hist: histValue,
      histogram: histValue
    };
  }

  public highest(period: number, offset: number = 0): number {
    const safePeriod = this.sanitizePeriod(period, 14);
    const safeOffset = this.sanitizeOffset(offset);
    const end = this.effectiveLength - safeOffset;
    const start = Math.max(0, end - safePeriod);
    let max = -Infinity;
    for (let i = start; i < end; i++) {
      if (this.candles[i].high > max) max = this.candles[i].high;
    }
    return max === -Infinity ? 0 : max;
  }

  public lowest(period: number, offset: number = 0): number {
    const safePeriod = this.sanitizePeriod(period, 14);
    const safeOffset = this.sanitizeOffset(offset);
    const end = this.effectiveLength - safeOffset;
    const start = Math.max(0, end - safePeriod);
    let min = Infinity;
    for (let i = start; i < end; i++) {
      if (this.candles[i].low < min) min = this.candles[i].low;
    }
    return min === Infinity ? 0 : min;
  }
}


/**
 * Calculate Heikin-Ashi candles from raw candlestick data
 */
export function calculateHeikinAshi(rawCandles: Candle[]): Candle[] {
  if (rawCandles.length === 0) return [];
  const haList: Candle[] = [];

  let prevHaOpen = rawCandles[0].open;
  let prevHaClose = rawCandles[0].close;

  for (let i = 0; i < rawCandles.length; i++) {
    const c = rawCandles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haList.push({
      timestamp: c.timestamp,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }
  return haList;
}
