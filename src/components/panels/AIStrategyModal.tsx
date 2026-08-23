import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BrainCircuit,
  Sparkles,
  Play,
  Pause,
  Code2,
  Settings2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileCode,
  Zap,
  Key,
  Globe,
  Sliders,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  FolderOpen,
  Save,
  Trash2,
  BookOpen,
  Download,
  Upload
} from 'lucide-react';
import { PREBUILT_STRATEGIES } from '../../engine/strategySandbox';
import { AIService, AIProvider, LLMConfig, DEFAULT_LLM_CONFIG, AI_PROVIDER_MODELS } from '../../engine/aiService';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { AIStrategyDefinition } from '../../types/strategy';
import { strategiesApi } from '../../api';
import { ExportStrategyModal } from './ExportStrategyModal';

const LLM_STORAGE_KEY = 'quant_llm_config';

export const AIStrategyModal: React.FC = () => {
  const {
    isAIModalOpen,
    setAIModalOpen,
    activeStrategy,
    setActiveStrategy,
    autoTradingEnabled,
    toggleAutoTrading,
    addStrategyLog,
    instrument,
    language,
    play,
    strategyRunner
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  const [activeTab, setActiveTab] = useState<'studio' | 'my-strategies' | 'templates' | 'settings'>('studio');
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
    setIsGenerating(true);
    setCompileStatus('IDLE');
    setErrorMessage('');

    try {
      const result = await AIService.generateStrategy(prompt, llmConfig, instrument.symbol);
      setStrategyName(result.name);
      setStrategyDesc(result.description);
      setStrategyCode(result.code);

      // Tự động áp dụng chiến lược vừa tạo
      const newStrat: AIStrategyDefinition = {
        id: 'ai_strat_' + Date.now(),
        name: result.name,
        description: result.description,
        code: result.code,
        parameters: {},
        enabled: true,
        createdAt: Date.now()
      };

      setActiveStrategy(newStrat);
      setCompileStatus('SUCCESS');
      addStrategyLog('SIGNAL', `[AI Copilot] Đã tạo và nạp chiến lược: "${result.name}"`);
    } catch (err: any) {
      setCompileStatus('ERROR');
      setErrorMessage(err.message || 'Lỗi khi sinh chiến lược.');
      addStrategyLog('ERROR', `[AI Generator Error] ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyStrategy = () => {
    try {
      const compileRes = strategyRunner.compile(strategyCode, activeStrategy?.parameters || {});
      if (!compileRes.success) {
        setCompileStatus('ERROR');
        setErrorMessage(compileRes.error || 'Lỗi cú pháp chiến lược.');
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
      addStrategyLog('SIGNAL', `[AI Copilot] Kích hoạt & chạy chiến lược: "${strategyName}" (Auto-Trading: BẬT)`);
      setAIModalOpen(false);
      play();
    } catch (err: any) {
      setCompileStatus('ERROR');
      setErrorMessage(err.message || 'Lỗi cú pháp chiến lược.');
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSavingDB(true);
    setDbSaveMessage(null);
    try {
      await strategiesApi.create({
        name: strategyName,
        description: strategyDesc,
        code: strategyCode,
        parameters: {},
        enabled: true
      });
      setDbSaveMessage(t.savedToDBSuccess || 'Đã lưu vào DB thành công!');
      setTimeout(() => setDbSaveMessage(null), 3000);
      addStrategyLog('INFO', `Đã lưu chiến lược "${strategyName}" vào cơ sở dữ liệu`);
    } catch (err: any) {
      setDbSaveMessage('Lỗi khi lưu vào DB');
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
    addStrategyLog('INFO', `Đã nạp mẫu chiến lược: "${tpl.name}"`);
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
    addStrategyLog('SIGNAL', `[AI Copilot] Đã nạp & chạy chiến lược từ DB: "${loaded.name}" (Auto-Trading: BẬT)`);
    setAIModalOpen(false);
    play();
  };

  const handleImportStrategyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importedName = file.name.replace(/\.[^/.]+$/, "");
      let importedDesc = 'Chiến lược được import từ file ' + file.name;
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
      setDbSaveMessage(t.importStrategySuccess || 'Đã import chiến lược thành công!');
      setTimeout(() => setDbSaveMessage(null), 3000);
      addStrategyLog('INFO', `[Strategy Import] Đã import thành công chiến lược "${importedName}"`);
    } catch (err: any) {
      alert(t.importStrategyError || 'Lỗi khi đọc file chiến lược: ' + err.message);
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
    if (window.confirm('Bạn có chắc muốn xóa chiến lược này khỏi DB?')) {
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
      setTestMessage(`🔴 ${err.message || 'Không thể kết nối tới nhà cung cấp.'}`);
    }
  };

  const handleApplyUserPreset = () => {
    const customConfig: LLMConfig = {
      provider: 'custom',
      baseUrl: 'https://r5yym74.abc-tunnel.us/v1',
      apiKey: 'sk-bd86ea7ea3f6f5b9-6fcxtf-3941c578',
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

  const promptSuggestions = [
    { label: 'EMA 9/21 Scalper', text: 'Chiến lược lướt sóng nhanh: Mua khi EMA 9 cắt lên EMA 21, Bán khi EMA 9 cắt xuống EMA 21 kèm SL 15pips, TP 30pips' },
    { label: 'RSI 30/70 Pullback', text: 'Mua khi RSI 14 quá bán dưới 30 và nến xanh xuất hiện; Bán khi RSI 14 quá mua trên 70 và nến đỏ xuất hiện' },
    { label: 'Bollinger Band Squeeze', text: 'Chiến lược phá vỡ dải Bollinger Bands khi thị trường bung nén với dải mở rộng' },
    { label: 'MACD Zero Crossover', text: 'Giao dịch theo đà xu hướng khi đường MACD cắt qua mức 0 kết hợp bộ lọc EMA 50' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in">
      <div className="bg-[#10141f] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* HEADER */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-100">{t.aiStudioTitle}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono">
                  {AI_PROVIDER_MODELS[llmConfig.provider]?.name.split(' ')[0]} • {llmConfig.model}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Trading Switch */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="text-[11px] text-slate-400 font-medium">{t.autoTrading}:</span>
              <button
                onClick={() => toggleAutoTrading()}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  autoTradingEnabled
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {autoTradingEnabled ? (language === 'vi' ? 'BẬT' : 'ON') : (language === 'vi' ? 'TẮT' : 'OFF')}
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
        <div className="flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'studio'
                  ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.studioAndSandboxTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('my-strategies')}
              className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
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
              className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
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
              className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t.llmConfigTab}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden md:block">
            {t.selectedLabel}: <span className="text-slate-300 font-bold">{strategyName}</span>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4">
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
                    <span className="text-[10px] text-slate-500 font-mono">{instrument.symbol}</span>
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

                  {/* GENERATE BUTTON */}
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-98 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.generating}</span>
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
                    <li>Hỗ trợ tính toán đa chỉ báo: SMA, EMA, RSI, MACD, Bollinger Bands, ATR.</li>
                    <li>Sử dụng <code className="text-purple-300 bg-slate-950 px-1 rounded">api.buy()</code> và <code className="text-purple-300 bg-slate-950 px-1 rounded">api.sell()</code> để mở vị thế.</li>
                    <li>Sandbox chạy an toàn trong môi trường Web Worker cô lập.</li>
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
                        onClick={() => handleOpenExportModal()}
                        className="px-2.5 py-1 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                        title="Xuất chiến lược sang Bot MT4/MT5/TradingView/Python/cTrader"
                      >
                        <Download className="w-3 h-3" />
                        <span>{t.exportBotBtn || 'Xuất Bot'}</span>
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
                      <span>{t.savedToDBSuccess || 'Chiến lược đã được biên dịch và kích hoạt thành công!'}</span>
                    </div>
                  )}
                  {compileStatus === 'ERROR' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/30 px-2.5 py-1 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY STRATEGIES (DB) */}
          {activeTab === 'my-strategies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">
                  Danh sách các chiến lược định lượng đã lưu trong cơ sở dữ liệu SQLite:
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
                    title="Nhập chiến lược từ file JSON hoặc JS"
                  >
                    <Upload className="w-3 h-3 text-indigo-400" />
                    <span>{t.importStrategyBtn || 'Nhập Chiến Lược'}</span>
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
                  Chưa có chiến lược nào được lưu trong Database. Hãy tạo và bấm "{t.saveToDB}" ở tab Studio!
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
                            {new Date(strat.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2 mt-1">
                          {strat.description || 'Chiến lược tùy chỉnh không có mô tả.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleOpenExportModal({
                            id: strat.id,
                            name: strat.name,
                            description: strat.description || '',
                            code: strat.code,
                            parameters: strat.parameters || {},
                            enabled: strat.enabled ?? true,
                            createdAt: new Date(strat.createdAt).getTime()
                          })}
                          className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors"
                          title="Xuất Bot MT5/MT4/Pine/Python/cTrader"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCustomStrategy(strat.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                          title="Xóa chiến lược"
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

          {/* TAB 3: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">
                Chọn một mẫu chiến lược thuật toán kinh điển để nạp vào Sandbox Runner:
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
                        <span>Nạp Vào Studio</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LLM SETTINGS */}
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

              {/* Base URL (for custom / openai / deepseek / claude / ollama) */}
              {llmConfig.provider !== 'builtin' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">{t.llmBaseUrlLabel}</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateLLMConfig({ baseUrl: 'https://r5yym74.abc-tunnel.us/v1' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:bg-purple-900"
                      >
                        abc-tunnel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateLLMConfig({ baseUrl: 'https://api.openai.com/v1' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                    </div>
                  </div>
                  <input
                    type="text"
                    value={llmConfig.baseUrl || ''}
                    onChange={(e) => handleUpdateLLMConfig({ baseUrl: e.target.value })}
                    placeholder="https://r5yym74.abc-tunnel.us/v1"
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
                      {showApiKey ? (language === 'vi' ? 'Ẩn' : 'Hide') : (language === 'vi' ? 'Hiện' : 'Show')}
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
                  <div className={`text-xs font-mono p-2 rounded-lg border max-w-full truncate ${
                    testStatus === 'SUCCESS'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : testStatus === 'ERROR'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    {testMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="h-10 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-500 text-[11px] font-mono">
          <span>JavaScript Strategy Sandbox Engine</span>
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
