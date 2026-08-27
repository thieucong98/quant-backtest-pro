import React, { useState } from 'react';
import {
  BrainCircuit,
  Play,
  Pause,
  Flame,
  Settings2,
  ChevronUp,
  ChevronDown,
  Activity,
  Zap,
  TrendingUp,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

export const AIBotHUD: React.FC = () => {
  const {
    activeStrategy,
    autoTradingEnabled,
    toggleAutoTrading,
    setAIModalOpen,
    openPositions,
    closedPositions,
    instrument,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.vi;
  const [isMinimized, setIsMinimized] = useState(true);

  // Chỉ hiển thị khi có activeStrategy
  if (!activeStrategy) return null;

  // Tính toán PnL của các lệnh do bot mở
  const botClosedTrades = closedPositions.filter(
    (p) => p.comment?.toLowerCase().includes('ai') || p.comment?.toLowerCase().includes('opt')
  );
  const botRealizedPnL = botClosedTrades.reduce((sum, p) => sum + (p.realizedPnL || 0), 0);
  const botWinTrades = botClosedTrades.filter((p) => (p.realizedPnL || 0) > 0).length;
  const botWinRate = botClosedTrades.length > 0 ? (botWinTrades / botClosedTrades.length) * 100 : 0;

  const botOpenTrades = openPositions.filter(
    (p) => p.comment?.toLowerCase().includes('ai') || p.comment?.toLowerCase().includes('opt')
  );
  const botFloatingPnL = botOpenTrades.reduce((sum, p) => sum + (p.floatingPnL || 0), 0);

  const isHoldingPosition = botOpenTrades.length > 0;

  return (
    <div className="w-full flex justify-end font-sans select-none animate-in fade-in duration-200">
      {/* MINIMIZED PILL VIEW */}
      {isMinimized ? (
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111622]/95 hover:bg-slate-900 border border-purple-500/40 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] group"
          title={t.botExpandInfoTooltip}
        >
          <div className="relative flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            {autoTradingEnabled && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-200 font-mono truncate max-w-[120px]">
            {activeStrategy.name}
          </span>
          <span
            className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
              botRealizedPnL >= 0
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}
          >
            {botRealizedPnL >= 0 ? '+' : ''}${botRealizedPnL.toFixed(1)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
        </div>
      ) : (
        /* EXPANDED DETAILED HUD CARD */
        <div className="w-[300px] rounded-xl bg-[#111622]/95 hover:bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
          {/* HEADER */}
          <div className="px-3 py-2 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-indigo-950/60 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs shadow-purple-500/40">
                <BrainCircuit className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-100 truncate block">
                  {activeStrategy.name}
                </span>
                <span className="text-[9px] text-purple-300 font-mono block">
                  {instrument.symbol} • Auto-Trading
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition-colors"
                title={t.botCollapseTooltip}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BODY METRICS */}
          <div className="p-2.5 space-y-2 text-xs">
            {/* STATUS BADGE ROW */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoTradingEnabled
                      ? isHoldingPosition
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-emerald-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-[10px] font-mono font-bold text-slate-300">
                  {autoTradingEnabled
                    ? isHoldingPosition
                      ? t.botHoldingPosition
                      : t.botWaitingSignal
                    : t.botPaused}
                </span>
              </div>

              {/* TOGGLE AUTO SWITCH */}
              <button
                onClick={() => toggleAutoTrading()}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all flex items-center gap-1 shadow-xs ${
                  autoTradingEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {autoTradingEnabled ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5" />}
                <span>{autoTradingEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* PERFORMANCE TILES */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80 text-center">
                <span className="text-[9px] text-slate-500 block uppercase">{t.tradesCol}</span>
                <span className="text-xs font-bold font-mono text-slate-200">{botClosedTrades.length}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80 text-center">
                <span className="text-[9px] text-slate-500 block uppercase">Win Rate</span>
                <span className="text-xs font-bold font-mono text-slate-200">{botWinRate.toFixed(0)}%</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80 text-center">
                <span className="text-[9px] text-slate-500 block uppercase">Net PnL</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    botRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {botRealizedPnL >= 0 ? '+' : ''}${botRealizedPnL.toFixed(1)}
                </span>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setAIModalOpen(true, 'studio')}
                className="flex-1 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>Studio</span>
              </button>
              <button
                onClick={() => setAIModalOpen(true, 'optimizer')}
                className="flex-1 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Flame className="w-3 h-3 text-emerald-400" />
                <span>{t.optimizerTab}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
