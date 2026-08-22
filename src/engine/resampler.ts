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
   * Tổng hợp (resample) một mảng nến sang khung thời gian mục tiêu
   */
  public static resample(candles: Candle[], targetTf: Timeframe): Candle[] {
    if (targetTf === 'M1' || candles.length === 0) return candles;

    const intervalSeconds = TIMEFRAME_MINUTES[targetTf] * 60;
    const resampled: Candle[] = [];

    let currentBucket: Candle | null = null;
    let bucketStartTime = 0;

    for (const c of candles) {
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
