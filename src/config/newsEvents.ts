export interface EconomicNewsEvent {
  id: string;
  timestamp: number;
  currency: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast?: string;
  previous?: string;
}

export const SAMPLE_ECONOMIC_NEWS: EconomicNewsEvent[] = [
  {
    id: 'news_nfp',
    timestamp: 0, // Sẽ được gán tương đối theo timestamp nến
    currency: 'USD',
    title: 'US Non-Farm Employment Change (NFP)',
    impact: 'HIGH',
    actual: '275K',
    forecast: '200K',
    previous: '229K'
  },
  {
    id: 'news_cpi',
    timestamp: 0,
    currency: 'USD',
    title: 'US Core Consumer Price Index (CPI m/m)',
    impact: 'HIGH',
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.3%'
  },
  {
    id: 'news_fomc',
    timestamp: 0,
    currency: 'USD',
    title: 'Federal Reserve FOMC Rate Statement',
    impact: 'HIGH',
    actual: '5.50%',
    forecast: '5.50%',
    previous: '5.50%'
  },
  {
    id: 'news_ecb',
    timestamp: 0,
    currency: 'EUR',
    title: 'ECB Main Refinancing Rate',
    impact: 'HIGH',
    actual: '4.50%',
    forecast: '4.50%',
    previous: '4.50%'
  }
];

export function generateNewsForCandles(candles: { timestamp: number }[]): EconomicNewsEvent[] {
  if (candles.length < 50) return [];
  const events: EconomicNewsEvent[] = [];
  
  // Rải tin tức định kỳ mỗi 300 - 500 nến
  for (let i = 150; i < candles.length; i += Math.floor(Math.random() * 250) + 200) {
    const template = SAMPLE_ECONOMIC_NEWS[Math.floor(Math.random() * SAMPLE_ECONOMIC_NEWS.length)];
    events.push({
      ...template,
      id: 'news_' + i,
      timestamp: candles[i].timestamp
    });
  }

  return events;
}
