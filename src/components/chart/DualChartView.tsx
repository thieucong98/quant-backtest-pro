/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * DualChartView: High-Performance Multi-Chart Synchronization View
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import React, { useState, useRef, useCallback } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import {
  Columns2,
  Rows2,
  Square,
  Crosshair,
  Link,
  Link2Off,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import { Timeframe } from '../../types/market';
import { TradingViewChart } from './TradingViewChart';
import { useDualChartSync } from '../../hooks/useDualChartSync';

export type ChartLayoutMode = 'SINGLE' | 'DUAL_HORIZONTAL' | 'DUAL_VERTICAL';

export const DualChartView: React.FC = () => {
  const { language, timeframe, instrument } = useBacktestStore();
  const t = getTranslation(language);

  const [layout, setLayout] = useState<ChartLayoutMode>('SINGLE');
  const [isCrosshairSynced, setIsCrosshairSynced] = useState<boolean>(true);
  const [isTimeSynced, setIsTimeSynced] = useState<boolean>(true);
  const [secondaryTimeframe, setSecondaryTimeframe] = useState<Timeframe>(
    timeframe === 'M1' ? 'M5' : timeframe === 'M5' ? 'H1' : 'H4'
  );

  const chartARef = useRef<IChartApi | null>(null);
  const chartBRef = useRef<IChartApi | null>(null);
  const seriesARef = useRef<ISeriesApi<any> | null>(null);
  const seriesBRef = useRef<ISeriesApi<any> | null>(null);

  const [, forceUpdate] = useState({});

  const handleChartAReady = useCallback((chart: IChartApi, series: ISeriesApi<any>) => {
    chartARef.current = chart;
    seriesARef.current = series;
    forceUpdate({});
  }, []);

  const handleChartBReady = useCallback((chart: IChartApi, series: ISeriesApi<any>) => {
    chartBRef.current = chart;
    seriesBRef.current = series;
    forceUpdate({});
  }, []);

  const { resetSync } = useDualChartSync({
    chartA: chartARef.current,
    chartB: chartBRef.current,
    seriesA: seriesARef.current,
    seriesB: seriesBRef.current,
    isCrosshairSynced,
    isTimeSynced,
  });

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden select-none">
      {/* 1. Multi-Chart Floating Control Toolbar */}
      <div className="absolute top-2 right-14 z-30 flex items-center gap-1.5 bg-[#121824]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#1e293b]/70 shadow-xl text-xs">
        {/* Layout Switcher */}
        <div className="flex items-center bg-[#0b0e14]/80 p-0.5 rounded-md border border-[#1e293b]/50">
          <button
            onClick={() => setLayout('SINGLE')}
            className={`p-1.5 rounded transition-all ${
              layout === 'SINGLE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title={t.singleLayout}
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('DUAL_HORIZONTAL')}
            className={`p-1.5 rounded transition-all ${
              layout === 'DUAL_HORIZONTAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title={t.dualHorizontalLayout}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('DUAL_VERTICAL')}
            className={`p-1.5 rounded transition-all ${
              layout === 'DUAL_VERTICAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title={t.dualVerticalLayout}
          >
            <Rows2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sync Controls (Visible in Dual Mode) */}
        {layout !== 'SINGLE' && (
          <>
            <div className="h-4 w-px bg-slate-700/60 mx-0.5" />

            {/* Crosshair Lock Toggle */}
            <button
              onClick={() => setIsCrosshairSynced(!isCrosshairSynced)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                isCrosshairSynced
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title={isCrosshairSynced ? t.crosshairSyncActive : t.crosshairSyncInactive}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">
                {isCrosshairSynced ? t.syncStatusLocked : t.syncStatusUnlocked}
              </span>
            </button>

            {/* Time Sync Lock Toggle */}
            <button
              onClick={() => setIsTimeSynced(!isTimeSynced)}
              className={`p-1.5 rounded transition-colors ${
                isTimeSynced
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title={isTimeSynced ? t.timeSyncActive : t.timeSyncInactive}
            >
              {isTimeSynced ? <Link className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
            </button>

            {/* Secondary Timeframe Selector */}
            <div className="flex items-center gap-1 bg-[#0b0e14]/80 px-2 py-1 rounded border border-[#1e293b]/50 text-[11px] text-slate-300">
              <span className="text-slate-400">{t.chartBPane}:</span>
              {(['M5', 'M15', 'H1', 'H4', 'D1'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSecondaryTimeframe(tf)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    secondaryTimeframe === tf
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Reset Sync Button */}
            <button
              onClick={resetSync}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded transition-colors"
              title={t.resetView}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* 2. Chart Canvases Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {layout === 'SINGLE' && (
          <div className="w-full h-full">
            <TradingViewChart
              id="chart-primary"
              onChartReady={handleChartAReady}
            />
          </div>
        )}

        {layout === 'DUAL_HORIZONTAL' && (
          <div className="w-full h-full flex flex-row">
            {/* Chart A: Primary */}
            <div className="flex-1 h-full relative border-r border-[#1e293b]/70">
              <div className="absolute top-2 left-14 z-20 flex items-center gap-1.5 bg-[#0b0e14]/80 backdrop-blur-sm px-2 py-1 rounded border border-[#1e293b]/60 text-[11px] font-medium text-slate-300 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.chartAPane}</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-400">{instrument.symbol}</span>
                <span className="text-slate-400">[{timeframe}]</span>
              </div>
              <TradingViewChart
                id="chart-primary"
                onChartReady={handleChartAReady}
              />
            </div>

            {/* Chart B: Secondary */}
            <div className="flex-1 h-full relative">
              <div className="absolute top-2 left-3 z-20 flex items-center gap-1.5 bg-[#0b0e14]/80 backdrop-blur-sm px-2 py-1 rounded border border-[#1e293b]/60 text-[11px] font-medium text-slate-300 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{t.chartBPane}</span>
                <span className="text-slate-400">•</span>
                <span className="text-cyan-400">{instrument.symbol}</span>
                <span className="text-slate-400">[{secondaryTimeframe}]</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                  {t.htfDeveloping}
                </span>
              </div>
              <TradingViewChart
                id="chart-secondary"
                isSecondary={true}
                timeframeOverride={secondaryTimeframe}
                onChartReady={handleChartBReady}
              />
            </div>
          </div>
        )}

        {layout === 'DUAL_VERTICAL' && (
          <div className="w-full h-full flex flex-col">
            {/* Chart A: Primary (Top) */}
            <div className="flex-1 w-full relative border-b border-[#1e293b]/70">
              <div className="absolute top-2 left-14 z-20 flex items-center gap-1.5 bg-[#0b0e14]/80 backdrop-blur-sm px-2 py-1 rounded border border-[#1e293b]/60 text-[11px] font-medium text-slate-300 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.chartAPane}</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-400">{instrument.symbol}</span>
                <span className="text-slate-400">[{timeframe}]</span>
              </div>
              <TradingViewChart
                id="chart-primary"
                onChartReady={handleChartAReady}
              />
            </div>

            {/* Chart B: Secondary (Bottom) */}
            <div className="flex-1 w-full relative">
              <div className="absolute top-2 left-14 z-20 flex items-center gap-1.5 bg-[#0b0e14]/80 backdrop-blur-sm px-2 py-1 rounded border border-[#1e293b]/60 text-[11px] font-medium text-slate-300 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{t.chartBPane}</span>
                <span className="text-slate-400">•</span>
                <span className="text-cyan-400">{instrument.symbol}</span>
                <span className="text-slate-400">[{secondaryTimeframe}]</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                  {t.htfDeveloping}
                </span>
              </div>
              <TradingViewChart
                id="chart-secondary"
                isSecondary={true}
                timeframeOverride={secondaryTimeframe}
                onChartReady={handleChartBReady}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
