import { Candle, Timeframe } from '../types/market';

export const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
  'M1': 1,
  'M5': 5,
  'M15': 15,
  'M30': 30,
  'H1': 60,
  'H4': 240,
  'D1': 1440
};

export class TimeframeResampler {
  /**
   * Normalize timestamps to seconds and ensure unique ascending order
   */
  public static normalizeCandles(candles: Candle[]): Candle[] {
    if (!candles || candles.length === 0) return [];
    
    // 1. Convert any ms timestamps to seconds
    const normalized = candles.map((c) => ({
      ...c,
      timestamp: c.timestamp > 1e11 ? Math.floor(c.timestamp / 1000) : Math.floor(c.timestamp)
    }));

    // 2. Sort ascending by timestamp
    normalized.sort((a, b) => a.timestamp - b.timestamp);

    // 3. Deduplicate any duplicate timestamps
    const unique: Candle[] = [];
    let lastTime = -1;
    for (const c of normalized) {
      if (c.timestamp > lastTime) {
        unique.push(c);
        lastTime = c.timestamp;
      } else if (unique.length > 0) {
        // Merge with existing candle
        const prev = unique[unique.length - 1];
        prev.high = Math.max(prev.high, c.high);
        prev.low = Math.min(prev.low, c.low);
        prev.close = c.close;
        prev.volume += c.volume;
      }
    }

    return unique;
  }

  /**
   * Tổng hợp (resample) một mảng nến sang khung thời gian mục tiêu
   */
  public static resample(candles: Candle[], targetTf: Timeframe): Candle[] {
    if (!candles || candles.length === 0) return [];
    
    const cleanCandles = this.normalizeCandles(candles);
    if (targetTf === 'M1') return cleanCandles;

    const intervalSeconds = TIMEFRAME_MINUTES[targetTf] * 60;
    const resampled: Candle[] = [];

    let currentBucket: Candle | null = null;
    let bucketStartTime = 0;

    for (const c of cleanCandles) {
      const bucketTime = Math.floor(c.timestamp / intervalSeconds) * intervalSeconds;

      if (!currentBucket || bucketTime !== bucketStartTime) {
        if (currentBucket) {
          resampled.push(currentBucket);
        }
        bucketStartTime = bucketTime;
        currentBucket = {
          timestamp: bucketTime,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume
        };
      } else {
        currentBucket.high = Math.max(currentBucket.high, c.high);
        currentBucket.low = Math.min(currentBucket.low, c.low);
        currentBucket.close = c.close;
        currentBucket.volume += c.volume;
      }
    }

    if (currentBucket) {
      resampled.push(currentBucket);
    }

    return resampled;
  }
}
