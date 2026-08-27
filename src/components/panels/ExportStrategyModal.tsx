import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Code2,
  Sparkles,
  RefreshCw,
  Terminal,
  FileCode,
  Layers,
  HelpCircle,
  Zap,
  ExternalLink
} from 'lucide-react';
import { AIStrategyDefinition } from '../../types/strategy';
import { StrategyExporter, ExportPlatform, EXPORT_PLATFORMS } from '../../engine/strategyExporter';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { DEFAULT_LLM_CONFIG, LLMConfig } from '../../engine/aiService';
import { useAuthStore } from '../../store/authStore';

interface ExportStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: AIStrategyDefinition | null;
}

const LLM_STORAGE_KEY = 'quant_llm_config';

export const ExportStrategyModal: React.FC<ExportStrategyModalProps> = ({
  isOpen,
  onClose,
  strategy
}) => {
  const { instrument, language } = useBacktestStore();
  const t = translations[language] || translations.vi;

  const [activePlatform, setActivePlatform] = useState<ExportPlatform>('pine');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isAITranspiling, setIsAITranspiling] = useState<boolean>(false);
  const [transpileError, setTranspileError] = useState<string | null>(null);

  const [llmConfig] = useState<LLMConfig>(() => {
    try {
      const saved = localStorage.getItem(LLM_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LLM_CONFIG;
  });

  // Tự động sinh mã nguồn tương ứng khi chuyển tab hoặc nạp strategy
  useEffect(() => {
    if (!strategy) return;
    setTranspileError(null);

    switch (activePlatform) {
      case 'pine':
        setGeneratedCode(StrategyExporter.toPineScriptV5(strategy, instrument.symbol));
        break;
      case 'mql5':
        setGeneratedCode(StrategyExporter.toMQL5(strategy, instrument.symbol));
        break;
      case 'mql4':
        setGeneratedCode(StrategyExporter.toMQL4(strategy, instrument.symbol));
        break;
      case 'python':
        setGeneratedCode(StrategyExporter.toPythonCCXT(strategy, instrument.symbol));
        break;
      case 'ctrader':
        setGeneratedCode(StrategyExporter.toCTrader(strategy, instrument.symbol));
        break;
      case 'json':
        setGeneratedCode(StrategyExporter.toJSONPackage(strategy));
        break;
      default:
        setGeneratedCode(strategy.code);
    }
  }, [strategy, activePlatform, instrument.symbol]);

  if (!isOpen || !strategy) return null;

  const currentMeta = EXPORT_PLATFORMS[activePlatform];

  const handleCopy = () => {
    const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setAuthModalOpen(true, 'login');
      return;
    }
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setAuthModalOpen(true, 'login');
      return;
    }
    const filename = `${strategy.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bot${currentMeta.extension}`;
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAIDeepTranspile = async () => {
    const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setAuthModalOpen(true, 'login');
      return;
    }
    setIsAITranspiling(true);
    setTranspileError(null);
    try {
      const result = await StrategyExporter.aiTranspile(
        activePlatform,
        strategy,
        llmConfig,
        instrument.symbol
      );
      setGeneratedCode(result);
    } catch (err: any) {
      setTranspileError(err.message || t.transpileErrorFallback);
    } finally {
      setIsAITranspiling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in">
      <div className="bg-[#10141f] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* MODAL HEADER */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-100">{t.exportBotModalTitle || 'Export Strategy to Trading Bot Hub'}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono">
                  {strategy.name}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PLATFORM TABS BAR */}
        <div className="flex items-center gap-1 px-4 bg-slate-950 border-b border-slate-800 text-xs shrink-0 overflow-x-auto">
          {(Object.keys(EXPORT_PLATFORMS) as ExportPlatform[]).map((plat) => {
            const meta = EXPORT_PLATFORMS[plat];
            const isActive = activePlatform === plat;
            return (
              <button
                key={plat}
                onClick={() => setActivePlatform(plat)}
                className={`px-3.5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <span>{meta.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {meta.extension}
                </span>
              </button>
            );
          })}
        </div>

        {/* MODAL MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* Action Toolbar */}
          <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>{currentMeta.name}</span>
              </span>
              <span className="text-[11px] text-slate-500 hidden md:inline">
                • {currentMeta.description}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Deep Transpile Button */}
              {activePlatform !== 'json' && (
                <button
                  onClick={handleAIDeepTranspile}
                  disabled={isAITranspiling}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  title={t.aiDeepTranspileTooltip}
                >
                  {isAITranspiling ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isAITranspiling ? 'AI Transpiling...' : 'AI Deep Transpile'}</span>
                </button>
              )}

              {/* Copy Code Button */}
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? t.copiedCodeBtn : t.copyCodeBtn}</span>
              </button>

              {/* Download File Button */}
              <button
                onClick={handleDownload}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadCodeFileBtn.replace('{ext}', currentMeta.extension)}</span>
              </button>
            </div>
          </div>

          {transpileError && (
            <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-lg">
              {transpileError}
            </div>
          )}

          {/* CODE VIEWER BOX */}
          <div className="flex-1 min-h-[300px] relative bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="h-8 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>{strategy.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bot{currentMeta.extension}</span>
              <span>{generatedCode.split('\n').length} lines • UTF-8</span>
            </div>

            <textarea
              readOnly
              value={generatedCode}
              className="flex-1 p-3.5 bg-transparent font-mono text-xs text-emerald-300 leading-relaxed resize-none focus:outline-none selection:bg-indigo-900"
              spellCheck={false}
            />
          </div>

          {/* STEP-BY-STEP SETUP GUIDE */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span>{currentMeta.guideTitle}</span>
            </div>
            <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside font-sans pl-1">
              {currentMeta.guideSteps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="h-10 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-500 text-[11px] font-mono">
          <span>Quant Backtest Pro • Multi-Platform Bot Transpiler</span>
          <span>MetaTrader 4/5 • TradingView • Python CCXT • cTrader</span>
        </div>
      </div>
    </div>
  );
};
