/**
 * Quant Backtest Pro — Apex AI Copilot HUD
 * Glassmorphic draggable floating streaming panel rendering live Tier 3 LLM reasoning + ActionPlan.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BrainCircuit,
  X,
  GripHorizontal,
  Minus,
  Maximize2,
  AlertTriangle,
  Send,
  Sparkles,
  CheckCircle2,
  Shield,
  Layers,
  Activity,
  Compass,
  HelpCircle,
  Target,
  Settings2,
  RefreshCw,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import type {
  ActionPlan,
  CoTStreamChunk,
  MTFSemanticVector,
} from '../../types/smc';
import { ActionPlanValidator } from '../../engine/smc/actionPlanValidator';
import { MtfPromptRenderer } from '../../engine/smc/mtfPromptRenderer';
import {
  getActiveCopilotProvider,
  getStoredLlmConfig,
  saveStoredLlmConfig,
  pingLlmGateway
} from '../../api/copilot';
import { AI_PROVIDER_MODELS, type LLMConfig, type AIProvider } from '../../engine/aiService';

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
  onAsk?: (
    question: string,
    onChunk?: (chunk: CoTStreamChunk) => void
  ) => Promise<CoTStreamChunk[]>;
  /** Optional hook to close the HUD panel */
  onClose?: () => void;
}

type Status = 'IDLE' | 'THINKING' | 'STREAMING' | 'READY' | 'ERROR' | 'LOCKED';

const HUD_POSITION_STORAGE_KEY = 'quant_apex_copilot_position_v2';

export const AICopilotHUD: React.FC<AICopilotHUDProps> = ({
  mtf,
  perf,
  compact = false,
  onPlan,
  onAsk,
  onClose
}) => {
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
    dragHandle: t.apexCopilotDragHandle,
    dockLeft: t.apexCopilotDockLeft,
    dockRight: t.apexCopilotDockRight,
    autoWarning: t.apexCopilotAutoWarning,
    interactivePromptHelp: t.apexCopilotInteractivePromptHelp,
    engineBadgeSMC: t.apexCopilotEngineBadgeSMC,
    engineBadgeLLM: t.apexCopilotEngineBadgeLLM,
    engineTooltip: t.apexCopilotEngineTooltip,
    helpTitle: t.apexCopilotHelpTitle,
    helpTipRR: t.apexCopilotHelpTipRR,
    helpTipSLTP: t.apexCopilotHelpTipSLTP,
    helpTipBias: t.apexCopilotHelpTipBias,
    askQuickRR3: t.apexCopilotAskQuickRR3,
    askQuickRR2: t.apexCopilotAskQuickRR2,
    askQuickRR4: t.apexCopilotAskQuickRR4,
    calibratedBadge: t.apexCopilotCalibratedBadge,
    promptRR3Template: t.apexCopilotPromptRR3Template,
    promptRR2Template: t.apexCopilotPromptRR2Template,
    promptRR4Template: t.apexCopilotPromptRR4Template,
    settingsBtn: t.apexCopilotSettingsBtn,
    settingsTitle: t.apexCopilotSettingsTitle,
    settingsProviderLabel: t.apexCopilotSettingsProviderLabel,
    settingsBaseUrl: t.apexCopilotSettingsBaseUrl,
    settingsModel: t.apexCopilotSettingsModel,
    settingsApiKey: t.apexCopilotSettingsApiKey,
    settingsTestBtn: t.apexCopilotSettingsTestBtn,
    settingsSaveBtn: t.apexCopilotSettingsSaveBtn,
    settingsTesting: t.apexCopilotSettingsTesting,
    settingsSuccess: t.apexCopilotSettingsSuccess,
    settingsError: t.apexCopilotSettingsError,
    settingsSaved: t.apexCopilotSettingsSaved,
    readyTitle: t.apexCopilotReadyTitle,
    readyDesc: t.apexCopilotReadyDesc,
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

  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeProvider, setActiveProvider] = useState(() => getActiveCopilotProvider());
  const [gatewayConfig, setGatewayConfig] = useState<LLMConfig>(() => {
    return getStoredLlmConfig() || {
      provider: 'custom',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: '',
      temperature: 0.2
    };
  });
  const [pingStatus, setPingStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [pingMsg, setPingMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const handleConfigChange = () => {
      setActiveProvider(getActiveCopilotProvider());
      const cfg = getStoredLlmConfig();
      if (cfg) setGatewayConfig(cfg);
    };
    window.addEventListener('quant_llm_config_changed', handleConfigChange);
    return () => window.removeEventListener('quant_llm_config_changed', handleConfigChange);
  }, []);

  const handlePing = async () => {
    setPingStatus('TESTING');
    setPingMsg(tApex.settingsTesting);
    try {
      const res = await pingLlmGateway(gatewayConfig);
      if (res.success) {
        setPingStatus('SUCCESS');
        setPingMsg(`${tApex.settingsSuccess} (${res.latencyMs}ms)`);
      } else {
        setPingStatus('ERROR');
        setPingMsg(res.message || tApex.settingsError);
      }
    } catch (err: any) {
      setPingStatus('ERROR');
      setPingMsg(err?.message || tApex.settingsError);
    }
  };

  const handleSaveGateway = () => {
    saveStoredLlmConfig(gatewayConfig);
    setActiveProvider(getActiveCopilotProvider());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Position & Dragging State
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(HUD_POSITION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      }
    } catch {}
    // Default position: Top-Left of the chart (x: 24, y: 52), leaving the right side & price scale 100% visible
    return { x: 24, y: 52 };
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const [tab, setTab] = useState<'copilot' | 'mtf' | 'diag'>('copilot');
  const [status, setStatus] = useState<Status>('IDLE');
  const [reasoning, setReasoning] = useState('');
  const [plan, setPlan] = useState<ActionPlan | null>(null);

  // CRITICAL FIX: Default autoMode is strictly FALSE to prevent unprompted automatic orders
  const [autoMode, setAutoMode] = useState<boolean>(false);

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

  // Dragging handlers
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      const maxX = Math.max(10, window.innerWidth - (isMinimized ? 260 : 360));
      const maxY = Math.max(10, window.innerHeight - 80);

      const nextX = Math.min(Math.max(10, dragStartRef.current.startX + dx), maxX);
      const nextY = Math.min(Math.max(10, dragStartRef.current.startY + dy), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        localStorage.setItem(HUD_POSITION_STORAGE_KEY, JSON.stringify(position));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMinimized, position]);

  const snapDockLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPos = { x: 20, y: 52 };
    setPosition(newPos);
    try {
      localStorage.setItem(HUD_POSITION_STORAGE_KEY, JSON.stringify(newPos));
    } catch {}
  };

  const snapDockRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPos = { x: Math.max(20, window.innerWidth - 380), y: 52 };
    setPosition(newPos);
    try {
      localStorage.setItem(HUD_POSITION_STORAGE_KEY, JSON.stringify(newPos));
    } catch {}
  };

  const handleAsk = useCallback(async (q?: string) => {
    const userQ = q ?? question;
    if (!userQ.trim() || !onAsk) return;
    setStatus('THINKING');
    setReasoning('');
    setPlan(null);
    setViolationMsg(null);
    setAppliedMsg(null);

    let accReason = '';
    let accPlan = '';

    try {
      const chunks = await onAsk(userQ, (chunk) => {
        if (chunk.type === 'reasoning') {
          accReason += chunk.delta;
          setReasoning(accReason);
          setStatus('STREAMING');
        } else if (chunk.type === 'action') {
          accPlan += chunk.delta;
        } else if (chunk.type === 'error') {
          setStatus('ERROR');
        }
      });

      if (chunks && chunks.length > 0) {
        for (const c of chunks) {
          if (c.type === 'reasoning' && !accReason.includes(c.delta)) {
            accReason += c.delta;
          } else if (c.type === 'action' && !accPlan.includes(c.delta)) {
            accPlan += c.delta;
          } else if (c.type === 'error') {
            setStatus('ERROR');
            return;
          }
        }
      }

      setReasoning(accReason);
      if (accPlan.trim()) {
        try {
          const parsed = JSON.parse(accPlan.trim()) as ActionPlan;
          const result = validatorRef.current.validate(parsed, mtf ?? null);
          if (!result.ok) {
            setViolationMsg(tApex.ruleViolation);
            setStatus('READY');
          } else {
            setPlan(parsed);
            setStatus('READY');
            // Only auto-dispatch if autoMode was explicitly turned on by the user
            if (autoMode) {
              onPlan?.(parsed);
              setAppliedMsg(tApex.applied);
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
  }, [onAsk, question, mtf, tApex, autoMode, onPlan]);

  const handleQuickAction = (q: string) => {
    setQuestion(q);
    handleAsk(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const statusKey: Status = status;
  const statusText = tApex.status[statusKey.toLowerCase() as keyof typeof tApex.status] ?? tApex.status.idle;

  if (compact) return null;

  // MINIMIZED CAPSULE MODE
  if (isMinimized) {
    return (
      <div
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: 'none'
        }}
        className="fixed top-0 left-0 z-40 select-none bg-[#0c101d]/95 backdrop-blur-xl border border-indigo-500/40 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2.5 font-mono text-xs cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        <div
          onMouseDown={handleDragStart}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-500 hover:text-slate-300"
          title={tApex.dragHandle}
        >
          <GripHorizontal className="w-3.5 h-3.5" />
        </div>

        <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="font-bold text-slate-100 text-xs tracking-tight">Apex Copilot</span>

        {plan && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              plan.side === 'LONG'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : plan.side === 'SHORT'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {plan.side} (1:{plan.rrRatio.toFixed(1)})
          </span>
        )}

        <div className="flex items-center gap-1 ml-1 border-l border-slate-700/60 pl-1.5">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={tApex.expand}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-colors"
            title={tApex.close}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // FULL DRAGGABLE HUD MODE
  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none'
      }}
      className={`fixed top-0 left-0 z-40 apex-ai-copilot-hud bg-[#0b0f1a]/95 backdrop-blur-xl border border-indigo-500/35 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs w-full max-w-[380px] sm:max-w-[400px] animate-in fade-in duration-150 select-none ${
        isDragging ? 'shadow-indigo-500/20 ring-1 ring-indigo-500/50' : ''
      }`}
      role="region"
      aria-label={tApex.title}
    >
      {/* HUD Header with Drag Handle & Window Controls */}
      <header
        onMouseDown={handleDragStart}
        className="px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800/90 flex items-center justify-between cursor-grab active:cursor-grabbing transition-colors hover:bg-slate-900 gap-2 shrink-0 select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="text-slate-500 hover:text-slate-300 p-0.5 shrink-0" title={tApex.dragHandle}>
            <GripHorizontal className="w-4 h-4" />
          </div>
          <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-xs text-indigo-100 flex items-center gap-1.5 min-w-0">
              <span className="truncate">{tApex.title}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400 shrink-0" />
            </span>
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/30 truncate max-w-[140px] shrink-0"
                title={tApex.engineTooltip}
              >
                {activeProvider.isLocalAlgorithmic
                  ? tApex.engineBadgeSMC
                  : tApex.engineBadgeLLM.replace('{model}', activeProvider.model || activeProvider.provider)}
              </span>
            </div>
          </div>
        </div>

        {/* WINDOW CONTROLS - FIXED, UNSHRINKABLE, ALWAYS VISIBLE */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Status Badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase shrink-0 ${
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

          {/* Quick Gateway Settings Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowSettings(!showSettings);
              setShowPromptGuide(false);
            }}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              showSettings
                ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={tApex.settingsBtn}
          >
            <Settings2 className="w-3.5 h-3.5 text-purple-400" />
          </button>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title={tApex.collapse}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close Button - Prominent, Red Hover, NEVER CLIPPED */}
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/80 border border-transparent hover:border-rose-500/30 transition-colors shrink-0"
            onClick={() => onClose?.()}
            title={tApex.close}
            aria-label={tApex.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* QUICK GATEWAY & MODEL SETTINGS PANEL */}
      {showSettings && (
        <div className="p-3 bg-[#0a0e1a] border-b border-indigo-500/40 space-y-2.5 text-[10px] animate-in fade-in select-text">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              <Settings2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{tApex.settingsTitle}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title={tApex.close}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block font-medium text-[10px]">{tApex.settingsProviderLabel}</label>
            <div className="relative">
              <select
                value={gatewayConfig.provider}
                onChange={(e) => {
                  const newProv = e.target.value as AIProvider;
                  const def = AI_PROVIDER_MODELS[newProv];
                  setGatewayConfig({
                    ...gatewayConfig,
                    provider: newProv,
                    baseUrl: def?.defaultBaseUrl ?? gatewayConfig.baseUrl,
                    model: def?.models?.[0] ?? gatewayConfig.model
                  });
                  setPingStatus('IDLE');
                  setPingMsg('');
                }}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 text-[11px] focus:outline-hidden focus:border-purple-500 font-sans truncate cursor-pointer"
              >
                {(Object.keys(AI_PROVIDER_MODELS) as AIProvider[]).map((prov) => (
                  <option key={prov} value={prov}>
                    {AI_PROVIDER_MODELS[prov]?.name || prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {gatewayConfig.provider !== 'builtin' && (
            <>
              <div className="space-y-1">
                <label className="text-slate-400 block font-medium text-[10px]">{tApex.settingsBaseUrl}</label>
                <input
                  type="text"
                  value={gatewayConfig.baseUrl || ''}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium text-[10px]">{tApex.settingsModel}</label>
                  <input
                    type="text"
                    value={gatewayConfig.model || ''}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, model: e.target.value })}
                    placeholder="gpt-4o"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium text-[10px]">{tApex.settingsApiKey}</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={gatewayConfig.apiKey || ''}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 pr-7 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-200 p-0.5 rounded"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {gatewayConfig.provider !== 'builtin' && (
                <button
                  type="button"
                  onClick={handlePing}
                  disabled={pingStatus === 'TESTING'}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-slate-200 text-[10px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 text-sky-400 ${pingStatus === 'TESTING' ? 'animate-spin' : ''}`} />
                  <span>{pingStatus === 'TESTING' ? tApex.settingsTesting : tApex.settingsTestBtn}</span>
                </button>
              )}
              {pingMsg && (
                <span className={`text-[10px] font-mono truncate ${
                  pingStatus === 'SUCCESS' ? 'text-emerald-400 font-bold' : pingStatus === 'ERROR' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {pingMsg}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveGateway}
              className={`px-3 py-1 rounded-lg text-white text-[10px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                savedNotice
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
              }`}
            >
              {savedNotice ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                  <span>{tApex.settingsSaved}</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 text-purple-200" />
                  <span>{tApex.settingsSaveBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 text-[11px]">
        <button
          type="button"
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
            tab === 'copilot'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => setTab('copilot')}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{tApex.copilotTab}</span>
        </button>
        <button
          type="button"
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
            tab === 'mtf'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => setTab('mtf')}
        >
          <Layers className="w-3 h-3 text-sky-400" />
          <span>{tApex.mtfTab}</span>
        </button>
        <button
          type="button"
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
            tab === 'diag'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => setTab('diag')}
        >
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{tApex.diagTab}</span>
        </button>
      </nav>

      {/* Body Content */}
      <section className="p-3 max-h-[480px] overflow-y-auto space-y-3 font-mono">
        {tab === 'copilot' && (
          <div className="space-y-3">
            {!reasoning && !plan ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1.5 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {tApex.readyTitle}
                </div>
                <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-relaxed font-sans">
                  {tApex.readyDesc}
                </p>
              </div>
            ) : (
              <>
                {/* Thinking / Reasoning Box */}
                {reasoning && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {tApex.thinking}
                    </span>
                    <div
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 text-[11px] text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed"
                      aria-live="polite"
                    >
                      {reasoning}
                    </div>
                  </div>
                )}

                {/* Action Plan Card */}
                {plan && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {tApex.plan}
                    </span>
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2 shadow-inner">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">{tApex.side}:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                            plan.side === 'LONG'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                              : plan.side === 'SHORT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
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

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                          <span className="text-slate-400">{tApex.entry}:</span>
                          <span className="font-bold text-slate-200">{plan.entry.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                          <span className="text-slate-400">{tApex.stopLoss}:</span>
                          <span className="font-bold text-rose-400">{plan.stopLoss.toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60 col-span-2">
                          <span className="text-slate-400">{tApex.takeProfit}:</span>
                          <span className="font-bold text-teal-400">
                            {plan.takeProfit.map(tp => tp.toFixed(5)).join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                          <span className="text-slate-400">{tApex.riskReward}:</span>
                          <span className={`font-bold ${plan.rrRatio >= 3.0 ? 'text-emerald-400 font-black' : 'text-indigo-300'}`}>
                            1 : {plan.rrRatio.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                          <span className="text-slate-400">{tApex.confidence}:</span>
                          <span className="font-bold text-emerald-400">
                            {(plan.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 leading-relaxed">
                        <span className="font-semibold text-slate-300">{tApex.rationale}:</span>{' '}
                        {plan.rationale}
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          {tApex.checks}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {plan.institutionalChecks.includes('HTF_BIAS_ALIGNED') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{tApex.checkHtf}</span>
                            </span>
                          )}
                          {plan.institutionalChecks.includes('KEY_POI_TAP') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{tApex.checkPoi}</span>
                            </span>
                          )}
                          {plan.institutionalChecks.includes('LIQUIDITY_SWEEP_CONFIRMED') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{tApex.checkSweep}</span>
                            </span>
                          )}
                          {plan.institutionalChecks.includes('LTF_CHOCH_CONFIRMED') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{tApex.checkChoCh}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PROMINENT MANUAL APPLY PLAN BUTTON */}
                      <button
                        type="button"
                        className="w-full py-2 mt-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                        onClick={() => {
                          if (plan) onPlan?.(plan);
                          setAppliedMsg(tApex.applied);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{tApex.applyEntry}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Input Prompt Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" htmlFor="apex-ask-input">
                  {tApex.askLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPromptGuide(!showPromptGuide)}
                  className="text-slate-400 hover:text-indigo-300 p-0.5 rounded transition-colors flex items-center gap-1 text-[10px]"
                  title={tApex.helpTitle}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] text-indigo-300 font-semibold">{tApex.helpTitle}</span>
                </button>
              </div>

              {/* Collapsible Prompt Help / Guide Card */}
              {showPromptGuide && (
                <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-[10px] space-y-1.5 animate-in fade-in">
                  <div className="font-bold flex items-center justify-between text-indigo-100">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {tApex.helpTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPromptGuide(false)}
                      className="text-slate-400 hover:text-white p-0.5"
                      title={tApex.close}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-300 leading-relaxed font-sans text-[10px]">
                    <p>{tApex.helpTipRR}</p>
                    <p>{tApex.helpTipSLTP}</p>
                    <p>{tApex.helpTipBias}</p>
                  </div>
                </div>
              )}

              <textarea
                id="apex-ask-input"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors font-mono resize-none"
                rows={2}
                placeholder={tApex.askPlaceholder}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* QUICK ACTION BUTTONS & PRESET R:R CHIPS */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 block">
                  {tApex.interactivePromptHelp}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                    onClick={() => handleQuickAction(tApex.promptRR3Template)}
                    title={tApex.askQuickRR3}
                  >
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>{tApex.askQuickRR3}</span>
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1"
                    onClick={() => handleQuickAction(tApex.promptRR2Template)}
                    title={tApex.askQuickRR2}
                  >
                    <Target className="w-3 h-3 text-indigo-400" />
                    <span>{tApex.askQuickRR2}</span>
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1"
                    onClick={() => handleQuickAction(tApex.promptRR4Template)}
                    title={tApex.askQuickRR4}
                  >
                    <Target className="w-3 h-3 text-purple-400" />
                    <span>{tApex.askQuickRR4}</span>
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px] font-semibold transition-all active:scale-95 flex items-center gap-1"
                    onClick={() => handleQuickAction(tApex.askQuickEntry)}
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{tApex.askQuickEntry}</span>
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px] font-semibold transition-all active:scale-95 flex items-center gap-1"
                    onClick={() => handleQuickAction(tApex.askSetup)}
                  >
                    <Compass className="w-3 h-3 text-sky-400" />
                    <span>{tApex.askSetup}</span>
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px] font-semibold transition-all active:scale-95 flex items-center gap-1"
                    onClick={() => handleQuickAction(tApex.askRisk)}
                  >
                    <Shield className="w-3 h-3 text-teal-400" />
                    <span>{tApex.askRisk}</span>
                  </button>
                </div>
              </div>

              {/* SEND, CANCEL & SAFE AUTO TOGGLE */}
              <div className="flex items-center justify-between pt-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm active:scale-95 flex items-center gap-1.5"
                    onClick={() => handleAsk()}
                    disabled={!question.trim() || status === 'THINKING' || status === 'STREAMING'}
                  >
                    <Send className="w-3 h-3" />
                    <span>{tApex.send}</span>
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors active:scale-95"
                    onClick={() => {
                      setStatus('IDLE');
                      setReasoning('');
                      setPlan(null);
                      setQuestion('');
                    }}
                  >
                    {tApex.cancel}
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoMode}
                    onChange={e => setAutoMode(e.target.checked)}
                    className="accent-indigo-500 rounded cursor-pointer"
                  />
                  <span className={autoMode ? 'text-amber-400 font-bold' : ''}>
                    {autoMode ? tApex.autoOn : tApex.autoOff}
                  </span>
                </label>
              </div>

              {/* Auto Mode Warning Banner */}
              {autoMode && (
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] flex items-start gap-1.5 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{tApex.autoWarning}</span>
                </div>
              )}
            </div>

            {/* Toasts & Notifications */}
            {violationMsg && (
              <div className="p-2 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{violationMsg}</span>
              </div>
            )}
            {appliedMsg && (
              <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{appliedMsg}</span>
              </div>
            )}
          </div>
        )}

        {tab === 'mtf' && (
          <div className="space-y-2 text-xs">
            {mtf ? (
              <>
                <pre className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto leading-relaxed">
                  {rendererRef.current.render(mtf)}
                </pre>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">{tApex.h4Label}:</span>
                    <span className="font-bold text-slate-200">{mtf.bias.h4}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">{tApex.d1Label}:</span>
                    <span className="font-bold text-slate-200">{mtf.bias.d1}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">{tApex.locationLabel}:</span>
                    <span className="font-bold text-amber-300">{mtf.location}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">{tApex.side}:</span>
                    <span className="font-bold text-indigo-300">{mtf.activeOB.direction}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 italic text-[11px] text-center">
                {tApex.none}
              </div>
            )}
          </div>
        )}

        {tab === 'diag' && (
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {tApex.telemetry}
            </span>
            <div className="space-y-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px]">
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
    </div>
  );
};

export default AICopilotHUD;
