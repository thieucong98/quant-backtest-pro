import { Candle, Timeframe } from '../types/market';

export interface CrawlRequest {
  source: 'binance' | 'coingecko' | 'sample';
  symbol: string;
  timeframe: Timeframe;
  limit: number;
}

export class DataCrawler {
  /**
   * Crawl dữ liệu nến trực tiếp từ Binance Public REST API (Không cần API Key)
   */
  public static async fetchBinanceKlines(
    symbol: string,
    interval: string = '5m',
    limit: number = 1000
  ): Promise<Candle[]> {
    // Chuẩn hóa symbol (ví dụ BTCUSD -> BTCUSDT)
    let pair = symbol.toUpperCase().replace('/', '');
    if (pair.endsWith('USD') && !pair.endsWith('USDT')) {
      pair = pair + 'T';
    }

    const intervalMap: Record<string, string> = {
      'M1': '1m',
      'M5': '5m',
      'M15': '15m',
      'M30': '30m',
      'H1': '1h',
      'H4': '4h',
      'D1': '1d'
    };

    const binanceInterval = intervalMap[interval] || interval;
    const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Lỗi kết nối Binance API (${response.status}: ${response.statusText}). Vui lòng kiểm tra mã cặp tiền.`);
    }

    const data: any[][] = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Không nhận được dữ liệu nến từ sàn.');
    }

    const candles: Candle[] = data.map(item => ({
      timestamp: Math.floor(Number(item[0]) / 1000), // Open time in seconds
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }));

    return candles;
  }

  /**
   * Danh sách các cặp tiền hỗ trợ Crawl trực tuyến tức thì
   */
  public static getPopularCrawlSymbols(): { symbol: string; name: string; category: string }[] {
    return [
      { symbol: 'BTCUSDT', name: 'Bitcoin / Tether USDT', category: 'CRYPTO' },
      { symbol: 'ETHUSDT', name: 'Ethereum / Tether USDT', category: 'CRYPTO' },
      { symbol: 'SOLUSDT', name: 'Solana / Tether USDT', category: 'CRYPTO' },
      { symbol: 'BNBUSDT', name: 'Binance Coin / USDT', category: 'CRYPTO' },
      { symbol: 'XRPUSDT', name: 'Ripple / USDT', category: 'CRYPTO' },
      { symbol: 'DOGEUSDT', name: 'Dogecoin / USDT', category: 'CRYPTO' }
    ];
  }
}
