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
  Cpu
} from 'lucide-react';
import { PREBUILT_STRATEGIES } from '../../engine/strategySandbox';
import { AIService, AIProvider, LLMConfig, DEFAULT_LLM_CONFIG, AI_PROVIDER_MODELS } from '../../engine/aiService';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { AIStrategyDefinition } from '../../types/strategy';

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

  const [activeTab, setActiveTab] = useState<'studio' | 'templates' | 'settings'>('studio');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyCode, setStrategyCode] = useState(activeStrategy?.code || PREBUILT_STRATEGIES[0].code);
  const [strategyName, setStrategyName] = useState(activeStrategy?.name || 'EMA 9/21 Fast Scalper');
  const [strategyDesc, setStrategyDesc] = useState(activeStrategy?.description || '');
  const [compileStatus, setCompileStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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
        id: 'strat_' + Date.now(),
        name: strategyName,
        description: strategyDesc,
        code: strategyCode,
        parameters: {},
        enabled: true,
        createdAt: Date.now()
      };

      setActiveStrategy(newStrat);
      setCompileStatus('SUCCESS');
      setErrorMessage('');
      addStrategyLog('INFO', `Đã kích hoạt chiến lược: "${strategyName}"`);
    } catch (err: any) {
      setCompileStatus('ERROR');
      setErrorMessage(err.message || 'Lỗi cú pháp chiến lược.');
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
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col overflow-hidden text-xs">
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
                {autoTradingEnabled ? 'BẬT (ON)' : 'TẮT (OFF)'}
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

        {/* TABS NAVIGATION */}
        <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'studio' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI Copilot Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'templates' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Thư viện Mẫu Chiến lược ({PREBUILT_STRATEGIES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Cấu hình AI Provider & LLM</span>
          </button>
        </div>

        {/* TAB 1: STUDIO */}
        {activeTab === 'studio' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden gap-3 font-mono">
            {/* Prompt bar */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-300 text-xs">
                <span className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Mô tả chiến lược giao dịch bằng tiếng Việt / tiếng Anh:
                </span>
                <span className="text-[10px] text-slate-500">
                  Tài sản áp dụng: <b className="text-indigo-400">{instrument.symbol}</b>
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateWithAI(); }}
                  placeholder="Ví dụ: Chiến lược EMA 9 cắt EMA 21 kết hợp RSI quá bán dưới 35 kèm SL 20pips, TP 40pips..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-sans"
                />
                <button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? t.generating : t.generateStrategy}</span>
                </button>
              </div>

              {/* Prompt Suggestions Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500">Gợi ý:</span>
                {promptSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sug.text)}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-purple-300 rounded border border-slate-800 transition-colors"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor & Strategy Details */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
              {/* Editor Bar */}
              <div className="h-8 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    className="bg-transparent text-slate-200 font-bold focus:outline-none border-b border-transparent hover:border-slate-700 w-64 text-xs font-mono"
                    title="Bấm để đổi tên chiến lược"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:text-slate-200 flex items-center gap-1 text-[10px]"
                    title="Sao chép mã nguồn"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Đã chép' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Textarea Code */}
              <textarea
                value={strategyCode}
                onChange={(e) => setStrategyCode(e.target.value)}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-slate-300 font-mono text-xs focus:outline-none resize-none leading-relaxed overflow-y-auto selection:bg-purple-900 selection:text-white"
              />

              {/* Status footer */}
              <div className="h-9 bg-slate-900/80 border-t border-slate-800 px-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px]">
                  {compileStatus === 'SUCCESS' && (
                    <span className="text-teal-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Chiến lược hợp lệ & đang kích hoạt!
                    </span>
                  )}
                  {compileStatus === 'ERROR' && (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errorMessage}
                    </span>
                  )}
                  {compileStatus === 'IDLE' && (
                    <span className="text-slate-500">Mã nguồn sẵn sàng để chạy trên Sandbox</span>
                  )}
                </div>

                <button
                  onClick={handleApplyStrategy}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors shadow"
                >
                  Áp dụng & Kích hoạt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREBUILT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono">
            <div className="text-slate-300 text-xs font-semibold mb-1">
              Chọn chiến lược mẫu được tối ưu hóa sẵn cho dữ liệu Replay:
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PREBUILT_STRATEGIES.map(tpl => (
                <div
                  key={tpl.id}
                  className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-purple-500/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-100 text-xs">{tpl.name}</span>
                      <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 text-[10px] rounded border border-purple-500/30">
                        {tpl.id.split('_')[1]?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Lot: 0.1 | SL: 15-25p</span>
                    <button
                      onClick={() => handleSelectTemplate(tpl)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition-colors"
                    >
                      Nạp chiến lược này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-LLM PROVIDER SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Cấu hình Nhà cung cấp Trí Tuệ Nhân Tạo (AI Provider)
              </h4>

              {/* Provider Selector */}
              <div>
                <label className="block text-slate-400 mb-1.5">Chọn AI Provider:</label>
                <select
                  value={llmConfig.provider}
                  onChange={(e) => {
                    const p = e.target.value as AIProvider;
                    handleUpdateLLMConfig({
                      provider: p,
                      model: AI_PROVIDER_MODELS[p].models[0],
                      baseUrl: AI_PROVIDER_MODELS[p].defaultBaseUrl || ''
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="builtin">Built-in Quant AI Synthesizer (Offline - Miễn phí không cần API Key)</option>
                  <option value="gemini">Google Gemini AI (Gemini 1.5 Flash / Pro)</option>
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini, o1-mini)</option>
                  <option value="deepseek">DeepSeek AI (deepseek-chat, deepseek-coder)</option>
                  <option value="claude">Anthropic Claude (Claude 3.5 Sonnet / Haiku)</option>
                  <option value="ollama">Local Ollama (Chạy LLM trên máy tính cá nhân)</option>
                </select>
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-slate-400 mb-1.5">Mô hình (Model):</label>
                <select
                  value={llmConfig.model}
                  onChange={(e) => handleUpdateLLMConfig({ model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {AI_PROVIDER_MODELS[llmConfig.provider].models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* API Key (nếu không phải builtin) */}
              {llmConfig.provider !== 'builtin' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-400">
                      API Key ({AI_PROVIDER_MODELS[llmConfig.provider].name.split('(')[0].trim()}):
                    </label>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      {showApiKey ? 'Ẩn Key' : 'Hiện Key'}
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={llmConfig.apiKey}
                      onChange={(e) => handleUpdateLLMConfig({ apiKey: e.target.value })}
                      placeholder={llmConfig.provider === 'ollama' ? 'Không bắt buộc với Ollama' : 'Nhập sk-... hoặc AIza...'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Base URL (cho Local / Proxies / OpenRouter) */}
              {llmConfig.provider !== 'builtin' && (
                <div>
                  <label className="block text-slate-400 mb-1.5">API Base URL (Tùy chỉnh Proxy / OpenRouter / Ollama):</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={llmConfig.baseUrl || ''}
                      onChange={(e) => handleUpdateLLMConfig({ baseUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1 hoặc http://localhost:11434"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Temperature */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Độ sáng tạo (Temperature):</label>
                  <span className="text-purple-300 font-bold">{llmConfig.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={llmConfig.temperature}
                  onChange={(e) => handleUpdateLLMConfig({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Test Connection Button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'TESTING'}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${testStatus === 'TESTING' ? 'animate-spin' : ''}`} />
                  <span>Kiểm tra kết nối API</span>
                </button>

                <div className="text-[11px]">
                  {testStatus === 'SUCCESS' && <span className="text-teal-400 font-bold">{testMessage}</span>}
                  {testStatus === 'ERROR' && <span className="text-rose-400 font-bold">{testMessage}</span>}
                  {testStatus === 'TESTING' && <span className="text-slate-400">Đang thử nghiệm kết nối...</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
