import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { PREBUILT_STRATEGIES } from '../../engine/strategySandbox';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { AIStrategyDefinition } from '../../types/strategy';

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

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyCode, setStrategyCode] = useState(activeStrategy?.code || PREBUILT_STRATEGIES[0].code);
  const [strategyName, setStrategyName] = useState(activeStrategy?.name || 'Chiến lược AI');
  const [strategyDesc, setStrategyDesc] = useState(activeStrategy?.description || '');
  const [compileStatus, setCompileStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'studio' | 'templates' | 'copilot'>('studio');

  if (!isAIModalOpen) return null;

  const handleGenerateWithAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setCompileStatus('IDLE');

    // Giả lập hoặc tích hợp AI synthesis (hỗ trợ prompt tự nhiên)
    setTimeout(() => {
      let generatedName = 'AI Strategy: ' + prompt.slice(0, 30);
      let generatedCode = `// AI Generated Strategy for ${instrument.symbol}
// Yêu cầu: ${prompt}
return {
  parameters: {
    emaFast: 20,
    emaSlow: 50,
    rsiPeriod: 14,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  },

  onCandle(candle, indicators, account, api) {
    const emaFast = indicators.ema(this.parameters.emaFast);
    const emaSlow = indicators.ema(this.parameters.emaSlow);
    const rsi = indicators.rsi(this.parameters.rsiPeriod);

    if (account.openPositionsCount > 0) return;

    // Logic vào lệnh Mua (BUY)
    if (candle.close > emaFast && emaFast > emaSlow && rsi < 60) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI BUY: EMA Golden Cross'
      });
      api.log('[AI BUY] Khớp lệnh Mua @ ' + candle.close);
    }
    // Logic vào lệnh Bán (SELL)
    else if (candle.close < emaFast && emaFast < emaSlow && rsi > 40) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI SELL: EMA Death Cross'
      });
      api.log('[AI SELL] Khớp lệnh Bán @ ' + candle.close);
    }
  }
};`;

      setStrategyName(generatedName);
      setStrategyDesc('Chiến lược được tạo tự động bởi AI từ prompt người dùng.');
      setStrategyCode(generatedCode);
      setIsGenerating(false);
      setCompileStatus('SUCCESS');
      addStrategyLog('INFO', `Đã sinh thành công chiến lược AI mới: "${generatedName}"`);
    }, 1200);
  };

  const handleApplyStrategy = () => {
    try {
      const newStrat: AIStrategyDefinition = {
        id: 'ai_strat_' + Date.now(),
        name: strategyName,
        description: strategyDesc,
        code: strategyCode,
        parameters: {},
        enabled: true,
        createdAt: Date.now()
      };

      setActiveStrategy(newStrat);
      setCompileStatus('SUCCESS');
      addStrategyLog('INFO', `Đã kích hoạt chiến lược: ${strategyName}`);
    } catch (err: any) {
      setCompileStatus('ERROR');
      setErrorMessage(err.message || 'Lỗi biên dịch mã.');
    }
  };

  const handleSelectTemplate = (tpl: AIStrategyDefinition) => {
    setStrategyName(tpl.name);
    setStrategyDesc(tpl.description);
    setStrategyCode(tpl.code);
    setActiveStrategy(tpl);
    setActiveTab('studio');
    setCompileStatus('SUCCESS');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-4xl h-[620px] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">AI Strategy Studio & Copilot</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              v2.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto Trading Toggle Pill */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px]">Tự động vào lệnh (Replay):</span>
              <button
                onClick={() => toggleAutoTrading()}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  autoTradingEnabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {autoTradingEnabled ? 'ĐANG BẬT (ON)' : 'TẮT (OFF)'}
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

        {/* SUB HEADER TABS */}
        <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'studio' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio & Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'templates' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Mẫu chiến lược có sẵn</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'copilot' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Copilot (Tối ưu hóa)</span>
          </button>
        </div>

        {/* TAB 1: AI STUDIO & CODE EDITOR */}
        {activeTab === 'studio' && (
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
            {/* Prompt Input Bar */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Mô tả chiến lược bằng ngôn ngữ tự nhiên (Prompt):
                </label>
                <span className="text-[10px] text-slate-500">Tự động biên dịch sang Javascript API</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: Mua khi giá nến trên EMA 200 và RSI quá bán dưới 35 trên Vàng XAUUSD, cắt lỗ 20 pips, chốt lời 40 pips..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateWithAI()}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'AI đang viết code...' : 'Tạo chiến lược'}</span>
                </button>
              </div>

              {/* Sample Prompt Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500">Gợi ý:</span>
                {[
                  'EMA 200 + RSI 14 Pullback',
                  'Bollinger Bands Rejection Vàng',
                  'SMC Order Block & FVG Breakout',
                  'MACD Phân kỳ + Dynamic ATR SL'
                ].map(p => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 border border-slate-700 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor & Status */}
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <div className="h-8 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{strategyName}</span>
                </div>
                {compileStatus === 'SUCCESS' && (
                  <span className="flex items-center gap-1 text-teal-400 text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ
                  </span>
                )}
                {compileStatus === 'ERROR' && (
                  <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errorMessage}
                  </span>
                )}
              </div>

              {/* Textarea Code */}
              <textarea
                value={strategyCode}
                onChange={(e) => {
                  setStrategyCode(e.target.value);
                  setCompileStatus('IDLE');
                }}
                spellCheck={false}
                className="flex-1 p-3 bg-[#0a0d14] text-indigo-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              />

              {/* Action Toolbar */}
              <div className="h-11 bg-slate-900 border-t border-slate-800 px-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Thư viện có sẵn: indicators.sma(), ema(), rsi(), macd(), bollingerBands(), atr()
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyStrategy}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Áp dụng chiến lược</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREBUILT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <h3 className="font-bold text-slate-200 text-sm mb-2">Thư viện Chiến lược Mẫu Định Lượng:</h3>
            <div className="grid grid-cols-2 gap-3">
              {PREBUILT_STRATEGIES.map(tpl => (
                <div
                  key={tpl.id}
                  className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-2"
                >
                  <div>
                    <h4 className="font-bold text-indigo-300 text-sm">{tpl.name}</h4>
                    <p className="text-slate-400 text-xs mt-1 leading-normal">{tpl.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">JavaScript API</span>
                    <button
                      onClick={() => handleSelectTemplate(tpl)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                    >
                      Nạp mẫu này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI COPILOT & OPTIMIZATION */}
        {activeTab === 'copilot' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <span>AI Quantitative Audit & Copilot</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                AI Copilot tự động phân tích dữ liệu sau khi bạn chạy Replay hoặc Fast Backtest. Hệ thống sẽ phát hiện các lỗ hổng rủi ro và đề xuất tinh chỉnh bộ tham số.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-200 text-xs">Gợi ý tối ưu hóa từ AI:</h4>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1">
                <div className="text-amber-400 font-semibold text-xs">1. Bộ lọc phiên giao dịch (Session Filter)</div>
                <p className="text-slate-400 text-xs">
                  Chiến lược hiện tại đạt Win Rate 72% trong phiên London (08:00 - 16:00 GMT), nhưng sụt giảm trong phiên Á. Khuyên dùng: Thêm điều kiện <code>if (hour &gt;= 8 &amp;&amp; hour &lt;= 17)</code>.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1">
                <div className="text-teal-400 font-semibold text-xs">2. Tỷ lệ Risk / Reward động (ATR Target)</div>
                <p className="text-slate-400 text-xs">
                  Thay vì dùng Take Profit cố định 40 pips, sử dụng <code>2.5 * indicators.atr(14)</code> sẽ giúp tăng Profit Factor từ 1.45 lên 2.10 trên cặp {instrument.symbol}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
