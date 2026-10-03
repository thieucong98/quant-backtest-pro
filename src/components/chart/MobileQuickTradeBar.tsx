import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Plus, Scale, ChevronUp, ChevronDown } from 'lucide-react';
import { Candle, InstrumentSpec } from '../../types/market';
import { AccountState } from '../../types/order';
import { LiveTickUpdate } from '../../types/broker';
import { MultiAssetMathEngine } from '../../engine/quantMath';
import { getTranslation, formatText } from '../../i18n';
import { useBacktestStore } from '../../store/backtestStore';
import { useBrokerStore } from '../../store/brokerStore';

interface MobileQuickTradeBarProps {
  currentCandle: Candle | null;
  currentBid: number;
  currentAsk: number;
  instrument: InstrumentSpec;
  isLiveActive: boolean;
  activeBroker: string;
  currentLiveTick?: LiveTickUpdate;
  account: AccountState;
}

export const MobileQuickTradeBar: React.FC<MobileQuickTradeBarProps> = ({
  currentCandle,
  currentBid,
  currentAsk,
  instrument,
  isLiveActive,
  activeBroker,
  currentLiveTick,
  account
}) => {
  const language = useBacktestStore((s) => s.language);
  const executeMarketOrder = useBacktestStore((s) => s.executeMarketOrder);
  const addStrategyLog = useBacktestStore((s) => s.addStrategyLog);

  const brokerStatus = useBrokerStore((s) => s.connectionStatus);
  const executeLiveMarketOrder = useBrokerStore((s) => s.executeLiveMarketOrder);

  const t = getTranslation(language);

  // Execution parameters state
  const [quickLot, setQuickLot] = useState<number>(0.1);
  const [useAutoSL, setUseAutoSL] = useState<boolean>(true);
  const [autoSLPips, setAutoSLPips] = useState<number>(20);
  const [useAutoTP, setUseAutoTP] = useState<boolean>(true);
  const [autoTPPips, setAutoTPPips] = useState<number>(40);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const pipDollarValue = currentCandle
    ? MultiAssetMathEngine.calculatePipValue(instrument, quickLot, currentBid)
    : 10 * quickLot;

  const slRiskDollar = autoSLPips * pipDollarValue;
  const tpGainDollar = autoTPPips * pipDollarValue;
  const rrRatio = autoSLPips > 0 ? +(autoTPPips / autoSLPips).toFixed(2) : 0;

  const handleQuickTrade = async (side: 'BUY' | 'SELL') => {
    if (!currentCandle) return;

    let slPrice: number | undefined = undefined;
    let tpPrice: number | undefined = undefined;
    const spread = currentLiveTick?.spread
      ? currentLiveTick.spread * (instrument.pipSize / 10)
      : instrument.defaultSpreadPips * instrument.pipSize;
    const execPrice =
      side === 'BUY'
        ? currentLiveTick?.ask || currentCandle.close + spread
        : currentLiveTick?.bid || currentCandle.close;

    if (useAutoSL) {
      const slDist = autoSLPips * instrument.pipSize;
      const rawSL = side === 'BUY' ? execPrice - slDist : execPrice + slDist;
      slPrice = Number(rawSL.toFixed(instrument.digits));
    }

    if (useAutoTP) {
      const tpDist = autoTPPips * instrument.pipSize;
      const rawTP = side === 'BUY' ? execPrice + tpDist : execPrice - tpDist;
      tpPrice = Number(rawTP.toFixed(instrument.digits));
    }

    if (isLiveActive && brokerStatus === 'CONNECTED') {
      const res = await executeLiveMarketOrder(instrument.symbol, side, quickLot, slPrice, tpPrice);
      if (res.success) {
        addStrategyLog(
          'INFO',
          formatText(t.quickTradeLiveFilled, {
            side,
            lot: quickLot,
            symbol: instrument.symbol,
            ticket: res.ticket || 'OK'
          })
        );
      } else {
        alert(formatText(t.quickTradeLiveFailed, { side, message: res.message || 'Error' }));
      }
    } else {
      executeMarketOrder(side, quickLot, slPrice, tpPrice);
      addStrategyLog(
        'INFO',
        formatText(t.quickTradeSandboxFilled, { side, lot: quickLot, symbol: instrument.symbol })
      );
    }
  };

  if (isMinimized) {
    return (
      <div className="flex justify-center w-full select-none">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-[#0e1320]/95 border border-slate-700/90 text-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-xl text-xs font-mono font-bold active:scale-95 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t.mobileTradingSheet}</span>
          <span className="text-slate-400 font-normal">({quickLot}L)</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0d121d]/95 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl font-mono select-none flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2">
      {/* 1. TOP UTILITY ROW: Risk indicators & Minimizer */}
      <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          {/* Spread */}
          <span className="font-bold text-slate-300">
            {instrument.symbol} • SPREAD:{' '}
            <span className="text-amber-400 font-semibold">
              {currentLiveTick ? (currentLiveTick.spread / 10).toFixed(1) : instrument.defaultSpreadPips}p
            </span>
          </span>

          {/* SL/TP Chips */}
          <button
            onClick={() => setUseAutoSL(!useAutoSL)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
              useAutoSL ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-500'
            }`}
          >
            SL: {useAutoSL ? `${autoSLPips}p` : 'OFF'}
          </button>
          <button
            onClick={() => setUseAutoTP(!useAutoTP)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
              useAutoTP ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-500'
            }`}
          >
            TP: {useAutoTP ? `${autoTPPips}p` : 'OFF'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Settings / Risk Popover Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-md transition-colors ${
              showSettings ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.quickTrade}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => {
              setIsMinimized(true);
              setShowSettings(false);
            }}
            className="p-1 text-slate-400 hover:text-white"
            title={t.collapseQuickTradeTooltip}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. SETTINGS ACCORDION (If open) */}
      {showSettings && (
        <div className="bg-[#121826] border border-slate-700/80 rounded-xl p-2 flex flex-col gap-2 text-xs">
          {/* Lot Presets */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold">{t.mobileLotPicker}:</span>
            <div className="flex items-center gap-1">
              {[0.01, 0.05, 0.1, 0.5, 1.0].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setQuickLot(preset)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    quickLot === preset
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* R:R Multipliers */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
            <span className="text-[10px] text-slate-400 font-bold">R:R (Risk/Reward):</span>
            <div className="flex items-center gap-1">
              {[1.5, 2.0, 3.0, 5.0].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setAutoTPPips(Math.round(autoSLPips * mult))}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    rrRatio === mult
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1:{mult}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRIMARY EXECUTION ROW: Green BUY (42%) | LOT (16%) | Red SELL (42%) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* BUY BUTTON */}
        <button
          onClick={() => handleQuickTrade('BUY')}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl py-2 px-2.5 flex flex-col items-center justify-center shadow-lg shadow-emerald-950/60 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1 font-black text-xs tracking-wide">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t.mobileQuickBuy}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-100 font-bold">
            {currentAsk.toFixed(instrument.digits)}
          </span>
        </button>

        {/* LOT CONTROLLER */}
        <div className="flex flex-col items-center justify-center bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-1 min-w-[76px]">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.lotSize}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onClick={() => setQuickLot(Math.max(0.01, +(quickLot - 0.01).toFixed(2)))}
              className="p-1 text-slate-400 hover:text-white active:scale-90"
              title={t.decreaseLotTooltip}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-slate-100 text-xs font-mono">{quickLot}</span>
            <button
              onClick={() => setQuickLot(+(quickLot + 0.01).toFixed(2))}
              className="p-1 text-slate-400 hover:text-white active:scale-90"
              title={t.increaseLotTooltip}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* SELL BUTTON */}
        <button
          onClick={() => handleQuickTrade('SELL')}
          className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-400 text-white rounded-xl py-2 px-2.5 flex flex-col items-center justify-center shadow-lg shadow-rose-950/60 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1 font-black text-xs tracking-wide">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{t.mobileQuickSell}</span>
          </div>
          <span className="text-[11px] font-mono text-rose-100 font-bold">
            {currentBid.toFixed(instrument.digits)}
          </span>
        </button>
      </div>
    </div>
  );
};
