import React from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, TrendingDown, Clock, Activity, Zap, Compass } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import { TradeAutopsyReport } from '../../engine/aiTradeAutopsy';

interface AITradeAutopsyModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: TradeAutopsyReport | null;
}

export const AITradeAutopsyModal: React.FC<AITradeAutopsyModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  const language = useBacktestStore(s => s.language);
  const t = getTranslation(language);

  if (!isOpen || !report) return null;

  const { disciplineScore, rootCause, rootCauseTitle, marketContext, prescription, telemetry } = report;

  const scoreColor =
    disciplineScore >= 75
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : disciplineScore >= 50
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-rose-400 border-rose-500/40 bg-rose-950/40';

  const rootCauseBadgeColor =
    rootCause === 'PROBABILISTIC_LOSS'
      ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
      : rootCause === 'NEWS_COLLISION'
      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
      : 'bg-rose-950/80 text-rose-300 border-rose-500/40';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autopsy-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#0e1320] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="autopsy-modal-title" className="text-base font-bold text-slate-100 flex items-center gap-2">
                {t.autopsyTitle}
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {telemetry.symbol} • {telemetry.side}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">{t.autopsySubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={onClose}
            aria-label={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
          {/* Top Score & Root Cause Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Discipline Score */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${scoreColor}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t.autopsyDisciplineScore}
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight">
                {disciplineScore}<span className="text-sm font-normal text-slate-500">/100</span>
              </div>
              <span className="text-[10px] mt-1 font-semibold">
                {disciplineScore >= 75 ? t.autopsyPerfectExecution : disciplineScore >= 50 ? t.propFirmRatingGood : t.propFirmRatingRisky}
              </span>
            </div>

            {/* Telemetry Summary */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 md:col-span-2 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">Entry / Exit</span>
                  <span className="font-bold text-slate-200">{telemetry.entryPrice.toFixed(2)} → {telemetry.exitPrice.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">PnL / Loss</span>
                  <span className="font-bold text-rose-400">${telemetry.realizedPnL.toFixed(1)} (-{telemetry.lossPips}p)</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">Holding Time</span>
                  <span className="font-bold text-slate-200">{telemetry.durationMinutes}m</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block">HTF / Loc</span>
                  <span className="font-bold text-indigo-300">{telemetry.htfBias} ({telemetry.dealingRangeLoc})</span>
                </div>
              </div>

              {/* Root Cause Banner */}
              <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${rootCauseBadgeColor}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">{t.autopsyRootCause}</span>
                  <span className="font-bold text-xs">{rootCauseTitle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Context Box */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              {t.autopsyMarketContext}
            </span>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-xs leading-relaxed">
              {marketContext}
            </div>
          </div>

          {/* Quantitative Prescription */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {t.autopsyPrescription}
            </span>
            <div className="space-y-2">
              {prescription.map((rx, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-2.5 text-indigo-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs font-sans">{rx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm active:scale-95"
            onClick={onClose}
          >
            {t.saveChanges}
          </button>
        </footer>
      </div>
    </div>
  );
};
