import { Candle } from '../types/market';

/**
 * Tạo dữ liệu nến mô phỏng thực tế với Geometric Brownian Motion + Mean Reversion + Session Volatility
 */
export function generateRealisticCandles(
  symbolOrCount: string | number,
  startPriceOrCount?: number,
  count: number = 3000,
  timeframeMinutes: number = 5
): Candle[] {
  let symbol = 'XAUUSD';
  let startPrice = 2650.0;
  let candleCount = count;

  if (typeof symbolOrCount === 'number') {
    candleCount = symbolOrCount;
    startPrice = startPriceOrCount ?? 2650.0;
    symbol = 'XAUUSD';
  } else {
    symbol = symbolOrCount || 'XAUUSD';
    startPrice = startPriceOrCount ?? 2650.0;
    candleCount = count;
  }

  const candles: Candle[] = [];
  let currentPrice = startPrice;
  
  // Bắt đầu từ thời gian quá khứ
  const intervalSeconds = timeframeMinutes * 60;
  let currentTime = Math.floor(Date.now() / 1000) - (candleCount * intervalSeconds);

  let volatility = startPrice * 0.0012;
  const upperSym = String(symbol || '').toUpperCase();
  if (upperSym.includes('BTC')) volatility = startPrice * 0.003;
  else if (upperSym.includes('XAU') || upperSym.includes('GOLD')) volatility = 1.2;
  else if (upperSym.includes('XAG') || upperSym.includes('SILVER')) volatility = 0.035;
  else if (upperSym.includes('EUR') || upperSym.includes('GBP') || upperSym.includes('AUD')) volatility = 0.0003;

  let digits = 2;
  if (upperSym === 'EURUSD' || upperSym === 'GBPUSD' || upperSym === 'AUDUSD') digits = 5;
  else if (upperSym === 'USDJPY' || upperSym === 'GBPJPY' || upperSym === 'XAGUSD' || upperSym.includes('XAG') || upperSym.includes('SILVER')) digits = 3;

  let trend = 0;
  let trendDuration = 0;

  for (let i = 0; i < candleCount; i++) {
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
      open: Number(open.toFixed(digits)),
      high: Number(high.toFixed(digits)),
      low: Number(low.toFixed(digits)),
      close: Number(close.toFixed(digits)),
      volume
    });

    currentPrice = close;
    currentTime += intervalSeconds;
  }

  return candles;
}
