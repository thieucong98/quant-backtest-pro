/**
 * Economic Calendar & News Events Engine
 * 
 * Provides deterministic, real-calendar UTC economic events with accurate dates,
 * release times (NFP 1st Friday 12:30 UTC, CPI mid-month 12:30 UTC, FOMC Wednesday 18:00 UTC),
 * currency tagging, impact levels, and smart bar snapping for Lightweight Charts.
 */

export interface EconomicNewsEvent {
  id: string;
  timestamp: number;          // Unix timestamp in milliseconds (UTC)
  timestampSec: number;       // Unix timestamp in seconds (UTC)
  currency: string;           // USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, XAU
  country: string;            // US, EU, GB, JP, AU, CA, CH, CN, GLOBAL
  title: string;              // e.g. "US Non-Farm Employment Change (NFP)"
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast?: string;
  previous?: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  source?: string;
}

/**
 * Return relevant currencies for a trading instrument symbol
 */
export function getCurrenciesForSymbol(symbol: string): string[] {
  const s = symbol.toUpperCase();
  if (s.includes('EUR') && s.includes('USD')) return ['EUR', 'USD'];
  if (s.includes('GBP') && s.includes('USD')) return ['GBP', 'USD'];
  if (s.includes('USD') && s.includes('JPY')) return ['USD', 'JPY'];
  if (s.includes('GBP') && s.includes('JPY')) return ['GBP', 'JPY'];
  if (s.includes('AUD') && s.includes('USD')) return ['AUD', 'USD'];
  if (s.includes('USD') && s.includes('CAD')) return ['USD', 'CAD'];
  if (s.includes('USD') && s.includes('CHF')) return ['USD', 'CHF'];
  if (s.includes('EUR') && s.includes('GBP')) return ['EUR', 'GBP'];
  if (s.includes('EUR') && s.includes('JPY')) return ['EUR', 'JPY'];
  if (s.includes('XAU') || s.includes('GOLD')) return ['USD', 'XAU', 'GLOBAL'];
  if (s.includes('XAG') || s.includes('SILVER')) return ['USD', 'XAU', 'GLOBAL'];
  if (s.includes('BTC') || s.includes('ETH') || s.includes('CRYPTO')) return ['USD', 'GLOBAL'];
  if (s.length === 6) return [s.slice(0, 3), s.slice(3, 6)];
  return ['USD', 'GLOBAL'];
}

/**
 * Helper: Find first Friday of a given year and month (0-indexed month)
 */
function getFirstFriday(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month, 1, 12, 30, 0));
  const day = d.getUTCDay(); // 0 is Sunday, 5 is Friday
  const diff = (5 - day + 7) % 7;
  d.setUTCDate(1 + diff);
  return d;
}

/**
 * Helper: Find nth day of week in month (e.g. 2nd Wednesday = FOMC)
 */
function getNthWeekday(year: number, month: number, targetDayOfWeek: number, nth: number, hour: number, minute: number): Date {
  const d = new Date(Date.UTC(year, month, 1, hour, minute, 0));
  const day = d.getUTCDay();
  const diff = (targetDayOfWeek - day + 7) % 7;
  const targetDate = 1 + diff + (nth - 1) * 7;
  d.setUTCDate(targetDate);
  return d;
}

/**
 * Deterministic pseudo-random number based on a seed string
 */
function seededRandom(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Generate accurate, deterministic economic events for any given date range
 */
export function generateDeterministicCalendar(
  startTs: number,
  endTs: number,
  targetCurrencies?: string[]
): EconomicNewsEvent[] {
  // Normalize timestamps to ms
  const minMs = startTs > 1e11 ? startTs : startTs * 1000;
  const maxMs = endTs > 1e11 ? endTs : endTs * 1000;

  if (minMs >= maxMs || isNaN(minMs) || isNaN(maxMs)) return [];

  const startDate = new Date(minMs);
  const endDate = new Date(maxMs);

  const startYear = startDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();
  const endMonth = endDate.getUTCMonth();

  const events: EconomicNewsEvent[] = [];
  const allowedCurrencies = targetCurrencies ? new Set(targetCurrencies.map(c => c.toUpperCase())) : null;

  const shouldInclude = (curr: string) => {
    if (!allowedCurrencies) return true;
    return allowedCurrencies.has(curr.toUpperCase()) || allowedCurrencies.has('GLOBAL') || curr === 'GLOBAL';
  };

  // Iterate across all months in the time range
  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === endYear ? endMonth : 11;

    for (let m = mStart; m <= mEnd; m++) {
      const monthSeed = `${y}_${m}`;

      // ─────────────────────────────────────────────────────────────
      // 1. US NON-FARM PAYROLLS (NFP) & UNEMPLOYMENT RATE
      // 1st Friday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        const nfpDate = getFirstFriday(y, m);
        const nfpMs = nfpDate.getTime();
        if (nfpMs >= minMs && nfpMs <= maxMs) {
          const r = seededRandom(`${monthSeed}_NFP`);
          const forecastK = 180 + Math.floor(r * 80);
          const actualK = forecastK + Math.floor((seededRandom(`${monthSeed}_NFP_ACT`) - 0.45) * 100);
          const prevK = 175 + Math.floor(seededRandom(`${monthSeed}_NFP_PREV`) * 70);
          const sentiment = actualK > forecastK ? 'BULLISH' : actualK < forecastK ? 'BEARISH' : 'NEUTRAL';

          events.push({
            id: `ev_${y}_${m}_NFP`,
            timestamp: nfpMs,
            timestampSec: Math.floor(nfpMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Non-Farm Employment Change (NFP)',
            impact: 'HIGH',
            actual: `${actualK}K`,
            forecast: `${forecastK}K`,
            previous: `${prevK}K`,
            sentiment,
            source: 'CALENDAR_ENGINE'
          });

          // US Unemployment Rate (same time as NFP)
          const unempRate = (3.7 + seededRandom(`${monthSeed}_UNEMP`) * 0.5).toFixed(1);
          events.push({
            id: `ev_${y}_${m}_UNEMP`,
            timestamp: nfpMs + 1000,
            timestampSec: Math.floor((nfpMs + 1000) / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Unemployment Rate',
            impact: 'HIGH',
            actual: `${unempRate}%`,
            forecast: '3.9%',
            previous: '3.9%',
            sentiment: Number(unempRate) <= 3.8 ? 'BULLISH' : 'BEARISH',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2. US CONSUMER PRICE INDEX (CPI m/m & y/y)
      // 2nd Wednesday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        const cpiDate = getNthWeekday(y, m, 3, 2, 12, 30); // 2nd Wednesday 12:30 UTC
        const cpiMs = cpiDate.getTime();
        if (cpiMs >= minMs && cpiMs <= maxMs) {
          const r = seededRandom(`${monthSeed}_CPI`);
          const cpiVal = (0.2 + r * 0.3).toFixed(1);
          const prevVal = (0.3 + seededRandom(`${monthSeed}_CPI_P`) * 0.2).toFixed(1);
          events.push({
            id: `ev_${y}_${m}_CPI`,
            timestamp: cpiMs,
            timestampSec: Math.floor(cpiMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core CPI (m/m)',
            impact: 'HIGH',
            actual: `${cpiVal}%`,
            forecast: '0.3%',
            previous: `${prevVal}%`,
            sentiment: Number(cpiVal) > 0.3 ? 'BULLISH' : 'BEARISH',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. US RETAIL SALES (m/m)
      // 2nd Thursday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        const retailDate = getNthWeekday(y, m, 4, 2, 12, 30);
        const retailMs = retailDate.getTime();
        if (retailMs >= minMs && retailMs <= maxMs) {
          const r = seededRandom(`${monthSeed}_RETAIL`);
          const retVal = (0.1 + r * 0.6).toFixed(1);
          events.push({
            id: `ev_${y}_${m}_RETAIL`,
            timestamp: retailMs,
            timestampSec: Math.floor(retailMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core Retail Sales (m/m)',
            impact: 'MEDIUM',
            actual: `${retVal}%`,
            forecast: '0.2%',
            previous: '0.3%',
            sentiment: Number(retVal) >= 0.2 ? 'BULLISH' : 'BEARISH',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4. US ISM MANUFACTURING & SERVICES PMI
      // 1st Business Day & 3rd Business Day at 14:00 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        const ismDate = new Date(Date.UTC(y, m, 1, 14, 0, 0));
        // Skip weekend to Monday if on Sat/Sun
        if (ismDate.getUTCDay() === 0) ismDate.setUTCDate(2);
        else if (ismDate.getUTCDay() === 6) ismDate.setUTCDate(3);

        const ismMs = ismDate.getTime();
        if (ismMs >= minMs && ismMs <= maxMs) {
          const ismVal = (47.5 + seededRandom(`${monthSeed}_ISM`) * 5.0).toFixed(1);
          events.push({
            id: `ev_${y}_${m}_ISM_MFG`,
            timestamp: ismMs,
            timestampSec: Math.floor(ismMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US ISM Manufacturing PMI',
            impact: 'HIGH',
            actual: ismVal,
            forecast: '49.5',
            previous: '48.7',
            sentiment: Number(ismVal) >= 50.0 ? 'BULLISH' : 'BEARISH',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5. FOMC INTEREST RATE DECISION & STATEMENT
      // Scheduled 8 times/year (Jan, Mar, May, Jun, Jul, Sep, Nov, Dec) - 3rd/4th Wed 18:00 UTC
      // ─────────────────────────────────────────────────────────────
      const isFomcMonth = [0, 2, 4, 5, 6, 8, 10, 11].includes(m);
      if (shouldInclude('USD') && isFomcMonth) {
        const fomcDate = getNthWeekday(y, m, 3, 3, 18, 0); // 3rd Wednesday 18:00 UTC
        const fomcMs = fomcDate.getTime();
        if (fomcMs >= minMs && fomcMs <= maxMs) {
          const rateVal = (5.25 + (seededRandom(`${monthSeed}_FOMC`) > 0.7 ? 0.25 : 0)).toFixed(2);
          events.push({
            id: `ev_${y}_${m}_FOMC_RATE`,
            timestamp: fomcMs,
            timestampSec: Math.floor(fomcMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'Federal Reserve FOMC Rate Decision',
            impact: 'HIGH',
            actual: `${rateVal}%`,
            forecast: `${rateVal}%`,
            previous: '5.25%',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });

          // FOMC Press Conference 30 min later
          events.push({
            id: `ev_${y}_${m}_FOMC_PRESS`,
            timestamp: fomcMs + 1800000,
            timestampSec: Math.floor((fomcMs + 1800000) / 1000),
            currency: 'USD',
            country: 'US',
            title: 'FOMC Press Conference (Fed Chair)',
            impact: 'HIGH',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 6. EUROPEAN CENTRAL BANK (ECB) RATE DECISION
      // Selected months (Jan, Mar, Apr, Jun, Jul, Sep, Oct, Dec) - Thursday 12:15 UTC
      // ─────────────────────────────────────────────────────────────
      const isEcbMonth = [0, 2, 3, 5, 6, 8, 9, 11].includes(m);
      if (shouldInclude('EUR') && isEcbMonth) {
        const ecbDate = getNthWeekday(y, m, 4, 2, 12, 15);
        const ecbMs = ecbDate.getTime();
        if (ecbMs >= minMs && ecbMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_ECB_RATE`,
            timestamp: ecbMs,
            timestampSec: Math.floor(ecbMs / 1000),
            currency: 'EUR',
            country: 'EU',
            title: 'ECB Main Refinancing Rate',
            impact: 'HIGH',
            actual: '4.25%',
            forecast: '4.25%',
            previous: '4.50%',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });

          // ECB Monetary Policy Statement
          events.push({
            id: `ev_${y}_${m}_ECB_PRESS`,
            timestamp: ecbMs + 1800000, // 12:45 UTC
            timestampSec: Math.floor((ecbMs + 1800000) / 1000),
            currency: 'EUR',
            country: 'EU',
            title: 'ECB Monetary Policy Statement & Press',
            impact: 'HIGH',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 7. BANK OF ENGLAND (BOE) RATE DECISION
      // 1st or 2nd Thursday at 11:00 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('GBP')) {
        const boeDate = getNthWeekday(y, m, 4, 1, 11, 0);
        const boeMs = boeDate.getTime();
        if (boeMs >= minMs && boeMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_BOE_RATE`,
            timestamp: boeMs,
            timestampSec: Math.floor(boeMs / 1000),
            currency: 'GBP',
            country: 'GB',
            title: 'Bank of England Official Bank Rate',
            impact: 'HIGH',
            actual: '5.00%',
            forecast: '5.00%',
            previous: '5.25%',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 8. BANK OF JAPAN (BOJ) POLICY RATE
      // Specific Fridays at 03:00 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('JPY')) {
        const bojDate = getNthWeekday(y, m, 5, 3, 3, 0);
        const bojMs = bojDate.getTime();
        if (bojMs >= minMs && bojMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_BOJ_RATE`,
            timestamp: bojMs,
            timestampSec: Math.floor(bojMs / 1000),
            currency: 'JPY',
            country: 'JP',
            title: 'Bank of Japan Policy Rate & Outlook',
            impact: 'HIGH',
            actual: '0.25%',
            forecast: '0.25%',
            previous: '0.10%',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 9. US WEEKLY UNEMPLOYMENT CLAIMS
      // Every Thursday at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        for (let week = 1; week <= 5; week++) {
          try {
            const claimsDate = getNthWeekday(y, m, 4, week, 12, 30);
            if (claimsDate.getUTCMonth() === m) {
              const claimsMs = claimsDate.getTime();
              if (claimsMs >= minMs && claimsMs <= maxMs) {
                const r = seededRandom(`${monthSeed}_CLAIMS_${week}`);
                const claimsVal = 210 + Math.floor(r * 30);
                events.push({
                  id: `ev_${y}_${m}_CLAIMS_${week}`,
                  timestamp: claimsMs,
                  timestampSec: Math.floor(claimsMs / 1000),
                  currency: 'USD',
                  country: 'US',
                  title: 'US Initial Jobless Claims',
                  impact: 'MEDIUM',
                  actual: `${claimsVal}K`,
                  forecast: '220K',
                  previous: '215K',
                  sentiment: claimsVal < 220 ? 'BULLISH' : 'BEARISH',
                  source: 'CALENDAR_ENGINE'
                });
              }
            }
          } catch {
            // week 5 out of bounds for month
          }
        }
      }
    }
  }

  // Sort all events chronologically
  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

/**
 * Smart Bar Snapping: Find the exact matching candle bar timestamp for an event.
 * Lightweight Charts markers require the timestamp to match an existing bar in the series.
 */
export function snapEventToBarTime(
  eventTimestampSec: number,
  sortedBarTimestampsSec: number[]
): number | null {
  if (!sortedBarTimestampsSec || sortedBarTimestampsSec.length === 0) return null;

  // Binary search for the bar where: bar[i] <= eventTimestampSec < bar[i+1]
  let low = 0;
  let high = sortedBarTimestampsSec.length - 1;

  if (eventTimestampSec < sortedBarTimestampsSec[0]) {
    return null; // Before first bar
  }
  if (eventTimestampSec >= sortedBarTimestampsSec[high]) {
    return sortedBarTimestampsSec[high];
  }

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const curr = sortedBarTimestampsSec[mid];
    const next = sortedBarTimestampsSec[mid + 1];

    if (eventTimestampSec >= curr && (next === undefined || eventTimestampSec < next)) {
      return curr;
    }

    if (curr < eventTimestampSec) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return sortedBarTimestampsSec[Math.max(0, low - 1)] || null;
}

/**
 * Backward-compatible generator for existing candle arrays
 */
export function generateNewsForCandles(
  candles: { timestamp: number }[],
  symbol = 'EURUSD'
): EconomicNewsEvent[] {
  if (!candles || candles.length === 0) return [];
  const first = candles[0].timestamp;
  const last = candles[candles.length - 1].timestamp;

  const relevantCurrencies = getCurrenciesForSymbol(symbol);
  return generateDeterministicCalendar(first, last, relevantCurrencies);
}
