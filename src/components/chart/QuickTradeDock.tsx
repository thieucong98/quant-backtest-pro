import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Plus, Scale, ChevronUp, ChevronDown } from 'lucide-react';
import { Candle, InstrumentSpec } from '../../types/market';
import { AccountState } from '../../types/order';
import { LiveTickUpdate } from '../../types/broker';
import { MultiAssetMathEngine } from '../../engine/quantMath';
import { getTranslation, formatText } from '../../i18n';
import { useBacktestStore } from '../../store/backtestStore';
import { useBrokerStore } from '../../store/brokerStore';

interface QuickTradeDockProps {
  currentCandle: Candle | null;
  currentBid: number;
  currentAsk: number;
  instrument: InstrumentSpec;
  isLiveActive: boolean;
  activeBroker: string;
  currentLiveTick?: LiveTickUpdate;
  account: AccountState;
}

export const QuickTradeDock: React.FC<QuickTradeDockProps> = ({
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

  // Quick Trade Dock State
  const [quickLot, setQuickLot] = useState<number>(0.1);
  const [useAutoSL, setUseAutoSL] = useState<boolean>(true);
  const [autoSLPips, setAutoSLPips] = useState<number>(20);
  const [useAutoTP, setUseAutoTP] = useState<boolean>(true);
  const [autoTPPips, setAutoTPPips] = useState<number>(40);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isQuickDockOpen, setIsQuickDockOpen] = useState<boolean>(true);

  const pipDollarValue = currentCandle
    ? MultiAssetMathEngine.calculatePipValue(instrument, quickLot, currentBid)
    : 10 * quickLot;

  const slRiskDollar = autoSLPips * pipDollarValue;
  const slRiskPercent = account.initialBalance > 0 ? (slRiskDollar / account.initialBalance) * 100 : 0;

  const tpGainDollar = autoTPPips * pipDollarValue;
  const tpGainPercent = account.initialBalance > 0 ? (tpGainDollar / account.initialBalance) * 100 : 0;

  const formatRiskPercent = (pct: number) => {
    if (pct === 0) return '0.00%';
    if (pct < 0.01) return pct.toFixed(3) + '%';
    return pct.toFixed(2) + '%';
  };

  const rrRatio = autoSLPips > 0 ? +(autoTPPips / autoSLPips).toFixed(2) : 0;

  const handleQuickTrade = async (side: 'BUY' | 'SELL') => {
    if (!currentCandle) return;

    let slPrice: number | undefined = undefined;
    let tpPrice: number | undefined = undefined;
    const spread = (currentLiveTick?.spread
      ? currentLiveTick.spread * (instrument.pipSize / 10)
      : instrument.defaultSpreadPips * instrument.pipSize);
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
      return;
    } else {
      executeMarketOrder(side, quickLot, slPrice, tpPrice);
      addStrategyLog(
        'INFO',
        formatText(t.quickTradeSandboxFilled, { side, lot: quickLot, symbol: instrument.symbol })
      );
    }
  };

  return (
    <div className="relative z-20 flex flex-col gap-1.5 pointer-events-auto font-mono">
      {/* LIVE STREAM STATUS RIBBON */}
      {isLiveActive && (
        <div className="bg-rose-950/90 border border-rose-500/50 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[10px] font-mono text-rose-200 shadow-xl max-w-fit animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-bold">
            LIVE • {activeBroker === 'MT5_EXNESS' ? 'EXNESS MT5' : activeBroker}
          </span>
          <span className="text-[9px] text-rose-300 border-l border-rose-800/80 pl-1 font-bold">
            SPREAD: {currentLiveTick ? (currentLiveTick.spread / 10).toFixed(1) : instrument.defaultSpreadPips}p
          </span>
        </div>
      )}

      <div className="relative flex items-center gap-1.5">
        {isQuickDockOpen ? (
          <div className="relative bg-[#101522]/90 border border-slate-800/90 backdrop-blur-md p-1 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            {/* MOBILE COMPACT STACK (< sm) */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={() => handleQuickTrade('BUY')}
                className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                title={t.buyAtAskTooltip.replace('{price}', currentAsk.toFixed(instrument.digits))}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span className="text-[10px] text-emerald-200">{currentAsk.toFixed(instrument.digits)}</span>
              </button>

              <div className="flex items-center bg-slate-900 px-1.5 py-1 rounded-md border border-slate-800 text-[10px] font-bold text-slate-200">
                {quickLot}L
              </div>

              <button
                onClick={() => handleQuickTrade('SELL')}
                className="px-2 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                title={t.sellAtBidTooltip.replace('{price}', currentBid.toFixed(instrument.digits))}
              >
                <ArrowDownRight className="w-3 h-3" />
                <span className="text-[10px] text-rose-200">{currentBid.toFixed(instrument.digits)}</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickDockOpen(false);
                  setShowSettings(false);
                }}
                className="p-1 text-slate-400 hover:text-white"
                title={t.collapseQuickTradeTooltip}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* DESKTOP ROW (sm:flex) */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* BUY BUTTON */}
              <button
                onClick={() => handleQuickTrade('BUY')}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all text-xs"
                title={t.buyAtAskTooltip.replace('{price}', currentAsk.toFixed(instrument.digits))}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span className="hidden xl:inline font-bold text-[11px]">{t.buy}</span>
                <span className="text-[10px] text-emerald-200 font-mono font-medium">
                  {currentAsk.toFixed(instrument.digits)}
                </span>
              </button>

              {/* LOT STEPPER */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-1 py-0.5">
                <button
                  onClick={() => setQuickLot(Math.max(0.01, +(quickLot - 0.01).toFixed(2)))}
                  className="p-0.5 text-slate-400 hover:text-white"
                  title={t.decreaseLotTooltip}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={quickLot}
                  onChange={(e) => setQuickLot(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-11 bg-transparent text-slate-100 font-bold text-center text-xs focus:outline-hidden"
                />
                <button
                  onClick={() => setQuickLot(+(quickLot + 0.01).toFixed(2))}
                  className="p-0.5 text-slate-400 hover:text-white"
                  title={t.increaseLotTooltip}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* SELL BUTTON */}
              <button
                onClick={() => handleQuickTrade('SELL')}
                className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all text-xs"
                title={t.sellAtBidTooltip.replace('{price}', currentBid.toFixed(instrument.digits))}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span className="hidden xl:inline font-bold text-[11px]">{t.sell}</span>
                <span className="text-[10px] text-rose-200 font-mono font-medium">
                  {currentBid.toFixed(instrument.digits)}
                </span>
              </button>

              {/* SL PILL TOGGLE */}
              <button
                type="button"
                onClick={() => setUseAutoSL(!useAutoSL)}
                className={`hidden lg:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  useAutoSL
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
                title={`SL: ${autoSLPips}p (-$${slRiskDollar.toFixed(1)})`}
              >
                SL {useAutoSL ? `${autoSLPips}p` : t.btnOff}
              </button>

              {/* TP PILL TOGGLE */}
              <button
                type="button"
                onClick={() => setUseAutoTP(!useAutoTP)}
                className={`hidden lg:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  useAutoTP
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
                title={`TP: ${autoTPPips}p (+$${tpGainDollar.toFixed(1)})`}
              >
                TP {useAutoTP ? `${autoTPPips}p` : t.btnOff}
              </button>

              {/* SETTINGS GEAR / TUNING POPOVER TOGGLE */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={t.scaleSettingsTooltip}
              >
                <Scale className="w-3.5 h-3.5" />
              </button>

              {/* COLLAPSE DOCK BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setIsQuickDockOpen(false);
                  setShowSettings(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                title={t.collapseQuickTradeTooltip}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ADVANCED RISK / REWARD & PRESET POPOVER */}
            {showSettings && (
              <div className="absolute top-10 left-0 z-50 p-2.5 rounded-xl bg-[#111622]/98 border border-slate-700/90 shadow-2xl backdrop-blur-md flex flex-col gap-2 min-w-[260px] animate-in fade-in zoom-in-95 font-mono text-xs">
                {/* Lot Presets */}
                <div className="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                  <div className="flex items-center gap-1">
                    {[0.01, 0.05, 0.1, 1.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setQuickLot(preset)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                          quickLot === preset
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SL Adjustment */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="text-rose-400 font-bold">SL ({autoSLPips}p):</span>
                    <span className="text-[10px] text-rose-300">-${slRiskDollar.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                    <button
                      onClick={() => setAutoSLPips(Math.max(1, autoSLPips - 5))}
                      className="px-1 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-8 text-center text-rose-300 font-bold">{autoSLPips}</span>
                    <button
                      onClick={() => setAutoSLPips(autoSLPips + 5)}
                      className="px-1 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* TP Adjustment */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">TP ({autoTPPips}p):</span>
                    <span className="text-[10px] text-emerald-300">+${tpGainDollar.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                    <button
                      onClick={() => setAutoTPPips(Math.max(1, autoTPPips - 5))}
                      className="px-1 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-8 text-center text-emerald-300 font-bold">{autoTPPips}</span>
                    <button
                      onClick={() => setAutoTPPips(autoTPPips + 5)}
                      className="px-1 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* R:R Presets */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">R:R:</span>
                  <div className="flex items-center gap-1">
                    {[1.5, 2.0, 3.0, 5.0].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => setAutoTPPips(Math.round(autoSLPips * mult))}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                          rrRatio === mult
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-emerald-300'
                        }`}
                      >
                        1:{mult}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#101522]/95 border border-slate-800/90 rounded-xl p-1 shadow-2xl backdrop-blur-md flex items-center gap-1 font-mono text-xs animate-in fade-in">
            {/* 1-Click Mini BUY */}
            <button
              onClick={() => handleQuickTrade('BUY')}
              className="px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-0.5 active:scale-95 transition-all shadow-xs"
              title={t.buyAtAskTooltip.replace('{price}', currentAsk.toFixed(instrument.digits))}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>{currentAsk.toFixed(instrument.digits)}</span>
            </button>

            {/* Mini Lot indicator */}
            <span className="px-1 text-[10px] font-bold text-slate-300">
              {quickLot}L
            </span>

            {/* 1-Click Mini SELL */}
            <button
              onClick={() => handleQuickTrade('SELL')}
              className="px-2 py-0.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-0.5 active:scale-95 transition-all shadow-xs"
              title={t.sellAtBidTooltip.replace('{price}', currentBid.toFixed(instrument.digits))}
            >
              <ArrowDownRight className="w-3 h-3" />
              <span>{currentBid.toFixed(instrument.digits)}</span>
            </button>

            {/* Expand Toggle */}
            <button
              onClick={() => setIsQuickDockOpen(true)}
              className="p-1 text-slate-400 hover:text-white"
              title={t.expandQuickTradeTooltip}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
