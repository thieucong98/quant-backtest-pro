import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  BrainCircuit,
  Sparkles,
  Play,
  Code2,
  Settings2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileCode,
  Zap,
  Sliders,
  RefreshCw,
  Copy,
  Check,
  FolderOpen,
  Save,
  Trash2,
  BookOpen,
  Download,
  Upload,
  Trophy,
  Flame,
  Target,
  Shield,
  ShieldAlert,
  Filter,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PREBUILT_STRATEGIES } from '../../engine/strategySandbox';
import { AIService, AIProvider, LLMConfig, DEFAULT_LLM_CONFIG, AI_PROVIDER_MODELS } from '../../engine/aiService';
import {
  StrategyOptimizerEngine,
  OptimizationRange,
  OptimizationSummary,
  OptimizationResultItem,
  HeatmapCell
} from '../../engine/strategyOptimizer';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation, formatDate } from '../../i18n';
import { AIStrategyDefinition } from '../../types/strategy';
import { strategiesApi } from '../../api';
import { ExportStrategyModal } from './ExportStrategyModal';
import { useAuthStore } from '../../store/authStore';

const MiniSparkline: React.FC<{ data?: number[]; isPositive: boolean }> = ({ data, isPositive }) => {
  if (!data || data.length < 2) return <span className="text-slate-600 font-mono text-[10px]">-</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 84;
  const height = 24;
  const pad = 2;
  const points = data
    .map((val, idx) => {
      const x = pad + (idx / (data.length - 1)) * (width - pad * 2);
      const y = height - pad - ((val - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';
  const firstX = pad;
  const lastX = width - pad;
  const closedArea = `${points} ${lastX},${height} ${firstX},${height}`;

  return (
    <div className="flex items-center gap-1.5" title={`$${data[0]} -> $${data[data.length - 1]}`}>
      <svg width={width} height={height} className="overflow-visible inline-block">
        <polygon points={closedArea} fill={fillColor} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};

const LLM_STORAGE_KEY = 'quant_llm_config';

export const AIStrategyModal: React.FC = () => {
  const {
    isAIModalOpen,
    setAIModalOpen,
    aiModalTab,
    activeStrategy,
    setActiveStrategy,
    autoTradingEnabled,
    toggleAutoTrading,
    addStrategyLog,
    instrument,
    candles,
    account,
    language,
    play,
    strategyRunner
  } = useBacktestStore();

  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<'studio' | 'optimizer' | 'my-strategies' | 'templates' | 'settings'>('studio');

  useEffect(() => {
    if (isAIModalOpen && aiModalTab) {
      setActiveTab(aiModalTab);
    }
  }, [isAIModalOpen, aiModalTab]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyCode, setStrategyCode] = useState(activeStrategy?.code || PREBUILT_STRATEGIES[0].code);
  const [strategyName, setStrategyName] = useState(activeStrategy?.name || 'EMA 9/21 Fast Scalper');
  const [strategyDesc, setStrategyDesc] = useState(activeStrategy?.description || '');
  const [compileStatus, setCompileStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingDB, setIsSavingDB] = useState(false);
  const [dbSaveMessage, setDbSaveMessage] = useState<string | null>(null);

  // Auto-Tune after AI generation
  const [autoTuneAfterGen, setAutoTuneAfterGen] = useState<boolean>(true);
  const [isAutoTuning, setIsAutoTuning] = useState<boolean>(false);

  // Optimizer State
  const defaultRanges = StrategyOptimizerEngine.getSymbolDefaultRanges(instrument);
  const [slRange, setSlRange] = useState<OptimizationRange>(defaultRanges.slRange);
  const [tpRange, setTpRange] = useState<OptimizationRange>(defaultRanges.tpRange);
  const [optimizerSortBy, setOptimizerSortBy] = useState<'netProfit' | 'profitFactor' | 'winRate' | 'sharpeRatio' | 'riskRewardRatio'>('netProfit');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optProgress, setOptProgress] = useState<{ percent: number; current: number; total: number }>({ percent: 0, current: 0, total: 0 });
  const [optSummary, setOptSummary] = useState<OptimizationSummary | null>(null);
  const [selectedOptItem, setSelectedOptItem] = useState<OptimizationResultItem | null>(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<HeatmapCell | null>(null);
  const [optApplyMessage, setOptApplyMessage] = useState<string | null>(null);
  const [filterMinTrades, setFilterMinTrades] = useState<boolean>(false);
  const [filterProfitable, setFilterProfitable] = useState<boolean>(false);
  const [optEnableSplit, setOptEnableSplit] = useState<boolean>(true);
  const filteredRankedResults = useMemo(() => {
    if (!optSummary) return [];
    return optSummary.rankedResults.filter((item) => {
      if (filterMinTrades && item.report.totalTrades < 5) return false;
      if (filterProfitable && item.report.netProfit <= 0) return false;
      return true;
    });
  }, [optSummary, filterMinTrades, filterProfitable]);

  const parsedRules = useMemo(() => {
    let sl = 25;
    let tp = 50;
    let lot = 0.1;
    const slMatch = strategyCode.match(/slPips\s*:\s*(\d+(\.\d+)?)/);
    if (slMatch) sl = parseFloat(slMatch[1]);
    const tpMatch = strategyCode.match(/tpPips\s*:\s*(\d+(\.\d+)?)/);
    if (tpMatch) tp = parseFloat(tpMatch[1]);
    const lotMatch = strategyCode.match(/lotSize\s*:\s*(\d+(\.\d+)?)/);
    if (lotMatch) lot = parseFloat(lotMatch[1]);

    let buyConditionText = t.ruleBuyDefault;
    let sellConditionText = t.ruleSellDefault;

    const lower = strategyCode.toLowerCase();
    if (lower.includes('ema') || lower.includes('sma')) {
      buyConditionText = t.ruleBuyEma;
      sellConditionText = t.ruleSellEma;
    } else if (lower.includes('rsi')) {
      buyConditionText = t.ruleBuyRsi;
      sellConditionText = t.ruleSellRsi;
    } else if (lower.includes('bollinger') || lower.includes('bb')) {
      buyConditionText = t.ruleBuyBb;
      sellConditionText = t.ruleSellBb;
    } else if (lower.includes('macd')) {
      buyConditionText = t.ruleBuyMacd;
      sellConditionText = t.ruleSellMacd;
    }

    return { sl, tp, lot, buyConditionText, sellConditionText };
  }, [strategyCode, t]);

  // Export & Import Bot State
  const [isExportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportTargetStrategy, setExportTargetStrategy] = useState<AIStrategyDefinition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My Strategies from DB
  const [myStrategies, setMyStrategies] = useState<any[]>([]);
  const [isLoadingMyStrats, setIsLoadingMyStrats] = useState<boolean>(false);

  // LLM Multi-Provider Config State
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    try {
      const saved = localStorage.getItem(LLM_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LLM_CONFIG;
  });

  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testMessage, setTestMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchMyStrategies = async () => {
    setIsLoadingMyStrats(true);
    try {
      const list = await strategiesApi.list();
      setMyStrategies(list);
    } catch (err) {
      console.warn('Failed to load custom strategies from DB', err);
    } finally {
      setIsLoadingMyStrats(false);
    }
  };

  useEffect(() => {
    if (isAIModalOpen && activeTab === 'my-strategies') {
      fetchMyStrategies();
    }
  }, [isAIModalOpen, activeTab]);

  // Sync state if activeStrategy changes
  useEffect(() => {
    if (activeStrategy) {
      setStrategyName(activeStrategy.name);
      setStrategyDesc(activeStrategy.description);
      setStrategyCode(activeStrategy.code);
    }
  }, [activeStrategy]);

  // Sync symbol presets when instrument changes
  useEffect(() => {
    const newRanges = StrategyOptimizerEngine.getSymbolDefaultRanges(instrument);
    setSlRange(newRanges.slRange);
    setTpRange(newRanges.tpRange);
  }, [instrument.symbol]);

  // Lưu config vào LocalStorage
  const handleUpdateLLMConfig = (newConfig: Partial<LLMConfig>) => {
    const updated = { ...llmConfig, ...newConfig };
    setLlmConfig(updated);
    try {
      localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  if (!isAIModalOpen) return null;

  const handleGenerateWithAI = async () => {
    if (!prompt.trim()) return;

    // Tier Guard: AI Strategy Copilot requires PRO/INSTITUTIONAL account
    const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setCompileStatus('ERROR');
      setErrorMessage(t.aiCopilotAuthRequired);
      setAuthModalOpen(true, 'login');
      return;
    }

    setIsGenerating(true);
    setCompileStatus('IDLE');
    setErrorMessage('');

    try {
      const result = await AIService.generateStrategy(prompt, llmConfig, instrument.symbol);
      let finalCode = result.code;
      let finalParams: Record<string, any> = {};

      // 🔍 AI Auto-Tuning: Tự động quét SL/TP tối ưu cho Symbol hiện tại
      if (autoTuneAfterGen && candles && candles.length >= 10) {
        setIsAutoTuning(true);
        addStrategyLog('INFO', `[AI Auto-Tune] Auto-scanning & optimizing SL/TP for ${instrument.symbol}...`);
        try {
          const ranges = StrategyOptimizerEngine.getSymbolDefaultRanges(instrument);
          const autoOptSummary = await StrategyOptimizerEngine.runBatchOptimization(
            result.code,
            {},
            candles,
            instrument,
            {
              slRange: ranges.slRange,
              tpRange: ranges.tpRange,
              initialBalance: account.initialBalance || 10000,
              lotSize: 0.1,
              metricSortBy: 'netProfit'
            }
          );
          setOptSummary(autoOptSummary);
          if (autoOptSummary.bestItem) {
            setSelectedOptItem(autoOptSummary.bestItem);
            finalCode = StrategyOptimizerEngine.replaceSLTPInCode(
              result.code,
              autoOptSummary.bestItem.slPips,
              autoOptSummary.bestItem.tpPips
            );
            finalParams = {
              slPips: autoOptSummary.bestItem.slPips,
              tpPips: autoOptSummary.bestItem.tpPips
            };
            addStrategyLog(
              'SIGNAL',
              `[AI Auto-Tune] Optimized for ${instrument.symbol}: SL=${autoOptSummary.bestItem.slPips}p, TP=${autoOptSummary.bestItem.tpPips}p (Winrate: ${autoOptSummary.bestItem.report.winRate}%, Net: +${autoOptSummary.bestItem.report.netProfit.toFixed(1)})`
            );
          }
        } catch (optErr: any) {
          console.warn('Auto-tune failed, using default params', optErr);
        } finally {
          setIsAutoTuning(false);
        }
      }

      setStrategyName(result.name);
      setStrategyDesc(result.description);
      setStrategyCode(finalCode);

      // Tự động áp dụng chiến lược vừa tạo
      const newStrat: AIStrategyDefinition = {
        id: 'ai_strat_' + Date.now(),
        name: result.name,
        description: result.description,
        code: finalCode,
        parameters: finalParams,
        enabled: true,
        createdAt: Date.now()
      };

      setActiveStrategy(newStrat);
      setCompileStatus('SUCCESS');
      addStrategyLog('SIGNAL', `[AI Copilot] Generated and loaded strategy: "${result.name}"`);
    } catch (err: any) {
      setCompileStatus('ERROR');
      setErrorMessage(err.message || 'Error generating strategy.');
      addStrategyLog('ERROR', `[AI Generator Error] ${err.message}`);
    } finally {
      setIsGenerating(false);
      setIsAutoTuning(false);
    }
  };

  const handleApplyStrategy = () => {
    try {
      const compileRes = strategyRunner.compile(strategyCode, activeStrategy?.parameters || {});
      if (!compileRes.success) {
        setCompileStatus('ERROR');
        setErrorMessage(compileRes.error || 'Strategy compilation syntax error.');
        return;
      }

      const newStrat: AIStrategyDefinition = {
        id: activeStrategy?.id || 'strat_' + Date.now(),
        name: strategyName,
        description: strategyDesc,
        code: strategyCode,
        parameters: activeStrategy?.parameters || {},
        enabled: true,
        createdAt: activeStrategy?.createdAt || Date.now()
      };

      setActiveStrategy(newStrat);
      toggleAutoTrading(true);
      setCompileStatus('SUCCESS');
      setErrorMessage('');
      addStrategyLog('SIGNAL', `[AI Copilot] Activated & running strategy: "${strategyName}" (Auto-Trading: ON)`);
      setAIModalOpen(false);
      play();
    } catch (err: any) {
      setCompileStatus('ERROR');
      setErrorMessage(err.message || 'Strategy compilation syntax error.');
    }
  };

  const handleSaveToDatabase = async () => {
    const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setDbSaveMessage('🔒 Please sign in to save strategy to database');
      setAuthModalOpen(true, 'login');
      setTimeout(() => setDbSaveMessage(null), 3000);
      return;
    }

    setIsSavingDB(true);
    setDbSaveMessage(null);
    try {
      await strategiesApi.create({
        name: strategyName,
        description: strategyDesc,
        code: strategyCode,
        parameters: activeStrategy?.parameters || {},
        enabled: true
      });
      setDbSaveMessage(t.savedToDBSuccess);
      setTimeout(() => setDbSaveMessage(null), 3000);
      addStrategyLog('INFO', `Saved strategy "${strategyName}" to database`);
    } catch (err: any) {
      setDbSaveMessage('Error saving to DB');
      setTimeout(() => setDbSaveMessage(null), 3000);
    } finally {
      setIsSavingDB(false);
    }
  };

  const handleSelectTemplate = (tpl: AIStrategyDefinition) => {
    setStrategyName(tpl.name);
    setStrategyDesc(tpl.description);
    setStrategyCode(tpl.code);
    setActiveStrategy(tpl);
    setActiveTab('studio');
    setCompileStatus('SUCCESS');
    addStrategyLog('INFO', `Loaded template strategy: "${tpl.name}"`);
  };

  const handleLoadCustomStrategy = (strat: any) => {
    const loaded: AIStrategyDefinition = {
      id: strat.id,
      name: strat.name,
      description: strat.description || '',
      code: strat.code,
      parameters: strat.parameters || {},
      enabled: strat.enabled ?? true,
      createdAt: new Date(strat.createdAt).getTime()
    };
    setStrategyName(loaded.name);
    setStrategyDesc(loaded.description);
    setStrategyCode(loaded.code);
    setActiveStrategy(loaded);
    toggleAutoTrading(true);
    setCompileStatus('SUCCESS');
    addStrategyLog('SIGNAL', `[AI Copilot] Loaded & activated strategy from DB: "${loaded.name}" (Auto-Trading: ON)`);
    setAIModalOpen(false);
    play();
  };

  const handleImportStrategyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importedName = file.name.replace(/\.[^/.]+$/, '');
      let importedDesc = 'Strategy imported from ' + file.name;
      let importedCode = text;
      let importedParams = {};

      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(text);
          if (json.strategy) {
            importedName = json.strategy.name || importedName;
            importedDesc = json.strategy.description || importedDesc;
            importedCode = json.strategy.code || importedCode;
            importedParams = json.strategy.parameters || {};
          }
        } catch (jsonErr) {
          console.warn('JSON parsing error, fallback to raw text', jsonErr);
        }
      }

      await strategiesApi.create({
        name: importedName,
        description: importedDesc,
        code: importedCode,
        parameters: importedParams,
        enabled: true
      });

      await fetchMyStrategies();
      setDbSaveMessage(t.importStrategySuccess);
      setTimeout(() => setDbSaveMessage(null), 3000);
      addStrategyLog('INFO', `[Strategy Import] Successfully imported strategy "${importedName}"`);
    } catch (err: any) {
      alert(t.importStrategyError + (err?.message ? ': ' + err.message : ''));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenExportModal = (strat?: AIStrategyDefinition) => {
    const target = strat || {
      id: activeStrategy?.id || 'strat_' + Date.now(),
      name: strategyName,
      description: strategyDesc,
      code: strategyCode,
      parameters: activeStrategy?.parameters || {},
      enabled: true,
      createdAt: activeStrategy?.createdAt || Date.now()
    };
    setExportTargetStrategy(target);
    setExportModalOpen(true);
  };

  const handleDeleteCustomStrategy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDeleteStrat)) {
      try {
        await strategiesApi.delete(id);
        await fetchMyStrategies();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('TESTING');
    setTestMessage(t.processingBtn);

    try {
      const res = await AIService.testConnection(llmConfig);
      setTestStatus('SUCCESS');
      setTestMessage(`🟢 ${res.message} • Model: ${res.model}`);
    } catch (err: any) {
      setTestStatus('ERROR');
      setTestMessage(`🔴 ${err.message || 'Cannot connect to provider.'}`);
    }
  };

  const handleApplyUserPreset = () => {
    const customConfig: LLMConfig = {
      provider: 'custom',
      baseUrl: llmConfig.baseUrl || 'https://api.openai.com/v1',
      apiKey: llmConfig.apiKey || '',
      model: 'ag/gemini-pro-agent',
      temperature: 0.2
    };
    setLlmConfig(customConfig);
    try {
      localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(customConfig));
    } catch (e) {}
    setTestStatus('IDLE');
    setTestMessage('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(strategyCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- OPTIMIZER HANDLERS ---
  const handleRunOptimizer = async () => {
    if (candles.length < 10) {
      alert(t.insufficientCandlesForOpt);
      return;
    }

    setIsOptimizing(true);
    setOptProgress({ percent: 0, current: 0, total: 0 });
    setSelectedOptItem(null);

    // Give UI a moment to show spinner
    await new Promise(r => setTimeout(r, 60));

    try {
      const summary = await StrategyOptimizerEngine.runBatchOptimization(
        strategyCode,
        activeStrategy?.parameters || {},
        candles,
        instrument,
        {
          slRange,
          tpRange,
          metricSortBy: optimizerSortBy,
          splitRatio: optEnableSplit ? 0.70 : 0
        },
        (percent, current, total) => setOptProgress({ percent, current, total })
      );

      setOptSummary(summary);
      if (summary.bestItem) {
        setSelectedOptItem(summary.bestItem);
      }
    } catch (err: any) {
      console.error('Optimization error:', err);
      alert(`Optimizer error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptConfig = (item: OptimizationResultItem) => {
    const updatedCode = StrategyOptimizerEngine.replaceSLTPInCode(strategyCode, item.slPips, item.tpPips);
    setStrategyCode(updatedCode);

    const updatedParams = {
      ...(activeStrategy?.parameters || {}),
      slPips: item.slPips,
      tpPips: item.tpPips
    };

    const newStrat: AIStrategyDefinition = {
      id: activeStrategy?.id || 'strat_' + Date.now(),
      name: strategyName,
      description: strategyDesc,
      code: updatedCode,
      parameters: updatedParams,
      enabled: true,
      createdAt: activeStrategy?.createdAt || Date.now()
    };

    setActiveStrategy(newStrat);
    setOptApplyMessage(t.optApplySuccessMsg.replace('{sl}', item.slPips.toString()).replace('{tp}', item.tpPips.toString()));
    setTimeout(() => setOptApplyMessage(null), 3500);

    addStrategyLog(
      'SIGNAL',
      `[Optimizer] Applied config SL=${item.slPips}p, TP=${item.tpPips}p (WR: ${item.report.winRate}%, Net: +${item.report.netProfit.toFixed(1)})`
    );
  };

  const handleSelectPreset = (symbolPreset: string) => {
    const mockSpec = { ...instrument, symbol: symbolPreset, category: symbolPreset.includes('XAU') ? 'METALS' : symbolPreset.includes('BTC') ? 'CRYPTO' : symbolPreset.includes('US30') ? 'INDICES' : 'FOREX' } as any;
    const ranges = StrategyOptimizerEngine.getSymbolDefaultRanges(mockSpec);
    setSlRange(ranges.slRange);
    setTpRange(ranges.tpRange);
  };

  const promptSuggestions = [
    { label: t.promptSuggestionEmaLabel, text: t.promptSuggestionEmaText },
    { label: t.promptSuggestionRsiLabel, text: t.promptSuggestionRsiText },
    { label: t.promptSuggestionBbLabel, text: t.promptSuggestionBbText },
    { label: t.promptSuggestionMacdLabel, text: t.promptSuggestionMacdText }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in">
      <div className="bg-[#10141f] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[860px] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* HEADER */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-100">{t.aiStudioTitle}</h2>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono">
                  {AI_PROVIDER_MODELS[llmConfig.provider]?.name.split(' ')[0]} • {llmConfig.model}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Trading Switch */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 sm:px-3 py-1 rounded-lg">
              <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">{t.autoTrading}:</span>
              <button
                onClick={() => toggleAutoTrading()}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  autoTradingEnabled
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {autoTradingEnabled ? t.autoTradingOn : t.autoTradingOff}
              </button>
            </div>

            <button
              onClick={() => setAIModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center justify-between px-2 sm:px-4 bg-slate-950 border-b border-slate-800 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 sm:px-3.5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'studio'
                  ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.studioAndSandboxTab}</span>
            </button>

            {/* TAB OPTIMIZER */}
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`px-3 sm:px-3.5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'optimizer'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.optimizerTab}</span>
              {optSummary && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('my-strategies')}
              className={`px-3 sm:px-3.5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'my-strategies'
                  ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.myStrategiesTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 sm:px-3.5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'border-teal-500 text-teal-400 bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.templatesTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-3.5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t.llmConfigTab}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center gap-2">
            <span>{instrument.symbol}</span>
            <span>•</span>
            <span className="text-slate-300 font-bold truncate max-w-[200px]">{strategyName}</span>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {/* TAB 1: STUDIO */}
          {activeTab === 'studio' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* LEFT COLUMN: PROMPT GENERATOR */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t.describeStrategyLabel}</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/50 border border-purple-500/30 text-purple-300 font-mono">
                      {instrument.symbol}
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.promptPlaceholder}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono resize-none"
                  />

                  {/* PROMPT SUGGESTIONS */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>{t.quickPromptsLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {promptSuggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(sug.text)}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[10px] font-mono transition-colors border border-slate-700/50"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AUTO-TUNE CHECKBOX */}
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={autoTuneAfterGen}
                      onChange={(e) => setAutoTuneAfterGen(e.target.checked)}
                      className="accent-purple-500 rounded cursor-pointer"
                    />
                    <span className="flex-1">{t.autoTuneCheckbox}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono">
                      {instrument.symbol}
                    </span>
                  </label>

                  {/* GENERATE BUTTON */}
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-98 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{isAutoTuning ? t.autoTuneRunning : t.generating}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>{t.generateStrategy}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* COPILOT ADVICE / STATUS */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{t.copilotTips}</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>{t.aiSandboxTip1}</li>
                    <li>{t.aiSandboxTip2}</li>
                    <li>{t.aiSandboxTip3}</li>
                  </ul>
                </div>
              </div>

              {/* RIGHT COLUMN: CODE EDITOR & SANDBOX */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex-1 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                      <input
                        type="text"
                        value={strategyName}
                        onChange={(e) => setStrategyName(e.target.value)}
                        placeholder={t.strategyNamePlaceholder}
                        className="bg-transparent font-bold text-xs text-slate-100 focus:outline-none border-b border-transparent focus:border-indigo-500 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 transition-colors"
                        title="Copy Code"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('optimizer')}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                        title={t.openOptimizerTooltip}
                      >
                        <Flame className="w-3 h-3 text-emerald-400" />
                        <span>{t.optimizerTab}</span>
                      </button>

                      <button
                        onClick={() => handleOpenExportModal()}
                        className="px-2.5 py-1 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                        title={t.exportBotModalTooltip}
                      >
                        <Download className="w-3 h-3" />
                        <span>{t.exportBotBtn}</span>
                      </button>

                      <button
                        onClick={handleSaveToDatabase}
                        disabled={isSavingDB}
                        className="px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Save className="w-3 h-3" />
                        <span>{isSavingDB ? t.processingBtn : t.saveToDB}</span>
                      </button>

                      <button
                        onClick={handleApplyStrategy}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-md shadow-emerald-600/30"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t.activateAndResume}</span>
                      </button>
                    </div>
                  </div>

                  {dbSaveMessage && (
                    <div className="text-[11px] text-amber-400 font-mono bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded">
                      {dbSaveMessage}
                    </div>
                  )}

                  {/* CODE EDITOR TEXTAREA */}
                  <div className="flex-1 min-h-[260px] relative">
                    <textarea
                      value={strategyCode}
                      onChange={(e) => {
                        setStrategyCode(e.target.value);
                        setCompileStatus('IDLE');
                      }}
                      spellCheck={false}
                      className="w-full h-full bg-[#0d1117] border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* COMPILATION STATUS */}
                  {compileStatus === 'SUCCESS' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 rounded">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.strategyCompiledActive}</span>
                    </div>
                  )}
                  {compileStatus === 'ERROR' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/30 px-2.5 py-1 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* STRATEGY RULES BREAKDOWN & QUICK PARAMETER TUNING */}
                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <h4 className="font-bold text-[11px] text-slate-200">{t.strategyRulesTitle}</h4>
                      </div>
                      <span className="text-[9px] px-2 py-0.2 rounded bg-purple-950/50 border border-purple-500/30 text-purple-300 font-mono">
                        {instrument.symbol} • AI Rule Engine
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {/* BUY CARD */}
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{t.ruleBuyConditions}</span>
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">LONG</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          {parsedRules.buyConditionText}
                        </p>
                      </div>

                      {/* SELL CARD */}
                      <div className="bg-rose-950/20 border border-rose-500/30 p-2 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>{t.ruleSellConditions}</span>
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300 font-mono">SHORT</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          {parsedRules.sellConditionText}
                        </p>
                      </div>

                      {/* RISK & POSITION SIZING */}
                      <div className="bg-purple-950/20 border border-purple-500/30 p-2 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>{t.ruleRiskParams}</span>
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-mono">
                            1:{(parsedRules.tp / (parsedRules.sl || 1)).toFixed(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                          <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[8px]">SL</span>
                            <span className="font-bold text-rose-400">{parsedRules.sl}p</span>
                          </div>
                          <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[8px]">TP</span>
                            <span className="font-bold text-emerald-400">{parsedRules.tp}p</span>
                          </div>
                          <div className="bg-slate-900/90 p-1 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[8px]">Lot</span>
                            <span className="font-bold text-purple-300">{parsedRules.lot}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SL/TP OPTIMIZER */}
          {activeTab === 'optimizer' && (
            <div className="space-y-4">
              {/* CONTROLS & RANGE CONFIG */}
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-emerald-400" />
                      <span>{t.optimizerTitle}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.optimizerDesc}</p>
                  </div>

                  {/* SYMBOL PRESET SELECTOR */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono mr-1">{t.symbolPreset}:</span>
                    {['XAUUSD', 'EURUSD', 'BTCUSD', 'US30'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${
                          instrument.symbol === preset
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RANGE INPUTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* SL RANGE */}
                  <div className="bg-slate-950/80 border border-slate-800/90 p-2.5 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.slRangeLabel}</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div>
                        <label className="text-[9px] text-slate-500 block">{t.rangeMin}</label>
                        <input
                          type="number"
                          value={slRange.min}
                          onChange={(e) => setSlRange({ ...slRange, min: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">{t.rangeMax}</label>
                        <input
                          type="number"
                          value={slRange.max}
                          onChange={(e) => setSlRange({ ...slRange, max: Math.max(slRange.min, Number(e.target.value)) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">{t.rangeStep}</label>
                        <input
                          type="number"
                          value={slRange.step}
                          onChange={(e) => setSlRange({ ...slRange, step: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TP RANGE */}
                  <div className="bg-slate-950/80 border border-slate-800/90 p-2.5 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.tpRangeLabel}</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div>
                        <label className="text-[9px] text-slate-500 block">{t.rangeMin}</label>
                        <input
                          type="number"
                          value={tpRange.min}
                          onChange={(e) => setTpRange({ ...tpRange, min: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">{t.rangeMax}</label>
                        <input
                          type="number"
                          value={tpRange.max}
                          onChange={(e) => setTpRange({ ...tpRange, max: Math.max(tpRange.min, Number(e.target.value)) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">{t.rangeStep}</label>
                        <input
                          type="number"
                          value={tpRange.step}
                          onChange={(e) => setTpRange({ ...tpRange, step: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OBJECTIVE SORT */}
                  <div className="bg-slate-950/80 border border-slate-800/90 p-2.5 rounded-lg space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">{t.sortByLabel}:</label>
                    <select
                      value={optimizerSortBy}
                      onChange={(e) => setOptimizerSortBy(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                    >
                      <option value="netProfit">Net Profit ($ PnL)</option>
                      <option value="profitFactor">Profit Factor (PF)</option>
                      <option value="winRate">Win Rate (%)</option>
                      <option value="sharpeRatio">Sharpe Ratio</option>
                      <option value="riskRewardRatio">Risk-Reward (R:R)</option>
                    </select>
                  </div>

                  {/* RUN ACTION */}
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleRunOptimizer}
                      disabled={isOptimizing}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-98"
                    >
                      {isOptimizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t.runningOptimizer} ({optProgress.percent}%)</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4 fill-current" />
                          <span>{t.runOptimizerBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                {isOptimizing && (
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150"
                      style={{ width: `${optProgress.percent}%` }}
                    />
                  </div>
                )}

                {optApplyMessage && (
                  <div className="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{optApplyMessage}</span>
                  </div>
                )}
              </div>

              {/* SUMMARY & BEST SPOTLIGHT */}
              {optSummary && optSummary.bestItem && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* BEST OVERALL CARD */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/80 border-2 border-emerald-500/60 p-4 rounded-xl shadow-xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>{t.bestOverallBadge}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {optSummary.executionTimeMs}ms • {optSummary.totalCombinations} combos
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Stop Loss (SL)</span>
                          <span className="text-rose-400 font-bold text-sm">{optSummary.bestItem.slPips} pips</span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Take Profit (TP)</span>
                          <span className="text-emerald-400 font-bold text-sm">{optSummary.bestItem.tpPips} pips</span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Net PnL ($)</span>
                          <span className={`font-bold text-sm ${optSummary.bestItem.report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {optSummary.bestItem.report.netProfit >= 0 ? '+' : ''}${optSummary.bestItem.report.netProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Win Rate / PF</span>
                          <span className="text-slate-200 font-bold text-sm">
                            {optSummary.bestItem.report.winRate.toFixed(1)}% <span className="text-slate-500 text-xs">(PF {optSummary.bestItem.report.profitFactor.toFixed(2)})</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between px-1">
                        <span>R:R 1:{optSummary.bestItem.riskRewardRatio}</span>
                        <span>Max DD: {optSummary.bestItem.report.maxDrawdownPercent.toFixed(1)}%</span>
                        <span>{optSummary.bestItem.report.totalTrades} {t.tradesCol}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyOptConfig(optSummary.bestItem!)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40 transition-all active:scale-98"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{t.applyBestConfig}</span>
                    </button>
                  </div>

                  {/* 2D HEATMAP MATRIX */}
                  <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-xs text-slate-200">{t.heatmapTitle}</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{t.optAxisHelp}</span>
                    </div>

                    {/* HEATMAP GRID */}
                    <div className="overflow-x-auto py-2">
                      <table className="w-full border-collapse text-center font-mono text-[10px]">
                        <thead>
                          <tr>
                            <th className="p-1 text-slate-500 text-[9px]">TP \ SL</th>
                            {optSummary.heatmap.slValues.map((sl) => (
                              <th key={sl} className="p-1 text-slate-400 font-bold border-b border-slate-800">
                                {sl}p
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {optSummary.heatmap.tpValues.map((tp, rowIdx) => (
                            <tr key={tp}>
                              <td className="p-1 font-bold text-slate-400 border-r border-slate-800 text-left">
                                {tp}p
                              </td>
                              {optSummary.heatmap.slValues.map((sl, colIdx) => {
                                const cell = optSummary.heatmap.cells[rowIdx]?.[colIdx];
                                if (!cell) return <td key={sl}>-</td>;

                                const isPositive = cell.netProfit >= 0;
                                const maxP = Math.max(1, optSummary.heatmap.maxProfit);
                                const intensity = Math.min(1, Math.max(0.15, Math.abs(cell.netProfit) / maxP));

                                const isSelected = selectedOptItem?.slPips === sl && selectedOptItem?.tpPips === tp;

                                return (
                                  <td
                                    key={sl}
                                    onMouseEnter={() => setHoveredHeatmapCell(cell)}
                                    onMouseLeave={() => setHoveredHeatmapCell(null)}
                                    onClick={() => {
                                      const matched = optSummary.rankedResults.find(
                                        (r) => r.slPips === sl && r.tpPips === tp
                                      );
                                      if (matched) setSelectedOptItem(matched);
                                    }}
                                    className={`p-1.5 cursor-pointer border border-slate-900 transition-transform hover:scale-110 relative ${
                                      isSelected ? 'ring-2 ring-amber-400 z-10' : ''
                                    }`}
                                    style={{
                                      backgroundColor: isPositive
                                        ? `rgba(16, 185, 129, ${intensity * 0.85})`
                                        : `rgba(239, 68, 68, ${intensity * 0.85})`,
                                      color: '#ffffff'
                                    }}
                                  >
                                    <div className="font-bold text-[10px]">
                                      {cell.netProfit >= 0 ? '+' : ''}${Math.round(cell.netProfit)}
                                    </div>
                                    <div className="text-[8px] opacity-80">
                                      {cell.winRate.toFixed(0)}%
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* HOVER TOOLTIP / CELL INFO */}
                    <div className="h-6 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                      {hoveredHeatmapCell ? (
                        <span className="text-emerald-300">
                          SL: {hoveredHeatmapCell.slPips}p • TP: {hoveredHeatmapCell.tpPips}p • Net PnL: ${hoveredHeatmapCell.netProfit.toFixed(1)} • Winrate: {hoveredHeatmapCell.winRate.toFixed(1)}% ({hoveredHeatmapCell.totalTrades} trades)
                        </span>
                      ) : (
                        <span className="text-slate-500">{t.heatmapSub}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LEADERBOARD TABLE */}
              {optSummary && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden space-y-0">
                  <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-xs text-slate-200">{t.leaderboardTitle}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({filteredRankedResults.length} / {optSummary.rankedResults.length})
                      </span>
                    </div>

                    {/* QUALITY FILTERS & SPLIT TOGGLE */}
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-amber-200 transition-colors bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                        <input
                          type="checkbox"
                          checked={optEnableSplit}
                          onChange={(e) => setOptEnableSplit(e.target.checked)}
                          className="accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Train/Test Split (70% IS / 30% OOS)</span>
                      </label>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Filter className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-slate-500">{t.filterLabel}</span>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={filterMinTrades}
                          onChange={(e) => setFilterMinTrades(e.target.checked)}
                          className="accent-purple-500 rounded cursor-pointer"
                        />
                        <span>{t.qualityFilterMinTrades}</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={filterProfitable}
                          onChange={(e) => setFilterProfitable(e.target.checked)}
                          className="accent-emerald-500 rounded cursor-pointer"
                        />
                        <span>{t.qualityFilterProfitable}</span>
                      </label>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[320px]">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-slate-950/90 text-slate-400 sticky top-0 text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">{t.rankCol}</th>
                          <th className="py-2 px-3">SL (Pips)</th>
                          <th className="py-2 px-3">TP (Pips)</th>
                          <th className="py-2 px-3">R:R</th>
                          <th className="py-2 px-3">{t.tradesCol}</th>
                          <th className="py-2 px-3">Win Rate (IS)</th>
                          <th className="py-2 px-3">OOS WinRate</th>
                          <th className="py-2 px-3">{t.wfaCol}</th>
                          <th className="py-2 px-3">Net PnL ($)</th>
                          <th className="py-2 px-3">{t.sparklineEquity}</th>
                          <th className="py-2 px-3">Profit Factor</th>
                          <th className="py-2 px-3">Max DD (%)</th>
                          <th className="py-2 px-3 text-right">{t.actionsCol}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {filteredRankedResults.slice(0, 40).map((res, index) => {
                          const isBest = index === 0;
                          return (
                            <tr
                              key={res.id}
                              className={`hover:bg-slate-800/50 transition-colors ${
                                isBest ? 'bg-emerald-950/20' : ''
                              }`}
                            >
                              <td className="py-2 px-3 font-bold text-slate-400">
                                {isBest ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                    #1 🏆
                                  </span>
                                ) : (
                                  `#${index + 1}`
                                )}
                              </td>
                              <td className="py-2 px-3 text-rose-400 font-bold">{res.slPips} p</td>
                              <td className="py-2 px-3 text-emerald-400 font-bold">{res.tpPips} p</td>
                              <td className="py-2 px-3 text-slate-300">1:{res.riskRewardRatio}</td>
                              <td className="py-2 px-3 text-slate-400">{res.report.totalTrades}</td>
                              <td className="py-2 px-3 text-slate-200 font-bold">
                                {res.report.winRate.toFixed(1)}%
                              </td>
                              <td className="py-2 px-3 font-bold text-indigo-300">
                                {res.oosReport ? `${res.oosReport.winRate.toFixed(1)}%` : '---'}
                              </td>
                              <td className="py-2 px-3">
                                {res.robustnessRating ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      res.robustnessRating.includes('Robust')
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                        : res.robustnessRating.includes('Moderate')
                                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                    }`}
                                  >
                                    {res.robustnessRating}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                              <td
                                className={`py-2 px-3 font-bold ${
                                  res.report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {res.report.netProfit >= 0 ? '+' : ''}${res.report.netProfit.toFixed(2)}
                              </td>
                              <td className="py-2 px-3">
                                <MiniSparkline data={res.sparkline} isPositive={res.report.netProfit >= 0} />
                              </td>
                              <td className="py-2 px-3 text-slate-300">{res.report.profitFactor.toFixed(2)}</td>
                              <td className="py-2 px-3 text-rose-300">{res.report.maxDrawdownPercent.toFixed(1)}%</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleApplyOptConfig(res)}
                                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"
                                >
                                  {t.applyConfigBtn}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY STRATEGIES (DB) */}
          {activeTab === 'my-strategies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">
                  {t.myStrategiesSub}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportStrategyFile}
                    accept=".json,.js"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors border border-slate-700"
                    title={t.importStrategyModalTooltip}
                  >
                    <Upload className="w-3 h-3 text-indigo-400" />
                    <span>{t.importStrategyBtn}</span>
                  </button>

                  <button
                    onClick={fetchMyStrategies}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingMyStrats ? 'animate-spin' : ''}`} />
                    <span>{t.refreshBtn}</span>
                  </button>
                </div>
              </div>

              {isLoadingMyStrats ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40" />
                  {t.processingBtn}
                </div>
              ) : myStrategies.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                  <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  {t.noCustomStrategiesInDb}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myStrategies.map((strat) => (
                    <div
                      key={strat.id}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-xs">{strat.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {formatDate(strat.createdAt, language)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2 mt-1">
                          {strat.description || t.customStrategyNoDesc}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() =>
                            handleOpenExportModal({
                              id: strat.id,
                              name: strat.name,
                              description: strat.description || '',
                              code: strat.code,
                              parameters: strat.parameters || {},
                              enabled: strat.enabled ?? true,
                              createdAt: new Date(strat.createdAt).getTime()
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors"
                          title={t.exportBotModalTooltip}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCustomStrategy(strat.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                          title={t.deleteStrategyTitle}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleLoadCustomStrategy(strat)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{t.activateAndResume}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">
                {t.templatesSub}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PREBUILT_STRATEGIES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl space-y-2 flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-200 text-xs">{tpl.name}</span>
                      <p className="text-slate-400 text-[11px] mt-1">{tpl.description}</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSelectTemplate(tpl)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t.loadIntoStudioBtn}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LLM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  {t.llmConfigTitle}
                </h3>

                <button
                  type="button"
                  onClick={handleApplyUserPreset}
                  className="px-2.5 py-1 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>{t.quickFillCustomBtn}</span>
                </button>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.llmProviderLabel}</label>
                <select
                  value={llmConfig.provider}
                  onChange={(e) => {
                    const newProv = e.target.value as AIProvider;
                    const def = AI_PROVIDER_MODELS[newProv];
                    handleUpdateLLMConfig({
                      provider: newProv,
                      baseUrl: def.defaultBaseUrl || '',
                      model: def.models[0] || 'ag/gemini-pro-agent'
                    });
                    setTestStatus('IDLE');
                    setTestMessage('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                >
                  {(Object.keys(AI_PROVIDER_MODELS) as AIProvider[]).map((prov) => (
                    <option key={prov} value={prov}>
                      {AI_PROVIDER_MODELS[prov].name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">{t.llmCustomEndpointDesc}</p>
              </div>

              {/* Base URL */}
              {llmConfig.provider !== 'builtin' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">{t.llmBaseUrlLabel}</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateLLMConfig({ baseUrl: 'https://api.openai.com/v1' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:bg-purple-900"
                      >
                        OpenAI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateLLMConfig({ baseUrl: 'https://openrouter.ai/api/v1' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        OpenRouter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateLLMConfig({ baseUrl: 'https://api.groq.com/openai/v1' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        Groq
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={llmConfig.baseUrl || ''}
                    onChange={(e) => handleUpdateLLMConfig({ baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              )}

              {/* Model ID / Name */}
              {llmConfig.provider !== 'builtin' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">{t.llmModelLabel}</label>
                    <div className="flex items-center gap-1">
                      {AI_PROVIDER_MODELS[llmConfig.provider]?.models.slice(0, 3).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleUpdateLLMConfig({ model: m })}
                          className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                            llmConfig.model === m
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={llmConfig.model || ''}
                    onChange={(e) => handleUpdateLLMConfig({ model: e.target.value })}
                    placeholder={t.customModelInputPlaceholder}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              )}

              {/* API Key */}
              {llmConfig.provider !== 'builtin' && llmConfig.provider !== 'ollama' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.llmApiKeyLabel}</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={llmConfig.apiKey || ''}
                      onChange={(e) => handleUpdateLLMConfig({ apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      {showApiKey ? t.hideApiKey : t.showApiKey}
                    </button>
                  </div>
                </div>
              )}

              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{t.llmTemperatureLabel}</span>
                  <span className="font-mono text-purple-300 font-bold">{llmConfig.temperature ?? 0.2}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={llmConfig.temperature ?? 0.2}
                  onChange={(e) => handleUpdateLLMConfig({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Test Connection Footer */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'TESTING'}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'TESTING' ? 'animate-spin' : ''}`} />
                  <span>{testStatus === 'TESTING' ? t.processingBtn : t.llmTestConnectionBtn}</span>
                </button>

                {testMessage && (
                  <div
                    className={`text-xs font-mono p-2 rounded-lg border max-w-full truncate ${
                      testStatus === 'SUCCESS'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : testStatus === 'ERROR'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {testMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="h-10 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-500 text-[11px] font-mono">
          <span>JavaScript Strategy Sandbox Engine • Multi-Variant SL/TP Optimizer</span>
          <span>Quant Backtest Pro AI Studio</span>
        </div>
      </div>

      {/* BOT EXPORT & TRANSPILER MODAL */}
      <ExportStrategyModal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        strategy={exportTargetStrategy}
      />
    </div>
  );
};
