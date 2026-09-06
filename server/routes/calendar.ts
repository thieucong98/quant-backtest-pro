import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { requireAuth } from './users.js';

export const calendarRouter = Router();

/**
 * Helper: Find first Friday of a given year and month (0-indexed month)
 */
function getFirstFriday(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month, 1, 12, 30, 0));
  const day = d.getUTCDay();
  const diff = (5 - day + 7) % 7;
  d.setUTCDate(1 + diff);
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

function seededRandom(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
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

  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === endYear ? endMonth : 11;

    for (let m = mStart; m <= mEnd; m++) {
      const monthSeed = `${y}_${m}`;

      // NFP & Unemployment
      if (shouldInclude('USD')) {
        const nfpDate = getFirstFriday(y, m);
        const nfpMs = nfpDate.getTime();
        if (nfpMs >= minMs && nfpMs <= maxMs) {
          const r = seededRandom(`${monthSeed}_NFP`);
          const forecastK = 180 + Math.floor(r * 80);
          const actualK = forecastK + Math.floor((seededRandom(`${monthSeed}_NFP_ACT`) - 0.45) * 100);
          const prevK = 175 + Math.floor(seededRandom(`${monthSeed}_NFP_PREV`) * 70);

          events.push({
            eventId: `ev_${y}_${m}_NFP`,
            timestamp: BigInt(nfpMs),
            timestampSec: Math.floor(nfpMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Non-Farm Employment Change (NFP)',
            impact: 'HIGH',
            actual: `${actualK}K`,
            forecast: `${forecastK}K`,
            previous: `${prevK}K`,
            sentiment: actualK > forecastK ? 'BULLISH' : 'BEARISH',
            source: 'CALENDAR_ENGINE'
          });

          const unempRate = (3.7 + seededRandom(`${monthSeed}_UNEMP`) * 0.5).toFixed(1);
          events.push({
            eventId: `ev_${y}_${m}_UNEMP`,
            timestamp: BigInt(nfpMs + 1000),
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

      // US CPI
      if (shouldInclude('USD')) {
        const cpiDate = getNthWeekday(y, m, 3, 2, 12, 30);
        const cpiMs = cpiDate.getTime();
        if (cpiMs >= minMs && cpiMs <= maxMs) {
          const r = seededRandom(`${monthSeed}_CPI`);
          const cpiVal = (0.2 + r * 0.3).toFixed(1);
          events.push({
            eventId: `ev_${y}_${m}_CPI`,
            timestamp: BigInt(cpiMs),
            timestampSec: Math.floor(cpiMs / 1000),
            currency: 'USD',
            country: 'US',
            title: 'US Core CPI (m/m)',
            impact: 'HIGH',
            actual: `${cpiVal}%`,
            forecast: '0.3%',
            previous: '0.3%',
            sentiment: Number(cpiVal) > 0.3 ? 'BULLISH' : 'BEARISH',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // FOMC Rate Decision
      const isFomcMonth = [0, 2, 4, 5, 6, 8, 10, 11].includes(m);
      if (shouldInclude('USD') && isFomcMonth) {
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
            actual: '5.25%',
            forecast: '5.25%',
            previous: '5.25%',
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
            sentiment: 'NEUTRAL',
            source: 'CALENDAR_ENGINE'
          });
        }
      }

      // ECB Rate Decision
      const isEcbMonth = [0, 2, 3, 5, 6, 8, 9, 11].includes(m);
      if (shouldInclude('EUR') && isEcbMonth) {
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
            actual: '4.25%',
            forecast: '4.25%',
            previous: '4.50%',
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
              if (claimsMs >= minMs && claimsMs <= maxMs) {
                const claimsVal = 210 + Math.floor(seededRandom(`${monthSeed}_CLAIMS_${week}`) * 30);
                events.push({
                  eventId: `ev_${y}_${m}_CLAIMS_${week}`,
                  timestamp: BigInt(claimsMs),
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

    // 2. If DB has no events for this range, seed deterministically and persist
    if (dbEvents.length === 0) {
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
        dbEvents = await prisma.economicEvent.findMany({
          where: whereClause,
          orderBy: { timestamp: 'asc' }
        });
      }
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
