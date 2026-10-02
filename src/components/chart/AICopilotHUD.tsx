/**
 * Quant Backtest Pro — Apex AI Copilot HUD
 * Glassmorphic streaming panel rendering live Tier 3 LLM reasoning + ActionPlan.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
}

type Status = 'IDLE' | 'THINKING' | 'STREAMING' | 'READY' | 'ERROR' | 'LOCKED';

export const AICopilotHUD: React.FC<AICopilotHUDProps> = ({ mtf, perf, compact = false, onPlan, onAsk }) => {
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
            onPlan?.(parsed);
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
      className={`apex-ai-copilot-hud ${open ? 'apex-open' : 'apex-collapsed'} ${compact ? 'apex-compact' : ''}`}
      role="region"
      aria-label={tApex.title}
    >
      <header className="apex-hud-header">
        <div className="apex-hud-title-wrap">
          <strong className="apex-hud-title">{tApex.title}</strong>
          <span className={`apex-hud-status apex-status-${statusKey.toLowerCase()}`}>{statusText}</span>
        </div>
        <div className="apex-hud-actions">
          <button
            type="button"
            className="apex-hud-btn"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? tApex.collapse : tApex.expand}
          >
            {open ? tApex.collapse : tApex.expand}
          </button>
        </div>
      </header>
      {open && (
        <>
          <nav className="apex-hud-tabs">
            <button type="button" className={`apex-tab ${tab === 'copilot' ? 'apex-tab-active' : ''}`} onClick={() => setTab('copilot')}>{tApex.copilotTab}</button>
            <button type="button" className={`apex-tab ${tab === 'mtf' ? 'apex-tab-active' : ''}`} onClick={() => setTab('mtf')}>{tApex.mtfTab}</button>
            <button type="button" className={`apex-tab ${tab === 'diag' ? 'apex-tab-active' : ''}`} onClick={() => setTab('diag')}>{tApex.diagTab}</button>
          </nav>
          <section className="apex-hud-body">
            {tab === 'copilot' && (
              <div className="apex-copilot-pane">
                <div className="apex-section">
                  <header className="apex-section-title">{tApex.thinking}</header>
                  <div className="apex-reasoning" aria-live="polite">{reasoning || tApex.none}</div>
                </div>
                <div className="apex-section">
                  <header className="apex-section-title">{tApex.plan}</header>
                  {plan ? (
                    <div className="apex-plan">
                      <div className="apex-plan-row">
                        <span>{tApex.side}:</span>
                        <strong className={`apex-side apex-side-${plan.side.toLowerCase()}`}>
                          {plan.side === 'LONG' ? tApex.sideLong : plan.side === 'SHORT' ? tApex.sideShort : tApex.sideNoTrade}
                        </strong>
                      </div>
                      <div className="apex-plan-row"><span>{tApex.entry}:</span><strong>{plan.entry.toFixed(5)}</strong></div>
                      <div className="apex-plan-row"><span>{tApex.stopLoss}:</span><strong>{plan.stopLoss.toFixed(5)}</strong></div>
                      <div className="apex-plan-row"><span>{tApex.takeProfit}:</span><strong>{plan.takeProfit.map(tp => tp.toFixed(5)).join(', ')}</strong></div>
                      <div className="apex-plan-row"><span>{tApex.riskReward}:</span><strong>1 : {plan.rrRatio.toFixed(2)}</strong></div>
                      <div className="apex-plan-row"><span>{tApex.confidence}:</span><strong>{(plan.confidence * 100).toFixed(0)}%</strong></div>
                      <div className="apex-plan-rationale"><span>{tApex.rationale}:</span><p>{plan.rationale}</p></div>
                      <div className="apex-plan-checks">
                        <header>{tApex.checks}</header>
                        <ul>
                          {plan.institutionalChecks.includes('HTF_BIAS_ALIGNED') && <li>{tApex.checkHtf}</li>}
                          {plan.institutionalChecks.includes('KEY_POI_TAP') && <li>{tApex.checkPoi}</li>}
                          {plan.institutionalChecks.includes('LIQUIDITY_SWEEP_CONFIRMED') && <li>{tApex.checkSweep}</li>}
                          {plan.institutionalChecks.includes('LTF_CHOCH_CONFIRMED') && <li>{tApex.checkChoCh}</li>}
                        </ul>
                      </div>
                      <button type="button" className="apex-apply-btn" onClick={() => setAppliedMsg(tApex.applied)}>{tApex.applyEntry}</button>
                    </div>
                  ) : (
                    <div className="apex-plan-empty">{tApex.none}</div>
                  )}
                </div>
                <div className="apex-input-row">
                  <label className="apex-input-label" htmlFor="apex-ask-input">{tApex.askLabel}</label>
                  <textarea
                    id="apex-ask-input"
                    className="apex-input"
                    rows={2}
                    placeholder={tApex.askPlaceholder}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                  />
                  <div className="apex-quick-prompts">
                    <button type="button" className="apex-quick" onClick={() => handleAsk(tApex.askQuickEntry)}>{tApex.askQuickEntry}</button>
                    <button type="button" className="apex-quick" onClick={() => handleAsk(tApex.askSetup)}>{tApex.askSetup}</button>
                    <button type="button" className="apex-quick" onClick={() => handleAsk(tApex.askRisk)}>{tApex.askRisk}</button>
                  </div>
                  <div className="apex-actions-row">
                    <button type="button" className="apex-send-btn" onClick={() => handleAsk()} disabled={!question.trim() || status === 'THINKING' || status === 'STREAMING'}>{tApex.send}</button>
                    <button type="button" className="apex-cancel-btn" onClick={() => { setStatus('IDLE'); setReasoning(''); setPlan(null); }}>{tApex.cancel}</button>
                    <label className="apex-auto-toggle">
                      <input type="checkbox" checked={autoMode} onChange={e => setAutoMode(e.target.checked)} />
                      <span>{autoMode ? tApex.autoOn : tApex.autoOff}</span>
                    </label>
                  </div>
                </div>
                {violationMsg && <div className="apex-toast apex-toast-error">{violationMsg}</div>}
                {appliedMsg && <div className="apex-toast apex-toast-success">{appliedMsg}</div>}
              </div>
            )}
            {tab === 'mtf' && (
              <div className="apex-mtf-pane">
                {mtf ? (
                  <>
                    <pre className="apex-mtf-prompt">{rendererRef.current.render(mtf)}</pre>
                    <ul className="apex-mtf-list">
                      <li><strong>{tApex.h4Label}:</strong> {mtf.bias.h4}</li>
                      <li><strong>{tApex.d1Label}:</strong> {mtf.bias.d1}</li>
                      <li><strong>{tApex.locationLabel}:</strong> {mtf.location}</li>
                      <li><strong>{tApex.side}:</strong> {mtf.activeOB.direction} ({mtf.activeOB.state})</li>
                      <li><strong>{tApex.checks}:</strong> {mtf.recentSweep.kind} · {mtf.recentCHoCH.direction}</li>
                    </ul>
                  </>
                ) : (
                  <div className="apex-plan-empty">{tApex.none}</div>
                )}
              </div>
            )}
            {tab === 'diag' && (
              <div className="apex-diag-pane">
                <h4>{tApex.telemetry}</h4>
                <ul>
                  <li>{tApex.latency}: {perf ? `${perf.lastBarLatencyMs.toFixed(2)} ms` : tApex.none}</li>
                  <li>{tApex.avgLatency}: {perf ? `${perf.avgLatencyMs.toFixed(2)} ms` : tApex.none}</li>
                  <li>{tApex.budget}: ≤ 5.00 ms</li>
                </ul>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AICopilotHUD;
