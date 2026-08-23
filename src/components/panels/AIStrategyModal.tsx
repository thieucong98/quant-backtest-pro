import React, { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import { PREBUILT_STRATEGIES } from '../../engine/strategySandbox';
import { AIService, AIProvider, LLMConfig, DEFAULT_LLM_CONFIG, AI_PROVIDER_MODELS } from '../../engine/aiService';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { AIStrategyDefinition } from '../../types/strategy';
import { strategiesApi } from '../../api';

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
    language
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
      addStrategyLog('SIGNAL', `[AI Copilot] Đã tạo và kích hoạt chiến lược: "${result.name}"`);
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
      setCompileStatus('SUCCESS');
      setErrorMessage('');
      addStrategyLog('INFO', `Đã kích hoạt & biên dịch chiến lược: "${strategyName}"`);
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
      setDbSaveMessage('Đã lưu vào DB thành công!');
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
    setActiveTab('studio');
    setCompileStatus('SUCCESS');
    addStrategyLog('INFO', `Đã nạp & kích hoạt chiến lược từ DB: "${loaded.name}"`);
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
    setTestMessage('Đang kết nối tới API...');

    try {
      await AIService.generateStrategy('Test connection strategy', llmConfig, 'EURUSD');
      setTestStatus('SUCCESS');
      setTestMessage(`Kết nối thành công tới ${AI_PROVIDER_MODELS[llmConfig.provider].name}!`);
    } catch (err: any) {
      setTestStatus('ERROR');
      setTestMessage(err.message || 'Không thể kết nối tới nhà cung cấp.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(strategyCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const promptSuggestions = [
    { label: 'EMA 9/21 Scalper', text: 'Chiến lược lướt sóng nhanh: Mua khi EMA 9 cắt lên EMA 21, Bán khi EMA 9 cắt xuống EMA 21 kèm SL 15pips, TP 30pips' },
    { label: 'RSI 30/70 Pullback', text: 'Mua khi RSI 14 quá bán dưới 30 và nến xanh xuất hiện; Bán khi RSI 14 quá mua trên 70 và nến đỏ xuất hiện' },
    { label: 'Bollinger Rejection', text: 'Bắt đảo chiều khi nến đâm thủng Lower Bollinger Bands rồi đóng cửa quay lại vào trong dải' },
    { label: 'MACD Momentum', text: 'Vào lệnh Mua khi MACD Histogram chuyển từ âm sang dương và MACD > Signal line' }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none p-3">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-4xl h-[670px] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">{t.aiStudioTitle}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 font-mono">
              {AI_PROVIDER_MODELS[llmConfig.provider].name.split('(')[0].trim()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto Trading Toggle Pill */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px]">{t.autoTrading}:</span>
              <button
                onClick={() => toggleAutoTrading()}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  autoTradingEnabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {autoTradingEnabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            <button
              onClick={() => setAIModalOpen(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUB TABS NAVIGATION */}
        <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'studio' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Studio & Sandbox</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('my-strategies');
                fetchMyStrategies();
              }}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'my-strategies' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Chiến Lược Của Tôi (DB)</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'templates' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-300" />
              <span>Mẫu Thuật Toán</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-300" />
              <span>Cấu Hình LLM</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">
              Đang chọn: <span className="font-bold text-slate-300">{strategyName}</span>
            </span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono">
          {/* TAB 1: STUDIO & SANDBOX */}
          {activeTab === 'studio' && (
            <div className="space-y-4">
              {/* Natural Language Prompt Input */}
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Mô tả chiến lược bằng ngôn ngữ tự nhiên:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Model: {AI_PROVIDER_MODELS[llmConfig.provider].models[0]}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateWithAI()}
                    placeholder={t.promptPlaceholder}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-sans"
                  />
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !prompt.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? t.generating : t.generateStrategy}</span>
                  </button>
                </div>

                {/* Quick Prompts */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500">Gợi ý nhanh:</span>
                  {promptSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(s.text)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-purple-300 rounded text-[10px] transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor & Strategy Meta */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <input
                      type="text"
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
                      placeholder="Tên chiến lược"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {dbSaveMessage && (
                      <span className="text-[10px] text-emerald-400 font-bold">{dbSaveMessage}</span>
                    )}

                    <button
                      onClick={handleSaveToDatabase}
                      disabled={isSavingDB}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                      title="Lưu chiến lược này vào database"
                    >
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lưu vào DB</span>
                    </button>

                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                      title="Copy mã nguồn"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={handleApplyStrategy}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Kích Hoạt & Chạy Tiếp</span>
                    </button>
                  </div>
                </div>

                {/* Strategy Codearea */}
                <div className="relative">
                  <textarea
                    value={strategyCode}
                    onChange={(e) => setStrategyCode(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300/90 leading-relaxed focus:outline-none focus:border-indigo-500 resize-none selection:bg-indigo-900"
                    spellCheck={false}
                  />
                  {compileStatus === 'SUCCESS' && (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px]">
                      <CheckCircle className="w-3 h-3" /> Đã biên dịch & Sẵn sàng chạy
                    </span>
                  )}
                  {compileStatus === 'ERROR' && (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-400 text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> {errorMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY STRATEGIES (DATABASE LIBRARY) */}
          {activeTab === 'my-strategies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    Thư Viện Chiến Lược Của Tôi (Database)
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Các chiến lược AI và thuật toán tùy chỉnh đã được lưu vĩnh viễn trong cơ sở dữ liệu.
                  </p>
                </div>
                <button
                  onClick={fetchMyStrategies}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMyStrats ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {isLoadingMyStrats ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40" />
                  Đang tải danh sách chiến lược từ Database...
                </div>
              ) : myStrategies.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                  <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Chưa có chiến lược nào được lưu trong Database. Hãy tạo và bấm "Lưu vào DB" ở tab Studio!
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
                            {new Date(strat.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2 mt-1">
                          {strat.description || 'Chiến lược tùy chỉnh không có mô tả.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
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
                          <span>Kích Hoạt & Tiếp Tục</span>
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
            <div className="max-w-xl mx-auto space-y-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-400" />
                Cấu Hình Nhà Cung Cấp Trí Tuệ Nhân Tạo (Multi-LLM)
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">AI Provider:</label>
                <select
                  value={llmConfig.provider}
                  onChange={(e) => handleUpdateLLMConfig({ provider: e.target.value as AIProvider })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                >
                  {(Object.keys(AI_PROVIDER_MODELS) as AIProvider[]).map((prov) => (
                    <option key={prov} value={prov}>
                      {AI_PROVIDER_MODELS[prov].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">API Key ({llmConfig.provider}):</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={llmConfig.apiKey || ''}
                    onChange={(e) => handleUpdateLLMConfig({ apiKey: e.target.value })}
                    placeholder={`Nhập API Key cho ${llmConfig.provider}...`}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    {showApiKey ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'TESTING'}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'TESTING' ? 'animate-spin' : ''}`} />
                  <span>Kiểm Tra Kết Nối</span>
                </button>

                {testMessage && (
                  <span className={`text-xs ${testStatus === 'SUCCESS' ? 'text-emerald-400' : testStatus === 'ERROR' ? 'text-rose-400' : 'text-slate-400'}`}>
                    {testMessage}
                  </span>
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
    </div>
  );
};
