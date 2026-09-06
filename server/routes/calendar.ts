import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth } from './users.js';
import { SERVER_HISTORICAL_EVENTS } from '../data/historicalCalendarData.js';

export const calendarRouter = Router();

// Auto-seed historical curated events if table needs update
async function ensureHistoricalSeed() {
  try {
    const count = await prisma.economicEvent.count({
      where: { source: 'HISTORICAL_REAL' }
    });
    if (count < SERVER_HISTORICAL_EVENTS.length) {
      console.log(`🌱 Seeding curated authentic historical economic events (${SERVER_HISTORICAL_EVENTS.length} events)...`);
      for (const item of SERVER_HISTORICAL_EVENTS) {
        await prisma.economicEvent.upsert({
          where: { eventId: item.id },
          update: {
            timestamp: BigInt(item.timestamp),
            timestampSec: item.timestampSec,
            currency: item.currency,
            country: item.country,
            title: item.title,
            impact: item.impact,
            actual: item.actual,
            forecast: item.forecast,
            previous: item.previous,
            sentiment: item.sentiment,
            source: item.source
          },
          create: {
            eventId: item.id,
            timestamp: BigInt(item.timestamp),
            timestampSec: item.timestampSec,
            currency: item.currency,
            country: item.country,
            title: item.title,
            impact: item.impact,
            actual: item.actual,
            forecast: item.forecast,
            previous: item.previous,
            sentiment: item.sentiment,
            source: item.source
          }
        });
      }
      console.log(`✅ Seeded ${SERVER_HISTORICAL_EVENTS.length} real historical events successfully.`);
    }
  } catch (err: any) {
    console.warn('[EconomicEvent Seed Warning]', err.message);
  }
}
ensureHistoricalSeed();

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
 * Helper: Find last Friday of a given year and month
 */
function getLastFriday(year: number, month: number, hour = 12, minute = 30): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0, hour, minute, 0));
  const day = lastDay.getUTCDay();
  const diff = (day - 5 + 7) % 7;
  lastDay.setUTCDate(lastDay.getUTCDate() - diff);
  return lastDay;
}

/**
 * Helper: Find nth business day of a month
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
 * Helper: Find nth weekday of month
 */
function getNthWeekday(year: number, month: number, targetDayOfWeek: number, nth: number, hour: number, minute: number): Date {
  const d = new Date(Date.UTC(year, month, 1, hour, minute, 0));
  const day = d.getUTCDay();
  const diff = (targetDayOfWeek - day + 7) % 7;
  const targetDate = 1 + diff + (nth - 1) * 7;
  d.setUTCDate(targetDate);
  return d;
}

function getCurrenciesForSymbol(symbol: string): string[] {
  const s = (symbol || '').toUpperCase();
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
  if (s.includes('BTC') || s.includes('ETH')) return ['USD', 'GLOBAL'];
  if (s.length === 6) return [s.slice(0, 3), s.slice(3, 6)];
  return ['USD', 'GLOBAL'];
}

function generateDeterministicCalendarEvents(startTs: number, endTs: number, targetCurrencies?: string[]) {
  const minMs = startTs > 1e11 ? startTs : startTs * 1000;
  const maxMs = endTs > 1e11 ? endTs : endTs * 1000;
  if (minMs >= maxMs || isNaN(minMs) || isNaN(maxMs)) return [];

  const startDate = new Date(minMs);
  const endDate = new Date(maxMs);
  const startYear = startDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();
  const endMonth = endDate.getUTCMonth();

  const events: any[] = [];
  const allowedCurrencies = targetCurrencies ? new Set(targetCurrencies.map(c => c.toUpperCase())) : null;

  const shouldInclude = (curr: string) => {
    if (!allowedCurrencies) return true;
    return allowedCurrencies.has(curr.toUpperCase()) || allowedCurrencies.has('GLOBAL') || curr === 'GLOBAL';
  };

  // Build coveredKeys from curated authentic historical records
  const coveredKeys = new Set<string>();
  for (const item of SERVER_HISTORICAL_EVENTS) {
    if (item.timestamp >= minMs && item.timestamp <= maxMs) {
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

  // Authentic Data Rule: NO fake or predicted economic numbers are generated.
  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === endYear ? endMonth : 11;

    for (let m = mStart; m <= mEnd; m++) {
      // NFP & Unemployment
      if (shouldInclude('USD')) {
        const nfpDate = getFirstFriday(y, m);
        const nfpMs = nfpDate.getTime();
        if (nfpMs >= minMs && nfpMs <= maxMs) {
          if (!coveredKeys.has(`${y}_${m}_NFP`)) {
            events.push({
              eventId: `ev_${y}_${m}_NFP`,
              timestamp: BigInt(nfpMs),
              timestampSec: Math.floor(nfpMs / 1000),
              currency: 'USD',
              country: 'US',
              title: 'US Non-Farm Employment Change (NFP)',
              impact: 'HIGH',
              actual: null,
              forecast: null,
              previous: null,
              sentiment: 'NEUTRAL',
              source: 'CALENDAR_ENGINE'
            });
          }

          if (!coveredKeys.has(`${y}_${m}_UNEMP`)) {
            events.push({
              eventId: `ev_${y}_${m}_UNEMP`,
              timestamp: BigInt(nfpMs + 1000),
              timestampSec: Math.floor((nfpMs + 1000) / 1000),
              currency: 'USD',
              country: 'US',
              title: 'US Unemployment Rate',
              impact: 'HIGH',
              actual: null,
              forecast: null,
              previous: null,
              sentiment: 'NEUTRAL',
              source: 'CALENDAR_ENGINE'
            });
          }
        }
      }

      // US CPI
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_CPI`)) {
        const cpiDate = getNthWeekday(y, m, 3, 2, 12, 30);
        const cpiMs = cpiDate.getTime();
        if (cpiMs >= minMs && cpiMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_CPI`,
            timestamp: BigInt(cpiMs),
            timestampSec: Math.floor(cpiMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core CPI (m/m)',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // Core PCE Price Index
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_CORE_PCE`)) {
        const pceDate = getLastFriday(y, m, 12, 30);
        const pceMs = pceDate.getTime();
        if (pceMs >= minMs && pceMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_CORE_PCE`,
            timestamp: BigInt(pceMs),
            timestampSec: Math.floor(pceMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core PCE Price Index (m/m)',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ISM Manufacturing PMI
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_ISM_MFG`)) {
        const ismDate = getNthBusinessDay(y, m, 1, 14, 0);
        const ismMs = ismDate.getTime();
        if (ismMs >= minMs && ismMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_ISM_MFG`,
            timestamp: BigInt(ismMs),
            timestampSec: Math.floor(ismMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US ISM Manufacturing PMI',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ISM Services PMI
      if (shouldInclude('USD') && !coveredKeys.has(`${y}_${m}_ISM_SERV`)) {
        const ismServDate = getNthBusinessDay(y, m, 3, 14, 0);
        const ismServMs = ismServDate.getTime();
        if (ismServMs >= minMs && ismServMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_ISM_SERV`,
            timestamp: BigInt(ismServMs),
            timestampSec: Math.floor(ismServMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US ISM Services PMI',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // US Advance GDP (quarterly)
      const isGdpMonth = [0, 3, 6, 9].includes(m);
      if (shouldInclude('USD') && isGdpMonth && !coveredKeys.has(`${y}_${m}_GDP`)) {
        const gdpDate = getNthWeekday(y, m, 4, 4, 12, 30);
        const gdpMs = gdpDate.getTime();
        if (gdpMs >= minMs && gdpMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_GDP`,
            timestamp: BigInt(gdpMs),
            timestampSec: Math.floor(gdpMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Advance GDP (q/q)',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // FOMC Rate Decision
      const isFomcMonth = [0, 2, 4, 5, 6, 8, 10, 11].includes(m);
      if (shouldInclude('USD') && isFomcMonth && !coveredKeys.has(`${y}_${m}_FOMC`)) {
        const fomcDate = getNthWeekday(y, m, 3, 3, 18, 0);
        const fomcMs = fomcDate.getTime();
        if (fomcMs >= minMs && fomcMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_FOMC_RATE`,
            timestamp: BigInt(fomcMs),
            timestampSec: Math.floor(fomcMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'Federal Reserve FOMC Rate Decision',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });

          events.push({
            eventId: `ev_${y}_${m}_FOMC_PRESS`,
            timestamp: BigInt(fomcMs + 1800000),
            timestampSec: Math.floor((fomcMs + 1800000) / 1000),
            currency: 'USD',
            country: 'US',
            title: 'FOMC Press Conference (Fed Chair)',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ECB Rate Decision
      const isEcbMonth = [0, 2, 3, 5, 6, 8, 9, 11].includes(m);
      if (shouldInclude('EUR') && isEcbMonth && !coveredKeys.has(`${y}_${m}_ECB`)) {
        const ecbDate = getNthWeekday(y, m, 4, 2, 12, 15);
        const ecbMs = ecbDate.getTime();
        if (ecbMs >= minMs && ecbMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_ECB_RATE`,
            timestamp: BigInt(ecbMs),
            timestampSec: Math.floor(ecbMs / 1000),
            currency: 'EUR',
            country: 'EU',
            title: 'ECB Main Refinancing Rate',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // Bank of England (BoE) Rate Decision (8 times/year)
      const isBoeMonth = [1, 2, 4, 5, 7, 8, 10, 11].includes(m);
      if (shouldInclude('GBP') && isBoeMonth && !coveredKeys.has(`${y}_${m}_BOE`)) {
        const boeDate = getNthWeekday(y, m, 4, [1, 4, 7, 10].includes(m) ? 1 : 3, 11, 0);
        const boeMs = boeDate.getTime();
        if (boeMs >= minMs && boeMs <= maxMs) {
          events.push({
            eventId: `ev_${y}_${m}_BOE_RATE`,
            timestamp: BigInt(boeMs),
            timestampSec: Math.floor(boeMs / 1000),
            currency: 'GBP',
            country: 'GB',
            title: 'Bank of England Official Bank Rate',
            impact: 'HIGH',
            actual: null,
            forecast: null,
            previous: null,
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // Initial Jobless Claims
      if (shouldInclude('USD')) {
        for (let week = 1; week <= 5; week++) {
          try {
            const claimsDate = getNthWeekday(y, m, 4, week, 12, 30);
            if (claimsDate.getUTCMonth() === m) {
              const claimsMs = claimsDate.getTime();
              const dayKey = `${claimsDate.getUTCFullYear()}_${claimsDate.getUTCMonth()}_${claimsDate.getUTCDate()}_CLAIMS`;
              if (claimsMs >= minMs && claimsMs <= maxMs && !coveredKeys.has(dayKey)) {
                events.push({
                  eventId: `ev_${y}_${m}_CLAIMS_${week}`,
                  timestamp: BigInt(claimsMs),
                  timestampSec: Math.floor(claimsMs / 1000),
                  currency: 'USD',
                  country: 'US',
                  title: 'US Initial Jobless Claims',
                  impact: 'MEDIUM',
                  actual: null,
                  forecast: null,
                  previous: null,
                  sentiment: 'NEUTRAL',
                  source: 'CALENDAR_ENGINE'
                });
              }
            }
          } catch {}
        }
      }
    }
  }

  return events;
}

/**
 * GET /api/calendar
 * Query economic events with time range, symbol/currency and impact filtering
 */
calendarRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, symbol, currencies, impact } = req.query;

    const fromMs = Number(from) || Date.now() - 30 * 86400000;
    const toMs = Number(to) || Date.now() + 30 * 86400000;

    let targetCurrencies: string[] | undefined;
    if (currencies && typeof currencies === 'string') {
      targetCurrencies = currencies.split(',').map(c => c.trim().toUpperCase());
    } else if (symbol && typeof symbol === 'string') {
      targetCurrencies = getCurrenciesForSymbol(symbol);
    }

    const whereClause: any = {
      timestamp: {
        gte: BigInt(fromMs),
        lte: BigInt(toMs)
      }
    };

    if (targetCurrencies && targetCurrencies.length > 0) {
      whereClause.currency = {
        in: [...targetCurrencies, 'GLOBAL']
      };
    }

    if (impact && typeof impact === 'string' && impact !== 'ALL') {
      if (impact === 'HIGH') {
        whereClause.impact = 'HIGH';
      } else if (impact === 'HIGH_MEDIUM') {
        whereClause.impact = { in: ['HIGH', 'MEDIUM'] };
      }
    }

    // 1. Query Prisma DB
    let dbEvents = await prisma.economicEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'asc' }
    });

    // 2. If DB has no events for this range, seed curated real historical data and precision events
    if (dbEvents.length === 0) {
      // Seed real historical events that match range
      for (const item of SERVER_HISTORICAL_EVENTS) {
        if (item.timestamp >= fromMs && item.timestamp <= toMs) {
          try {
            await prisma.economicEvent.upsert({
              where: { eventId: item.id },
              update: {
                timestamp: BigInt(item.timestamp),
                timestampSec: item.timestampSec,
                currency: item.currency,
                country: item.country,
                title: item.title,
                impact: item.impact,
                actual: item.actual,
                forecast: item.forecast,
                previous: item.previous,
                sentiment: item.sentiment,
                source: item.source
              },
              create: {
                eventId: item.id,
                timestamp: BigInt(item.timestamp),
                timestampSec: item.timestampSec,
                currency: item.currency,
                country: item.country,
                title: item.title,
                impact: item.impact,
                actual: item.actual,
                forecast: item.forecast,
                previous: item.previous,
                sentiment: item.sentiment,
                source: item.source
              }
            });
          } catch {}
        }
      }

      const generated = generateDeterministicCalendarEvents(fromMs, toMs, targetCurrencies);
      if (generated.length > 0) {
        for (const item of generated) {
          try {
            await prisma.economicEvent.upsert({
              where: { eventId: item.eventId },
              update: item,
              create: item
            });
          } catch {}
        }
      }
      dbEvents = await prisma.economicEvent.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' }
      });
    }

    // Format response (convert BigInt to Number for JSON serialization)
    const formatted = dbEvents.map(e => ({
      id: e.eventId,
      timestamp: Number(e.timestamp),
      timestampSec: e.timestampSec,
      currency: e.currency,
      country: e.country,
      title: e.title,
      impact: e.impact,
      actual: e.actual,
      forecast: e.forecast,
      previous: e.previous,
      sentiment: e.sentiment,
      source: e.source
    }));

    res.json({
      success: true,
      count: formatted.length,
      from: fromMs,
      to: toMs,
      currencies: targetCurrencies,
      events: formatted
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch economic calendar',
      error: error.message
    });
  }
});

/**
 * POST /api/calendar/sync-forexfactory
 * Fetch live weekly economic events directly from Forex Factory official feed
 */
calendarRouter.post('/sync-forexfactory', async (_req: Request, res: Response): Promise<void> => {
  try {
    const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
    const response = await fetch(FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (response.status === 429) {
      res.status(200).json({
        success: false,
        rateLimited: true,
        message: 'Forex Factory server rate-limited (HTTP 429). Hệ thống tự động kích hoạt Precision Engine & Bộ dữ liệu lưu trữ.'
      });
      return;
    }

    if (!response.ok) {
      res.status(200).json({
        success: false,
        message: `Forex Factory trả về HTTP ${response.status}. Sử dụng dữ liệu Precision Engine.`
      });
      return;
    }

    const data: any = await response.json();
    if (!Array.isArray(data)) {
      res.status(400).json({ success: false, message: 'Dữ liệu Forex Factory không hợp lệ' });
      return;
    }

    let inserted = 0;
    for (const item of data) {
      if (!item.title || !item.date) continue;
      const ts = new Date(item.date).getTime();
      if (isNaN(ts)) continue;

      const currency = (item.country === 'All' ? 'GLOBAL' : item.country || 'USD').toUpperCase();
      const rawImpact = (item.impact || 'Medium').toUpperCase();
      const impact = rawImpact === 'HIGH' ? 'HIGH' : rawImpact === 'LOW' || rawImpact === 'HOLIDAY' ? 'LOW' : 'MEDIUM';
      const eventId = `ff_${ts}_${currency}_${item.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`;

      await prisma.economicEvent.upsert({
        where: { eventId },
        update: {
          timestamp: BigInt(ts),
          timestampSec: Math.floor(ts / 1000),
          currency,
          country: currency === 'GLOBAL' ? 'GLOBAL' : currency.slice(0, 2),
          title: item.title,
          impact,
          actual: item.actual || null,
          forecast: item.forecast || null,
          previous: item.previous || null,
          sentiment: item.sentiment || 'NEUTRAL',
          source: 'FOREX_FACTORY'
        },
        create: {
          eventId,
          timestamp: BigInt(ts),
          timestampSec: Math.floor(ts / 1000),
          currency,
          country: currency === 'GLOBAL' ? 'GLOBAL' : currency.slice(0, 2),
          title: item.title,
          impact,
          actual: item.actual || null,
          forecast: item.forecast || null,
          previous: item.previous || null,
          sentiment: item.sentiment || 'NEUTRAL',
          source: 'FOREX_FACTORY'
        }
      });
      inserted++;
    }

    res.json({
      success: true,
      count: inserted,
      message: `Đồng bộ thành công ${inserted} sự kiện từ Forex Factory Live Feed`
    });
  } catch (error: any) {
    res.status(200).json({
      success: false,
      message: 'Không thể kết nối Forex Factory Live: ' + error.message,
      error: error.message
    });
  }
});

/**
 * POST /api/calendar/sync
 * Bulk save / upsert calendar events
 */
calendarRouter.post('/sync', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      res.status(400).json({ success: false, message: 'Events must be an array' });
      return;
    }

    let inserted = 0;
    for (const ev of events) {
      const ts = Number(ev.timestamp) || Date.now();
      const item = {
        eventId: ev.id || `ev_${ts}_${ev.currency || 'USD'}`,
        timestamp: BigInt(ts),
        timestampSec: Math.floor(ts / 1000),
        currency: (ev.currency || 'USD').toUpperCase(),
        country: ev.country || 'US',
        title: ev.title || 'Economic Event',
        impact: ev.impact || 'MEDIUM',
        actual: ev.actual || null,
        forecast: ev.forecast || null,
        previous: ev.previous || null,
        sentiment: ev.sentiment || 'NEUTRAL',
        source: ev.source || 'USER_IMPORT'
      };

      await prisma.economicEvent.upsert({
        where: { eventId: item.eventId },
        update: item,
        create: item
      });
      inserted++;
    }

    res.json({
      success: true,
      message: `Successfully synced ${inserted} calendar events`,
      count: inserted
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync calendar events',
      error: error.message
    });
  }
});

/**
 * POST /api/calendar/import
 * Import Forex Factory format CSV or JSON
 */
calendarRouter.post('/import', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { csvContent, jsonEvents } = req.body;
    const parsedEvents: any[] = [];

    if (jsonEvents && Array.isArray(jsonEvents)) {
      parsedEvents.push(...jsonEvents);
    } else if (csvContent && typeof csvContent === 'string') {
      // Parse CSV lines: Date,Time,Currency,Impact,Event,Actual,Forecast,Previous
      const lines = csvContent.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 5) {
          const [dateStr, timeStr, currency, impact, title, actual, forecast, previous] = parts;
          const fullDateTime = new Date(`${dateStr} ${timeStr || '12:00:00'} UTC`);
          const ts = !isNaN(fullDateTime.getTime()) ? fullDateTime.getTime() : Date.now();
          parsedEvents.push({
            id: `ff_${ts}_${currency}_${i}`,
            timestamp: ts,
            currency: currency.toUpperCase(),
            country: currency.slice(0, 2),
            impact: ['HIGH', 'MEDIUM', 'LOW'].includes(impact.toUpperCase()) ? impact.toUpperCase() : 'MEDIUM',
            title,
            actual: actual || undefined,
            forecast: forecast || undefined,
            previous: previous || undefined,
            source: 'FOREX_FACTORY'
          });
        }
      }
    }

    let count = 0;
    for (const ev of parsedEvents) {
      const ts = Number(ev.timestamp) || Date.now();
      const item = {
        eventId: ev.id || `ev_${ts}_${ev.currency || 'USD'}`,
        timestamp: BigInt(ts),
        timestampSec: Math.floor(ts / 1000),
        currency: (ev.currency || 'USD').toUpperCase(),
        country: ev.country || 'US',
        title: ev.title || 'Economic Event',
        impact: ev.impact || 'MEDIUM',
        actual: ev.actual || null,
        forecast: ev.forecast || null,
        previous: ev.previous || null,
        sentiment: ev.sentiment || 'NEUTRAL',
        source: ev.source || 'USER_IMPORT'
      };

      await prisma.economicEvent.upsert({
        where: { eventId: item.eventId },
        update: item,
        create: item
      });
      count++;
    }

    res.json({
      success: true,
      message: `Imported ${count} economic events successfully`,
      count
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to import calendar data',
      error: error.message
    });
  }
});
