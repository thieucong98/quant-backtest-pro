/**
 * Quant Backtest Pro — Apex AI Copilot HUD
 * Glassmorphic streaming panel rendering live Tier 3 LLM reasoning + ActionPlan.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, X } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import type {
  ActionPlan,
  CoTStreamChunk,
  MTFSemanticVector,
} from '../../types/smc';
import { ActionPlanValidator } from '../../engine/smc/actionPlanValidator';
import { MtfPromptRenderer } from '../../engine/smc/mtfPromptRenderer';

export interface AICopilotHUDProps {
  /** Current MTF semantic vector from the worker. */
  mtf?: MTFSemanticVector | null;
  /** Last engine stats snapshot. */
  perf?: { lastBarLatencyMs: number; avgLatencyMs: number } | null;
  /** When true, hides the HUD (e.g. mobile collapsed). */
  compact?: boolean;
  /** Optional hook for the parent to subscribe to plan events. */
  onPlan?: (plan: ActionPlan) => void;
  /** Optional hook to invoke a streaming inference. */
  onAsk?: (question: string) => Promise<CoTStreamChunk[]>;
  /** Optional hook to close the HUD panel */
  onClose?: () => void;
}

type Status = 'IDLE' | 'THINKING' | 'STREAMING' | 'READY' | 'ERROR' | 'LOCKED';

export const AICopilotHUD: React.FC<AICopilotHUDProps> = ({ mtf, perf, compact = false, onPlan, onAsk, onClose }) => {
  const language = useBacktestStore(s => s.language) as 'vi' | 'en' | 'ja' | 'zh';
  const t = getTranslation(language);
  const tApex = useMemo(() => ({
    title: t.apexCopilotTitle,
    sub: t.apexCopilotSub,
    thinking: t.apexCopilotThinkingHeader,
    plan: t.apexCopilotPlanHeader,
    rationale: t.apexCopilotRationaleHeader,
    checks: t.apexCopilotChecksHeader,
    side: t.apexCopilotSide,
    entry: t.apexCopilotEntry,
    stopLoss: t.apexCopilotStopLoss,
    takeProfit: t.apexCopilotTakeProfit,
    riskReward: t.apexCopilotRiskReward,
    confidence: t.apexCopilotConfidence,
    askLabel: t.apexCopilotAskLabel,
    askPlaceholder: t.apexCopilotAskPlaceholder,
    send: t.apexCopilotSend,
    cancel: t.apexCopilotCancel,
    autoOn: t.apexCopilotAutoOn,
    autoOff: t.apexCopilotAutoOff,
    latency: t.apexCopilotPerfLatency,
    avgLatency: t.apexCopilotPerfAvgLatency,
    budget: t.apexCopilotPerfBudget,
    suppress: t.apexCopilotPerfSuppress,
    sideLong: t.apexCopilotSideLong,
    sideShort: t.apexCopilotSideShort,
    sideNoTrade: t.apexCopilotSideNoTrade,
    checkHtf: t.apexCopilotCheckHtf,
    checkPoi: t.apexCopilotCheckPoi,
    checkSweep: t.apexCopilotCheckSweep,
    checkChoCh: t.apexCopilotCheckChoCh,
    none: t.apexCopilotNone,
    ruleViolation: t.apexCopilotRuleViolationToast,
    applyEntry: t.apexCopilotApplyEntry,
    applied: t.apexCopilotAppliedToast,
    noPlan: t.apexCopilotNoPlanToast,
    telemetry: t.apexCopilotTelemetry,
    open: t.apexCopilotOpen,
    close: t.apexCopilotClose,
    expand: t.apexCopilotExpand,
    collapse: t.apexCopilotCollapse,
    askQuickEntry: t.apexCopilotAskQuickEntry,
    askSetup: t.apexCopilotAskSetup,
    askRisk: t.apexCopilotAskRisk,
    h4Label: t.apexCopilotMtfH4,
    d1Label: t.apexCopilotMtfD1,
    locationLabel: t.apexCopilotMtfLocation,
    copilotTab: t.apexCopilotCopilotTab,
    mtfTab: t.apexCopilotMtfTab,
    diagTab: t.apexCopilotDiagTab,
    status: {
      idle: t.apexCopilotStatusIdle,
      thinking: t.apexCopilotStatusThinking,
      streaming: t.apexCopilotStatusStreaming,
      ready: t.apexCopilotStatusReady,
      error: t.apexCopilotStatusError,
      locked: t.apexCopilotStatusLocked,
    },
    authRequired: t.apexCopilotAuthRequired,
    authLogin: t.apexCopilotAuthLogin,
  }), [t]);

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'copilot' | 'mtf' | 'diag'>('copilot');
  const [status, setStatus] = useState<Status>('IDLE');
  const [reasoning, setReasoning] = useState('');
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [autoMode, setAutoMode] = useState(true);
  const [question, setQuestion] = useState('');
  const [violationMsg, setViolationMsg] = useState<string | null>(null);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);
  const validatorRef = useRef<ActionPlanValidator>(new ActionPlanValidator());
  const rendererRef = useRef<MtfPromptRenderer>(new MtfPromptRenderer());

  useEffect(() => {
    if (!violationMsg) return;
    const id = setTimeout(() => setViolationMsg(null), 4000);
    return () => clearTimeout(id);
  }, [violationMsg]);

  useEffect(() => {
    if (!appliedMsg) return;
    const id = setTimeout(() => setAppliedMsg(null), 3500);
    return () => clearTimeout(id);
  }, [appliedMsg]);

  const handleAsk = useCallback(async (q?: string) => {
    const userQ = q ?? question;
    if (!userQ.trim() || !onAsk) return;
    setStatus('THINKING');
    setReasoning('');
    setPlan(null);
    setViolationMsg(null);
    try {
      const chunks = await onAsk(userQ);
      let accReason = '';
      let accPlan = '';
      for (const c of chunks) {
        if (c.type === 'reasoning') accReason += c.delta;
        else if (c.type === 'action') accPlan += c.delta;
        else if (c.type === 'done') break;
        else if (c.type === 'error') {
          setStatus('ERROR');
          return;
        }
      }
      setReasoning(accReason);
      if (accPlan.trim()) {
        try {
          const parsed = JSON.parse(accPlan.trim()) as ActionPlan;
          const result = validatorRef.current.validate(parsed, mtf ?? null);
          if (!result.ok) {
            setViolationMsg(tApex.ruleViolation);
          } else {
            setPlan(parsed);
            setStatus('READY');
            if (autoMode) {
              onPlan?.(parsed);
            }
          }
        } catch {
          setViolationMsg(tApex.noPlan);
          setStatus('ERROR');
        }
      } else {
        setStatus('READY');
      }
    } catch {
      setStatus('ERROR');
    }
  }, [onAsk, question, mtf, tApex]);

  const statusKey: Status = status;
  const statusText = tApex.status[statusKey.toLowerCase() as keyof typeof tApex.status] ?? tApex.status.idle;

  return (
    <div
      className={`apex-ai-copilot-hud apex-copilot-hud bg-[#0e1320]/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden font-mono text-xs w-full max-w-[350px] transition-all duration-200 ${
        compact ? 'max-w-[280px]' : ''
      }`}
      role="region"
      aria-label={tApex.title}
    >
      {/* HUD Header */}
      <header className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-xs text-indigo-100">{tApex.title}</span>
            <span className="text-[9px] text-slate-500 hidden sm:inline">{tApex.sub}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${
              statusKey === 'READY'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : statusKey === 'THINKING' || statusKey === 'STREAMING'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/40 animate-pulse'
                : statusKey === 'ERROR'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {statusText}
          </span>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => (onClose ? onClose() : setOpen(o => !o))}
            aria-label={onClose ? tApex.close : open ? tApex.collapse : tApex.expand}
            title={onClose ? tApex.close : open ? tApex.collapse : tApex.expand}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {open && (
        <>
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 text-[11px]">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tab === 'copilot'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              onClick={() => setTab('copilot')}
            >
              {tApex.copilotTab}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tab === 'mtf'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              onClick={() => setTab('mtf')}
            >
              {tApex.mtfTab}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tab === 'diag'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              onClick={() => setTab('diag')}
            >
              {tApex.diagTab}
            </button>
          </nav>

          {/* Body Content */}
          <section className="p-3 max-h-[460px] overflow-y-auto space-y-3 font-mono">
            {tab === 'copilot' && (
              <div className="space-y-3">
                {/* Thinking / Reasoning Box */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {tApex.thinking}
                  </span>
                  <div
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 max-h-24 overflow-y-auto"
                    aria-live="polite"
                  >
                    {reasoning || tApex.none}
                  </div>
                </div>

                {/* Plan Card */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {tApex.plan}
                  </span>
                  {plan ? (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-indigo-500/20 space-y-1.5 shadow-inner">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">{tApex.side}:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                            plan.side === 'LONG'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : plan.side === 'SHORT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {plan.side === 'LONG'
                            ? tApex.sideLong
                            : plan.side === 'SHORT'
                            ? tApex.sideShort
                            : tApex.sideNoTrade}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>{tApex.entry}:</span>
                          <span className="font-bold text-slate-200">{plan.entry.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>{tApex.stopLoss}:</span>
                          <span className="font-bold text-rose-300">{plan.stopLoss.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 col-span-2">
                          <span>{tApex.takeProfit}:</span>
                          <span className="font-bold text-teal-300">
                            {plan.takeProfit.map(tp => tp.toFixed(5)).join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>{tApex.riskReward}:</span>
                          <span className="font-bold text-indigo-300">1 : {plan.rrRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>{tApex.confidence}:</span>
                          <span className="font-bold text-emerald-300">
                            {(plan.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
                        <span className="font-semibold text-slate-300">{tApex.rationale}:</span>{' '}
                        {plan.rationale}
                      </div>
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          {tApex.checks}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {plan.institutionalChecks.includes('HTF_BIAS_ALIGNED') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              {tApex.checkHtf}
                            </span>
                          )}
                          {plan.institutionalChecks.includes('KEY_POI_TAP') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              {tApex.checkPoi}
                            </span>
                          )}
                          {plan.institutionalChecks.includes('LIQUIDITY_SWEEP_CONFIRMED') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              {tApex.checkSweep}
                            </span>
                          )}
                          {plan.institutionalChecks.includes('LTF_CHOCH_CONFIRMED') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              {tApex.checkChoCh}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="w-full py-1.5 mt-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm active:scale-98"
                        onClick={() => {
                          if (plan) onPlan?.(plan);
                          setAppliedMsg(tApex.applied);
                        }}
                      >
                        {tApex.applyEntry}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-500 italic text-[11px]">
                      {tApex.none}
                    </div>
                  )}
                </div>

                {/* Input Prompt Section */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" htmlFor="apex-ask-input">
                    {tApex.askLabel}
                  </label>
                  <textarea
                    id="apex-ask-input"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    rows={2}
                    placeholder={tApex.askPlaceholder}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-md bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-[10px] transition-colors"
                      onClick={() => handleAsk(tApex.askQuickEntry)}
                    >
                      {tApex.askQuickEntry}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-md bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-[10px] transition-colors"
                      onClick={() => handleAsk(tApex.askSetup)}
                    >
                      {tApex.askSetup}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-md bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-[10px] transition-colors"
                      onClick={() => handleAsk(tApex.askRisk)}
                    >
                      {tApex.askRisk}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs active:scale-95"
                        onClick={() => handleAsk()}
                        disabled={!question.trim() || status === 'THINKING' || status === 'STREAMING'}
                      >
                        {tApex.send}
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors active:scale-95"
                        onClick={() => {
                          setStatus('IDLE');
                          setReasoning('');
                          setPlan(null);
                        }}
                      >
                        {tApex.cancel}
                      </button>
                    </div>
                    <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoMode}
                        onChange={e => setAutoMode(e.target.checked)}
                        className="accent-indigo-500 rounded"
                      />
                      <span>{autoMode ? tApex.autoOn : tApex.autoOff}</span>
                    </label>
                  </div>
                </div>

                {/* Toasts */}
                {violationMsg && (
                  <div className="p-2 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                    {violationMsg}
                  </div>
                )}
                {appliedMsg && (
                  <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                    {appliedMsg}
                  </div>
                )}
              </div>
            )}

            {tab === 'mtf' && (
              <div className="space-y-2 text-xs">
                {mtf ? (
                  <>
                    <pre className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 whitespace-pre-wrap font-mono max-h-36 overflow-y-auto">
                      {rendererRef.current.render(mtf)}
                    </pre>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">{tApex.h4Label}:</span>
                        <span className="font-bold text-slate-200">{mtf.bias.h4}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">{tApex.d1Label}:</span>
                        <span className="font-bold text-slate-200">{mtf.bias.d1}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">{tApex.locationLabel}:</span>
                        <span className="font-bold text-amber-300">{mtf.location}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">{tApex.side}:</span>
                        <span className="font-bold text-indigo-300">{mtf.activeOB.direction}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-500 italic text-[11px]">
                    {tApex.none}
                  </div>
                )}
              </div>
            )}

            {tab === 'diag' && (
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {tApex.telemetry}
                </span>
                <div className="space-y-1.5 p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>{tApex.latency}:</span>
                    <span className="font-bold text-emerald-400">
                      {perf ? `${perf.lastBarLatencyMs.toFixed(2)} ms` : tApex.none}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tApex.avgLatency}:</span>
                    <span className="font-bold text-emerald-400">
                      {perf ? `${perf.avgLatencyMs.toFixed(2)} ms` : tApex.none}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tApex.budget}:</span>
                    <span className="font-mono text-slate-300">≤ 5.00 ms</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AICopilotHUD;
