import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Plus, Scale, ChevronUp } from 'lucide-react';
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
  const [isQuickDockOpen, setIsQuickDockOpen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 640 : true
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsQuickDockOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
      {/* LIVE STREAM STATUS RIBBON */}
      {isLiveActive && (
        <div className="bg-rose-950/90 border border-rose-500/50 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-2 text-[11px] font-mono text-rose-200 shadow-xl max-w-fit animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-bold">
            🔴 LIVE STREAM • {activeBroker === 'MT5_EXNESS' ? 'EXNESS MT5' : activeBroker}
          </span>
          <span className="text-[10px] text-rose-300 border-l border-rose-800/80 pl-1.5 font-bold">
            SPREAD: {currentLiveTick ? (currentLiveTick.spread / 10).toFixed(1) : instrument.defaultSpreadPips}p
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isQuickDockOpen ? (
          <div className="bg-[#111622]/95 border border-slate-700/90 backdrop-blur-md p-2.5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 font-mono text-xs max-w-[95vw] overflow-x-auto">
            <div className="flex items-center gap-3">
              {/* BUY / SELL BUTTONS */}
              <div className="flex items-center gap-1.5">
                {/* BUY BUTTON */}
                <button
                  onClick={() => handleQuickTrade('BUY')}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex flex-col items-center justify-center shadow-lg shadow-emerald-600/25 active:scale-95 transition-all min-w-[76px]"
                  title={t.buyAtAskTooltip.replace('{price}', currentAsk.toFixed(instrument.digits))}
                >
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="font-bold text-xs">{t.buy}</span>
                  </div>
                  <span className="text-[10px] text-emerald-200 font-mono font-medium">
                    {currentAsk.toFixed(instrument.digits)}
                  </span>
                </button>

                {/* SELL BUTTON */}
                <button
                  onClick={() => handleQuickTrade('SELL')}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl flex flex-col items-center justify-center shadow-lg shadow-rose-600/25 active:scale-95 transition-all min-w-[76px]"
                  title={t.sellAtBidTooltip.replace('{price}', currentBid.toFixed(instrument.digits))}
                >
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />
                    <span className="font-bold text-xs">{t.sell}</span>
                  </div>
                  <span className="text-[10px] text-rose-200 font-mono font-medium">
                    {currentBid.toFixed(instrument.digits)}
                  </span>
                </button>
              </div>

              {/* LOT SIZE STEPPER & PRESETS */}
              <div className="flex flex-col gap-1 border-l border-slate-800/90 pl-3">
                <div className="flex items-center gap-1 bg-slate-900/95 px-1.5 py-0.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold px-0.5">LOT:</span>
                  <button
                    onClick={() => setQuickLot(Math.max(0.01, +(quickLot - 0.01).toFixed(2)))}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
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
                    className="w-14 bg-transparent text-slate-100 font-bold text-center text-xs focus:outline-hidden"
                  />
                  <button
                    onClick={() => setQuickLot(+(quickLot + 0.01).toFixed(2))}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title={t.increaseLotTooltip}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1">
                  {[0.01, 0.05, 0.1, 1.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQuickLot(preset)}
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all ${
                        quickLot === preset
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* AUTO SL / TP TOGGLES WITH LIVE DOLLAR RISK */}
              <div className="flex items-center gap-3 border-l border-slate-800/90 pl-3">
                {/* SL Control */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoSL}
                        onChange={(e) => setUseAutoSL(e.target.checked)}
                        className="accent-rose-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-rose-400">SL</span>
                    </label>

                    {useAutoSL && (
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                        <button
                          onClick={() => setAutoSLPips(Math.max(1, autoSLPips - 5))}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          value={autoSLPips}
                          onChange={(e) => setAutoSLPips(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-transparent text-rose-400 font-bold text-[11px] text-center focus:outline-hidden"
                        />
                        <button
                          onClick={() => setAutoSLPips(autoSLPips + 5)}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] text-slate-500 pr-1">pips</span>
                      </div>
                    )}
                  </div>
                  {useAutoSL && (
                    <span className="text-[9px] font-mono text-rose-400/90 pl-5">
                      -${slRiskDollar.toFixed(1)} ({formatRiskPercent(slRiskPercent)})
                    </span>
                  )}
                </div>

                {/* TP Control */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoTP}
                        onChange={(e) => setUseAutoTP(e.target.checked)}
                        className="accent-emerald-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-emerald-400">TP</span>
                    </label>

                    {useAutoTP && (
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                        <button
                          onClick={() => setAutoTPPips(Math.max(1, autoTPPips - 5))}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          value={autoTPPips}
                          onChange={(e) => setAutoTPPips(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-transparent text-emerald-400 font-bold text-[11px] text-center focus:outline-hidden"
                        />
                        <button
                          onClick={() => setAutoTPPips(autoTPPips + 5)}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] text-slate-500 pr-1">pips</span>
                      </div>
                    )}
                  </div>
                  {useAutoTP && (
                    <span className="text-[9px] font-mono text-emerald-400/90 pl-5">
                      +${tpGainDollar.toFixed(1)} (+{formatRiskPercent(tpGainPercent)})
                    </span>
                  )}
                </div>
              </div>

              {/* R:R RATIO BADGE & 1-CLICK PRESETS */}
              {useAutoSL && useAutoTP && (
                <div className="flex flex-col gap-1 border-l border-slate-800/90 pl-3">
                  {/* Dynamic R:R Badge */}
                  <div
                    className={`px-2 py-0.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 shadow-xs ${
                      rrRatio >= 2.0
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : rrRatio >= 1.0
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40 animate-pulse'
                    }`}
                    title={t.riskRewardRatioTooltip.replace('{ratio}', rrRatio.toString())}
                  >
                    <Scale className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] text-slate-400">R:R</span>
                    <span className="font-bold">1 : {rrRatio}</span>
                  </div>

                  {/* 1-Click R:R Target Presets */}
                  <div className="flex items-center gap-1">
                    {[1.5, 2.0, 3.0, 5.0].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => setAutoTPPips(Math.round(autoSLPips * mult))}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all ${
                          rrRatio === mult
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-emerald-300'
                        }`}
                        title={t.autoSetTPRRTooltip
                          .replace('{mult}', mult.toString())
                          .replace('{pips}', Math.round(autoSLPips * mult).toString())}
                      >
                        1:{mult}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COLLAPSE DOCK BUTTON */}
              <button
                onClick={() => setIsQuickDockOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
                title={t.collapseQuickTradeTooltip}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsQuickDockOpen(true)}
            className="bg-[#111622]/95 border border-slate-700/90 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md hover:bg-slate-800 text-xs font-bold font-mono text-slate-200 transition-all hover:scale-105"
            title={t.expandQuickTradeTooltip}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.quickTrade}</span>
            <span className="text-slate-400 font-normal">({quickLot}L)</span>
          </button>
        )}
      </div>
    </div>
  );
};
