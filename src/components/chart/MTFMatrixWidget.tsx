/**
 * Quant Backtest Pro — Multi-Timeframe Matrix Widget
 * Compact grid view of H4/D1 bias, OB/FVG state, sweeps, CHoCH and session.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import React, { useMemo } from 'react';
import { Layers, X } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import type { MTFSemanticVector } from '../../types/smc';

export interface MTFMatrixWidgetProps {
  mtf?: MTFSemanticVector | null;
  compact?: boolean;
  onClose?: () => void;
}

export const MTFMatrixWidget: React.FC<MTFMatrixWidgetProps> = ({ mtf, compact = false, onClose }) => {
  const language = useBacktestStore(s => s.language) as 'vi' | 'en' | 'ja' | 'zh';
  const t = getTranslation(language);
  const labels = useMemo(() => ({
    title: t.apexCopilotMtfTitle,
    h4: t.apexCopilotMtfH4,
    d1: t.apexCopilotMtfD1,
    location: t.apexCopilotMtfLocation,
    ob: t.apexCopilotMtfOb,
    fvg: t.apexCopilotMtfFvg,
    sweep: t.apexCopilotMtfSweep,
    choch: t.apexCopilotMtfChoCh,
    volatility: t.apexCopilotMtfVolatility,
    session: t.apexCopilotMtfSession,
    premium: t.apexCopilotLocationPremium,
    discount: t.apexCopilotLocationDiscount,
    equilibrium: t.apexCopilotLocationEquilibrium,
    bull: t.apexCopilotBiasBullish,
    bear: t.apexCopilotBiasBearish,
    neutral: t.apexCopilotBiasNeutral,
    asia: t.apexCopilotSessionAsia,
    london: t.apexCopilotSessionLondon,
    ny: t.apexCopilotSessionNy,
    overlap: t.apexCopilotSessionOverlap,
    volLow: t.apexCopilotVolLow,
    volNormal: t.apexCopilotVolNormal,
    volHigh: t.apexCopilotVolHigh,
    volExtreme: t.apexCopilotVolExtreme,
    none: t.apexCopilotNone,
    close: t.apexCopilotClose,
  }), [t]);

  if (!mtf) {
    return (
      <div className={`mtf-matrix-widget bg-[#0e1320]/95 backdrop-blur-xl border border-sky-500/30 rounded-xl shadow-2xl p-3 text-xs font-mono w-full ${compact ? 'max-w-[280px]' : 'max-w-[340px]'}`}>
        <header className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-xs text-slate-100">{labels.title}</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={labels.close}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </header>
        <div className="p-3 text-center text-slate-500 italic text-[11px]">{labels.none}</div>
      </div>
    );
  }

  const locLabel = mtf.location === 'PREMIUM' ? labels.premium : mtf.location === 'DISCOUNT' ? labels.discount : labels.equilibrium;
  const biasH4 = mtf.bias.h4 === 'BULLISH' ? labels.bull : mtf.bias.h4 === 'BEARISH' ? labels.bear : labels.neutral;
  const biasD1 = mtf.bias.d1 === 'BULLISH' ? labels.bull : mtf.bias.d1 === 'BEARISH' ? labels.bear : labels.neutral;
  const sessionLabel = mtf.volatility.session === 'ASIA' ? labels.asia : mtf.volatility.session === 'LONDON' ? labels.london : mtf.volatility.session === 'NY' ? labels.ny : labels.overlap;
  const volLabel = mtf.volatility.atrBucket === 'LOW' ? labels.volLow : mtf.volatility.atrBucket === 'NORMAL' ? labels.volNormal : mtf.volatility.atrBucket === 'HIGH' ? labels.volHigh : labels.volExtreme;

  return (
    <div className={`mtf-matrix-widget bg-[#0e1320]/95 backdrop-blur-xl border border-sky-500/30 rounded-xl shadow-2xl p-3 text-xs font-mono w-full ${compact ? 'max-w-[280px]' : 'max-w-[340px]'}`}>
      <header className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-xs text-slate-100">{labels.title}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={labels.close}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </header>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.h4}</span>
          <span className={`text-[11px] font-extrabold ${mtf.bias.h4 === 'BULLISH' ? 'text-emerald-400' : mtf.bias.h4 === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'}`}>
            {biasH4}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.d1}</span>
          <span className={`text-[11px] font-extrabold ${mtf.bias.d1 === 'BULLISH' ? 'text-emerald-400' : mtf.bias.d1 === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'}`}>
            {biasD1}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.location}</span>
          <span className="text-[11px] font-bold text-amber-300">{locLabel}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.ob}</span>
          <span className="text-[10px] font-mono text-slate-200 truncate">{mtf.activeOB.direction} · {mtf.activeOB.state} · {mtf.activeOB.fillRatioBucket}%</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.fvg}</span>
          <span className="text-[10px] font-mono text-slate-200 truncate">{mtf.activeFVG.direction} · {mtf.activeFVG.state} · {mtf.activeFVG.fillRatioBucket}%</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.sweep}</span>
          <span className="text-[10px] font-mono text-slate-200 truncate">{mtf.recentSweep.kind} · {mtf.recentSweep.barsAgo}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.choch}</span>
          <span className="text-[10px] font-mono text-slate-200 truncate">{mtf.recentCHoCH.direction} · {mtf.recentCHoCH.barsAgo}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.volatility}</span>
          <span className="text-[11px] font-mono text-slate-200">{volLabel}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col gap-0.5 col-span-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labels.session}</span>
          <span className="text-[11px] font-mono text-slate-200">{sessionLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default MTFMatrixWidget;
