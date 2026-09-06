/**
 * Economic Calendar & News Events Engine
 * 
 * Provides deterministic, real-calendar UTC economic events with accurate dates,
 * release times (NFP 1st Friday 12:30 UTC, CPI mid-month 12:30 UTC, FOMC Wednesday 18:00 UTC),
 * currency tagging, impact levels, and smart bar snapping for Lightweight Charts.
 */

import { CURATED_HISTORICAL_EVENTS } from './historicalCalendarData';

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
 * Helper: Find last Friday of a given year and month (for Core PCE)
 */
function getLastFriday(year: number, month: number, hour = 12, minute = 30): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0, hour, minute, 0));
  const day = lastDay.getUTCDay();
  const diff = (day - 5 + 7) % 7;
  lastDay.setUTCDate(lastDay.getUTCDate() - diff);
  return lastDay;
}

/**
 * Helper: Find nth business day of a month (for ISM PMI)
 */
function getNthBusinessDay(year: number, month: number, n: number, hour = 14, minute = 0): Date {
  let count = 0;
  const d = new Date(Date.UTC(year, month, 1, hour, minute, 0));
  while (d.getUTCMonth() === month) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) {
      count++;
      if (count === n) return d;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
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

  // 1. Seed from Curated Real-World Historical Data first (2023 - 2026)
  const coveredKeys = new Set<string>();
  for (const item of CURATED_HISTORICAL_EVENTS) {
    if (item.timestamp >= minMs && item.timestamp <= maxMs) {
      if (shouldInclude(item.currency)) {
        events.push(item);
        const d = new Date(item.timestamp);
        const dayKey = `${d.getUTCFullYear()}_${d.getUTCMonth()}_${d.getUTCDate()}_CLAIMS`;
        coveredKeys.add(dayKey);
        const prefix = item.title.includes('Non-Farm') ? 'NFP'
          : item.title.includes('Unemployment Rate') ? 'UNEMP'
          : item.title.includes('Core CPI') ? 'CPI'
          : item.title.includes('FOMC') ? 'FOMC'
          : item.title.includes('Bank of England') ? 'BOE'
          : item.title.includes('ECB') ? 'ECB'
          : item.title.includes('PCE') ? 'CORE_PCE'
          : item.title.includes('ISM Manufacturing') ? 'ISM_MFG'
          : item.title.includes('ISM Services') ? 'ISM_SERV'
          : item.title.includes('Jobless Claims') ? 'CLAIMS'
          : item.title.includes('GDP') ? 'GDP'
          : item.title.includes('Retail Sales') ? 'RETAIL'
          : item.title.includes('Bank of Japan') ? 'BOJ'
          : item.title.slice(0, 8);
        coveredKeys.add(`${d.getUTCFullYear()}_${d.getUTCMonth()}_${prefix}`);
      }
    }
  }

  // 2. Calendar Schedule for dates not covered by curated records
  // Authentic Data Rule: NO fake or predicted economic numbers are generated.
  // Unreleased or uncurated events show undefined actual/forecast/previous.
  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === endYear ? endMonth : 11;

    for (let m = mStart; m <= mEnd; m++) {
      // ─────────────────────────────────────────────────────────────
      // 1. US NON-FARM PAYROLLS (NFP) & UNEMPLOYMENT RATE
      // 1st Friday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        const nfpDate = getFirstFriday(y, m);
        const nfpMs = nfpDate.getTime();
        if (nfpMs >= minMs && nfpMs <= maxMs) {
          if (!coveredKeys.has(`${y}_${m}_NFP`)) {
            events.push({
              id: `ev_${y}_${m}_NFP`,
              timestamp: nfpMs,
              timestampSec: Math.floor(nfpMs / 1000),
              currency: 'USD',
              country: 'US',
              title: 'US Non-Farm Employment Change (NFP)',
              impact: 'HIGH',
              sentiment: 'NEUTRAL',
              source: 'CALENDAR_ENGINE'
            });
          }

          // US Unemployment Rate (same time as NFP)
          if (!coveredKeys.has(`${y}_${m}_UNEMP`)) {
            events.push({
              id: `ev_${y}_${m}_UNEMP`,
              timestamp: nfpMs + 1000,
              timestampSec: Math.floor((nfpMs + 1000) / 1000),
              currency: 'USD',
              country: 'US',
              title: 'US Unemployment Rate',
              impact: 'HIGH',
              sentiment: 'NEUTRAL',
              source: 'CALENDAR_ENGINE'
            });
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2. US CONSUMER PRICE INDEX (CPI m/m & y/y)
      // 2nd Wednesday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_CPI`)) {
        const cpiDate = getNthWeekday(y, m, 3, 2, 12, 30); // 2nd Wednesday 12:30 UTC
        const cpiMs = cpiDate.getTime();
        if (cpiMs >= minMs && cpiMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_CPI`,
            timestamp: cpiMs,
            timestampSec: Math.floor(cpiMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core CPI (m/m)',
            impact: 'HIGH',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2B. US CORE PCE PRICE INDEX (Fed's Preferred Inflation Measure)
      // Last Friday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_CORE_PCE`)) {
        const pceDate = getLastFriday(y, m, 12, 30);
        const pceMs = pceDate.getTime();
        if (pceMs >= minMs && pceMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_CORE_PCE`,
            timestamp: pceMs,
            timestampSec: Math.floor(pceMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core PCE Price Index (m/m)',
            impact: 'HIGH',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. US RETAIL SALES (m/m)
      // 2nd Thursday of Month at 12:30 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_RETAIL`)) {
        const retailDate = getNthWeekday(y, m, 4, 2, 12, 30);
        const retailMs = retailDate.getTime();
        if (retailMs >= minMs && retailMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_RETAIL`,
            timestamp: retailMs,
            timestampSec: Math.floor(retailMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core Retail Sales (m/m)',
            impact: 'MEDIUM',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4. US ISM MANUFACTURING & SERVICES PMI
      // 1st Business Day & 3rd Business Day at 14:00 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('USD')) {
        if (!coveredKeys.has(`${y}_${m}_ISM_MFG`)) {
          const ismDate = getNthBusinessDay(y, m, 1, 14, 0);
          const ismMs = ismDate.getTime();
          if (ismMs >= minMs && ismMs <= maxMs) {
            events.push({
              id: `ev_${y}_${m}_ISM_MFG`,
              timestamp: ismMs,
              timestampSec: Math.floor(ismMs / 1000),
              currency: 'USD',
              country: 'US',
              title: 'US ISM Manufacturing PMI',
              impact: 'HIGH',
              sentiment: 'NEUTRAL',
              source: 'CALENDAR_ENGINE'
            });
          }
        }

        // US ISM Services PMI (3rd Business Day)
        if (!coveredKeys.has(`${y}_${m}_ISM_SERV`)) {
          const ismServDate = getNthBusinessDay(y, m, 3, 14, 0);
          const ismServMs = ismServDate.getTime();
          if (ismServMs >= minMs && ismServMs <= maxMs) {
            events.push({
              id: `ev_${y}_${m}_ISM_SERV`,
              timestamp: ismServMs,
              timestampSec: Math.floor(ismServMs / 1000),
              currency: 'USD',
              country: 'US',
              title: 'US ISM Services PMI',
              impact: 'HIGH',
              sentiment: 'NEUTRAL',
              source: 'CALENDAR_ENGINE'
            });
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4B. US ADVANCE GDP (q/q annualized)
      // Scheduled quarterly in Jan, Apr, Jul, Oct (months 0, 3, 6, 9)
      // ─────────────────────────────────────────────────────────────
      const isGdpMonth = [0, 3, 6, 9].includes(m);
      if (shouldInclude('USD') && isGdpMonth && !coveredKeys.has(`${y}_${m}_GDP`)) {
        const gdpDate = getNthWeekday(y, m, 4, 4, 12, 30);
        const gdpMs = gdpDate.getTime();
        if (gdpMs >= minMs && gdpMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_GDP`,
            timestamp: gdpMs,
            timestampSec: Math.floor(gdpMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Advance GDP (q/q)',
            impact: 'HIGH',
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5. FOMC INTEREST RATE DECISION & STATEMENT
      // Scheduled 8 times/year (Jan, Mar, May, Jun, Jul, Sep, Nov, Dec) - 3rd/4th Wed 18:00 UTC
      // ─────────────────────────────────────────────────────────────
      const isFomcMonth = [0, 2, 4, 5, 6, 8, 10, 11].includes(m);
      if (shouldInclude('USD') && isFomcMonth && !coveredKeys.has(`${y}_${m}_FOMC`)) {
        const fomcDate = getNthWeekday(y, m, 3, 3, 18, 0); // 3rd Wednesday 18:00 UTC
        const fomcMs = fomcDate.getTime();
        if (fomcMs >= minMs && fomcMs <= maxMs) {
          events.push({
            id: `ev_${y}_${m}_FOMC_RATE`,
            timestamp: fomcMs,
            timestampSec: Math.floor(fomcMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'Federal Reserve FOMC Rate Decision',
            impact: 'HIGH',
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
      if (shouldInclude('EUR') && isEcbMonth && !coveredKeys.has(`${y}_${m}_ECB`)) {
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
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 7. BANK OF ENGLAND (BOE) RATE DECISION
      // 8 times/year (Feb, Mar, May, Jun, Aug, Sep, Nov, Dec) - Thursday 11:00 UTC
      // ─────────────────────────────────────────────────────────────
      const isBoeMonth = [1, 2, 4, 5, 7, 8, 10, 11].includes(m);
      if (shouldInclude('GBP') && isBoeMonth && !coveredKeys.has(`${y}_${m}_BOE`)) {
        const boeDate = getNthWeekday(y, m, 4, [1, 4, 7, 10].includes(m) ? 1 : 3, 11, 0);
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
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 8. BANK OF JAPAN (BOJ) POLICY RATE
      // Specific Fridays at 03:00 UTC
      // ─────────────────────────────────────────────────────────────
      if (shouldInclude('JPY') && !coveredKeys.has(`${y}_${m}_BOJ`)) {
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
              const dayKey = `${claimsDate.getUTCFullYear()}_${claimsDate.getUTCMonth()}_${claimsDate.getUTCDate()}_CLAIMS`;
              if (claimsMs >= minMs && claimsMs <= maxMs && !coveredKeys.has(dayKey)) {
                events.push({
                  id: `ev_${y}_${m}_CLAIMS_${week}`,
                  timestamp: claimsMs,
                  timestampSec: Math.floor(claimsMs / 1000),
                  currency: 'USD',
                  country: 'US',
                  title: 'US Initial Jobless Claims',
                  impact: 'MEDIUM',
                  sentiment: 'NEUTRAL',
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
