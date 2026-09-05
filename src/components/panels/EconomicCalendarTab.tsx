import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation, formatText } from '../../i18n';
import { EconomicNewsEvent } from '../../config/newsEvents';

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  GB: '🇬🇧',
  JP: '🇯🇵',
  AU: '🇦🇺',
  CA: '🇨🇦',
  CH: '🇨🇭',
  CN: '🇨🇳',
  GLOBAL: '🌐',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  XAU: '🪙'
};

export const EconomicCalendarTab: React.FC = () => {
  const {
    economicNews,
    showEconomicNews,
    economicNewsFilter,
    economicNewsDisplayMode,
    setEconomicNewsDisplayMode,
    selectedCalendarCurrency,
    toggleEconomicNews,
    setEconomicNewsFilter,
    setSelectedCalendarCurrency,
    candles,
    currentIndex,
    language
  } = useBacktestStore();

  const t = getTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');

  const currentCandle = candles[currentIndex];
  const currentTimestampSec = currentCandle
    ? currentCandle.timestamp > 1e11
      ? Math.floor(currentCandle.timestamp / 1000)
      : currentCandle.timestamp
    : 0;

  // Currencies present in current news events
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    economicNews.forEach((e) => set.add(e.currency));
    return ['ALL', ...Array.from(set).sort()];
  }, [economicNews]);

  // Filtered news events
  const filteredEvents = useMemo(() => {
    return economicNews.filter((ev) => {
      // 1. Currency filter
      if (selectedCalendarCurrency !== 'ALL') {
        if (ev.currency !== selectedCalendarCurrency && ev.currency !== 'GLOBAL') return false;
      }

      // 2. Impact filter
      if (economicNewsFilter === 'HIGH') {
        if (ev.impact !== 'HIGH') return false;
      } else if (economicNewsFilter === 'HIGH_MEDIUM') {
        if (ev.impact !== 'HIGH' && ev.impact !== 'MEDIUM') return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.currency.toLowerCase().includes(q) ||
          (ev.country && ev.country.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [economicNews, selectedCalendarCurrency, economicNewsFilter, searchQuery]);

  const pastCount = useMemo(() => {
    return filteredEvents.filter((e) => e.timestampSec <= currentTimestampSec).length;
  }, [filteredEvents, currentTimestampSec]);

  const upcomingCount = filteredEvents.length - pastCount;

  return (
    <div className="flex flex-col h-full bg-[#0a0d14]">
      {/* Control Bar */}
      <div className="px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Impact Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setEconomicNewsFilter('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                economicNewsFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.calendarFilterAllShort}
            </button>
            <button
              onClick={() => setEconomicNewsFilter('HIGH')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                economicNewsFilter === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {t.calendarFilterOnlyRed}
            </button>
            <button
              onClick={() => setEconomicNewsFilter('HIGH_MEDIUM')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                economicNewsFilter === 'HIGH_MEDIUM'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t.calendarFilterRedYellow}
            </button>
          </div>

          {/* Currency Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">{t.calendarCurrency}:</span>
            <select
              value={selectedCalendarCurrency}
              onChange={(e) => setSelectedCalendarCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
            >
              {availableCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr === 'ALL' ? t.calendarAllCurrencies : `${COUNTRY_FLAGS[curr] || ''} ${curr}`}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              placeholder={t.calendarSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded pl-6 pr-2 py-1 text-[11px] w-36 sm:w-44 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Right side stats & toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {formatText(t.calendarPassedCount, { count: pastCount })}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatText(t.calendarUpcomingCount, { count: upcomingCount })}
            </span>
          </div>

          {showEconomicNews && (
            <select
              value={economicNewsDisplayMode}
              onChange={(e) => setEconomicNewsDisplayMode(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-amber-300 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-500"
              title={t.calendarDisplayMode}
            >
              <option value="AUTO">🧠 {t.calendarModeAuto?.split('(')[0]?.trim() || 'Auto Smart'}</option>
              <option value="COMPACT">🏷️ {t.calendarModeCompact?.split('(')[0]?.trim() || 'Compact'}</option>
              <option value="CLUSTERED">📦 {t.calendarModeClustered?.split('(')[0]?.trim() || 'Clustered'}</option>
              <option value="FULL">📜 {t.calendarModeFull?.split('(')[0]?.trim() || 'Full'}</option>
            </select>
          )}

          <button
            onClick={() => toggleEconomicNews()}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition ${
              showEconomicNews
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={t.calendarShowOnChart}
          >
            {showEconomicNews ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
            <span>{showEconomicNews ? t.calendarChartToggleActive : t.calendarChartToggleInactive}</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <AlertCircle className="w-6 h-6 mb-2 text-slate-600" />
            <p>{t.calendarNoEvents}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50 sticky top-0 text-[11px]">
                <th className="py-1.5 px-3">{t.calendarTimeUTC}</th>
                <th className="py-1.5 px-2">{t.calendarCurrency}</th>
                <th className="py-1.5 px-2 text-center">{t.calendarImpact}</th>
                <th className="py-1.5 px-3">{t.calendarEvent}</th>
                <th className="py-1.5 px-2 text-right">{t.calendarActual}</th>
                <th className="py-1.5 px-2 text-right">{t.calendarForecast}</th>
                <th className="py-1.5 px-2 text-right">{t.calendarPrevious}</th>
                <th className="py-1.5 px-3 text-center">{t.calendarStatus}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const dateObj = new Date(ev.timestamp);
                const isPast = ev.timestampSec <= currentTimestampSec;
                const isNearCurrent = Math.abs(ev.timestampSec - currentTimestampSec) <= 1800; // within 30 min

                const timeStr = dateObj.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

                return (
                  <tr
                    key={ev.id}
                    className={`border-b border-slate-800/40 transition-colors ${
                      isNearCurrent
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isPast
                        ? 'hover:bg-slate-800/20 text-slate-400'
                        : 'hover:bg-slate-800/40 text-slate-200 font-medium'
                    }`}
                  >
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={isPast ? 'text-slate-400' : 'text-indigo-300 font-semibold'}>
                        {timeStr}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold">
                        <span>{COUNTRY_FLAGS[ev.currency] || '🌐'}</span>
                        <span>{ev.currency}</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      {ev.impact === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          🔴 HIGH
                        </span>
                      )}
                      {ev.impact === 'MEDIUM' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          🟡 MEDIUM
                        </span>
                      )}
                      {ev.impact === 'LOW' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
                          🔵 LOW
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={isPast ? 'text-slate-300' : 'text-slate-100 font-semibold'}>
                          {ev.title}
                        </span>
                        {ev.sentiment === 'BULLISH' && (
                          <span title={t.calendarBullishImpact}>
                            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                          </span>
                        )}
                        {ev.sentiment === 'BEARISH' && (
                          <span title={t.calendarBearishImpact}>
                            <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold">
                      {isPast ? (
                        <span
                          className={
                            ev.sentiment === 'BULLISH'
                              ? 'text-emerald-400'
                              : ev.sentiment === 'BEARISH'
                              ? 'text-rose-400'
                              : 'text-slate-200'
                          }
                        >
                          {ev.actual || '---'}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">{t.calendarNotAvailable}</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-400">
                      {ev.forecast || '---'}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-500">
                      {ev.previous || '---'}
                    </td>
                    <td className="py-1.5 px-3 text-center whitespace-nowrap">
                      {isPast ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                          ✅ {t.calendarStatusPassed}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                          ⏳ {t.calendarStatusUpcoming}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
