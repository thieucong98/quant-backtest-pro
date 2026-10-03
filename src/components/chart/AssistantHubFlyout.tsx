import React from 'react';
import { BrainCircuit, Layers, Shield, Bot, X, ExternalLink, ChevronRight, Activity } from 'lucide-react';
import { getTranslation } from '../../i18n';
import { useBacktestStore } from '../../store/backtestStore';

interface AssistantHubFlyoutProps {
  onClose: () => void;
  onSelectAssistant: (panel: 'copilot' | 'mtf' | 'propfirm') => void;
  smcMtf?: any;
  isPropFirmMode: boolean;
  autoTradingEnabled: boolean;
  currentStrategyName?: string;
  botProfit?: number;
}

export const AssistantHubFlyout: React.FC<AssistantHubFlyoutProps> = ({
  onClose,
  onSelectAssistant,
  smcMtf,
  isPropFirmMode,
  autoTradingEnabled,
  currentStrategyName,
  botProfit = 0
}) => {
  const language = useBacktestStore((s) => s.language);
  const setAIModalOpen = useBacktestStore((s) => s.setAIModalOpen);
  const toggleAutoTrading = useBacktestStore((s) => s.toggleAutoTrading);
  const t = getTranslation(language);

  return (
    <div className="w-[320px] bg-[#0f1422]/95 border border-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-3 font-mono text-xs select-none flex flex-col gap-2.5 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-xs">{t.assistantHub}</h4>
            <p className="text-[10px] text-slate-400 font-sans">{t.assistantHubDesc}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Module 1: AI Bot Strategy */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-slate-200 text-[11px]">AI Strategy Bot</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              autoTradingEnabled
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {autoTradingEnabled ? t.statusOn : t.statusOff}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate max-w-[170px] text-slate-300">
            {currentStrategyName || 'EMA Scalper'}
          </span>
          <span
            className={`font-bold font-mono ${
              botProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {botProfit >= 0 ? '+' : ''}${botProfit.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
          <button
            onClick={() => toggleAutoTrading()}
            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
              autoTradingEnabled
                ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900'
                : 'bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:bg-purple-900'
            }`}
          >
            {autoTradingEnabled ? t.btnOff : t.btnOn}
          </button>
          <button
            onClick={() => {
              setAIModalOpen(true);
              onClose();
            }}
            className="flex items-center justify-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] transition-colors"
          >
            <span>Studio</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Module 2: Apex AI Copilot */}
      <button
        onClick={() => onSelectAssistant('copilot')}
        className="w-full bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-2.5 flex items-center justify-between transition-all group text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200 text-[11px]">Apex AI Copilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Smart Money Concepts & Orderflow Bias
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
      </button>

      {/* Module 3: MTF Matrix */}
      <button
        onClick={() => onSelectAssistant('mtf')}
        className="w-full bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 rounded-xl p-2.5 flex items-center justify-between transition-all group text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200 text-[11px]">MTF Matrix</span>
              {smcMtf?.bias?.h4 && (
                <span
                  className={`text-[10px] font-black ${
                    smcMtf.bias.h4 === 'BULLISH'
                      ? 'text-emerald-400'
                      : smcMtf.bias.h4 === 'BEARISH'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {smcMtf.bias.h4 === 'BULLISH' ? '▲ H4 BULL' : smcMtf.bias.h4 === 'BEARISH' ? '▼ H4 BEAR' : '■ H4 FLAT'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Multi-Timeframe Trend Alignment (H4-M5)
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
      </button>

      {/* Module 4: Prop Firm (If active) */}
      {isPropFirmMode && (
        <button
          onClick={() => onSelectAssistant('propfirm')}
          className="w-full bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between transition-all group text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-200 text-[11px]">Prop Firm Shield</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Realtime Daily Drawdown & Equity Rules
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </button>
      )}
    </div>
  );
};
