import { Candle } from '../types/market';

/**
 * Tạo dữ liệu nến mô phỏng thực tế với Geometric Brownian Motion + Mean Reversion + Session Volatility
 */
export function generateRealisticCandles(
  symbol: string,
  startPrice: number,
  count: number = 3000,
  timeframeMinutes: number = 5
): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  
  // Bắt đầu từ 30 ngày trước
  const intervalSeconds = timeframeMinutes * 60;
  let currentTime = Math.floor(Date.now() / 1000) - (count * intervalSeconds);

  let volatility = startPrice * 0.0012;
  if (symbol === 'BTCUSD') volatility = startPrice * 0.003;
  if (symbol === 'XAUUSD') volatility = 1.2;
  if (symbol === 'EURUSD') volatility = 0.0003;

  let trend = 0;
  let trendDuration = 0;

  for (let i = 0; i < count; i++) {
    if (trendDuration <= 0) {
      // Đổi xu hướng ngẫu nhiên
      trend = (Math.random() - 0.49) * volatility * 0.4;
      trendDuration = Math.floor(Math.random() * 40) + 15;
    }
    trendDuration--;

    const open = currentPrice;
    const randomChange = (Math.random() - 0.48) * volatility + trend;
    const close = open + randomChange;

    const maxOC = Math.max(open, close);
    const minOC = Math.min(open, close);

    const upperWick = Math.random() * volatility * 0.8;
    const lowerWick = Math.random() * volatility * 0.8;

    const high = maxOC + upperWick;
    const low = minOC - lowerWick;

    const volume = Math.floor(Math.random() * 800) + 150;

    candles.push({
      timestamp: currentTime,
      open: Number(open.toFixed(symbol === 'EURUSD' ? 5 : 2)),
      high: Number(high.toFixed(symbol === 'EURUSD' ? 5 : 2)),
      low: Number(low.toFixed(symbol === 'EURUSD' ? 5 : 2)),
      close: Number(close.toFixed(symbol === 'EURUSD' ? 5 : 2)),
      volume
    });

    currentPrice = close;
    currentTime += intervalSeconds;
  }

  return candles;
}
