import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Shield, Target, X, Zap, ArrowUpRight, ArrowDownRight, MoveVertical } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { useBrokerStore } from '../../store/brokerStore';
import { InstrumentSpec } from '../../types/market';
import { MultiAssetMathEngine } from '../../engine/quantMath';
import { getTranslation } from '../../i18n';

interface VisualChartTradingOverlayProps {
  chartApi: IChartApi | null;
  seriesApi: ISeriesApi<any> | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  instrument: InstrumentSpec;
}

interface DraggingState {
  type: 'SL' | 'TP';
  positionId: string | number;
  isLive: boolean;
  startY: number;
  currentY: number;
  currentPrice: number;
  entryPrice: number;
  side: 'BUY' | 'SELL';
  lotSize: number;
}

export const VisualChartTradingOverlay: React.FC<VisualChartTradingOverlayProps> = ({
  chartApi,
  seriesApi,
  containerRef,
  instrument
}) => {
  const {
    openPositions: backtestPositions,
    modifyPositionSLTP: modifyBacktestSLTP,
    setBreakeven: setBacktestBE,
    partialClose: partialCloseBacktest,
    closePosition: closeBacktestPosition,
    account: backtestAccount,
    language
  } = useBacktestStore();

  const t = getTranslation(language);

  const {
    isLiveTradingMode,
    connectionStatus,
    positions: livePositions,
    modifyLiveSLTP,
    setLiveBreakeven,
    partialCloseLive,
    closeLivePosition,
    account: liveAccount
  } = useBrokerStore();

  const isLiveActive = isLiveTradingMode && connectionStatus === 'CONNECTED';

  // Combine positions depending on mode (Memoized to prevent render loops)
  const activePositions = React.useMemo(() => {
    return isLiveActive
      ? livePositions.map((p) => ({
          id: String(p.ticket),
          ticket: p.ticket,
          symbol: p.symbol,
          side: p.side,
          lotSize: p.lotSize,
          entryPrice: p.openPrice,
          currentPrice: p.currentPrice,
          stopLoss: p.sl,
          takeProfit: p.tp,
          floatingPnL: p.floatingPnL,
          isLive: true
        }))
      : backtestPositions
          .filter((p) => p.symbol === instrument.symbol)
          .map((p) => ({
            id: p.id,
            ticket: p.id,
            symbol: p.symbol,
            side: p.side,
            lotSize: p.lotSize,
            entryPrice: p.entryPrice,
            currentPrice: p.highestPriceSinceOpen, // or current
            stopLoss: p.stopLoss,
            takeProfit: p.takeProfit,
            floatingPnL: p.floatingPnL,
            isLive: false
          }));
  }, [isLiveActive, livePositions, backtestPositions, instrument.symbol]);

  const [coords, setCoords] = useState<
    Record<
      string,
      {
        entryY: number | null;
        slY: number | null;
        tpY: number | null;
      }
    >
  >({});

  const [dragging, setDragging] = useState<DraggingState | null>(null);

  // Update Y pixel coordinates from seriesApi price
  const updateCoordinates = useCallback(() => {
    if (!seriesApi || !chartApi || !containerRef.current) return;

    const newCoords: Record<string, { entryY: number | null; slY: number | null; tpY: number | null }> = {};

    activePositions.forEach((pos) => {
      const entryY = seriesApi.priceToCoordinate(pos.entryPrice);
      const slY = pos.stopLoss ? seriesApi.priceToCoordinate(pos.stopLoss) : null;
      const tpY = pos.takeProfit ? seriesApi.priceToCoordinate(pos.takeProfit) : null;

      newCoords[pos.id] = { entryY, slY, tpY };
    });

    setCoords((prev) => {
      const prevKeys = Object.keys(prev);
      const newKeys = Object.keys(newCoords);
      if (prevKeys.length !== newKeys.length) return newCoords;
      for (const k of newKeys) {
        if (
          !prev[k] ||
          prev[k].entryY !== newCoords[k].entryY ||
          prev[k].slY !== newCoords[k].slY ||
          prev[k].tpY !== newCoords[k].tpY
        ) {
          return newCoords;
        }
      }
      return prev;
    });
  }, [seriesApi, chartApi, activePositions, containerRef]);

  // Hook into chart scroll and zoom events
  useEffect(() => {
    if (!chartApi) return;
    updateCoordinates();

    const timeScale = chartApi.timeScale();
    timeScale.subscribeVisibleTimeRangeChange(updateCoordinates);
    timeScale.subscribeVisibleLogicalRangeChange(updateCoordinates);

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(updateCoordinates);
      timeScale.unsubscribeVisibleLogicalRangeChange(updateCoordinates);
    };
  }, [chartApi, updateCoordinates]);

  // Mouse drag handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'SL' | 'TP',
    pos: (typeof activePositions)[0]
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!seriesApi || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    const initialPrice = type === 'SL' ? pos.stopLoss || pos.entryPrice : pos.takeProfit || pos.entryPrice;

    setDragging({
      type,
      positionId: pos.id,
      isLive: pos.isLive,
      startY: currentY,
      currentY,
      currentPrice: initialPrice,
      entryPrice: pos.entryPrice,
      side: pos.side,
      lotSize: pos.lotSize
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !seriesApi || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newY = Math.max(10, Math.min(rect.height - 10, e.clientY - rect.top));
      const price = seriesApi.coordinateToPrice(newY);

      if (price !== null && !isNaN(price)) {
        const roundedPrice = Number(price.toFixed(instrument.digits));
        setDragging((prev) => (prev ? { ...prev, currentY: newY, currentPrice: roundedPrice } : null));
      }
    },
    [dragging, seriesApi, containerRef, instrument.digits]
  );

  const handleMouseUp = useCallback(async () => {
    if (!dragging) return;

    const { positionId, type, currentPrice, isLive } = dragging;
    const targetPos = activePositions.find((p) => p.id === positionId);

    if (targetPos) {
      const newSL = type === 'SL' ? currentPrice : targetPos.stopLoss;
      const newTP = type === 'TP' ? currentPrice : targetPos.takeProfit;

      if (isLive) {
        await modifyLiveSLTP(targetPos.ticket, newSL, newTP);
      } else {
        modifyBacktestSLTP(String(positionId), newSL, newTP);
      }
    }

    setDragging(null);
    updateCoordinates();
  }, [dragging, activePositions, modifyLiveSLTP, modifyBacktestSLTP, updateCoordinates]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  if (activePositions.length === 0 && !dragging) return null;

  const currentBalance = isLiveActive
    ? liveAccount?.balance || 10000
    : backtestAccount.balance;

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {/* 1. Render Position Overlays */}
      {activePositions.map((pos) => {
        const posCoord = coords[pos.id];
        if (!posCoord || posCoord.entryY === null) return null;

        const isBuy = pos.side === 'BUY';
        const pnl = pos.floatingPnL;
        const isProfit = pnl >= 0;

        return (
          <div key={pos.id} className="absolute inset-x-0">
            {/* ENTRY PRICE BAR */}
            <div
              className="absolute left-0 right-14 flex items-center justify-between pointer-events-auto select-none transition-all duration-75 group"
              style={{ top: `${posCoord.entryY - 12}px` }}
            >
              {/* Left Badge: Type & Lot */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-r shadow-md text-[11px] font-mono font-bold text-white border-l-2 ${
                  isBuy
                    ? 'bg-sky-950/90 border-sky-400 text-sky-200'
                    : 'bg-rose-950/90 border-rose-400 text-rose-200'
                }`}
              >
                {isBuy ? (
                  <ArrowUpRight className="w-3 h-3 text-sky-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                )}
                <span>
                  {pos.side} {pos.lotSize}L @ {pos.entryPrice.toFixed(instrument.digits)}
                </span>
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                    isProfit ? 'bg-emerald-900/90 text-emerald-300' : 'bg-rose-900/90 text-rose-300'
                  }`}
                >
                  {isProfit ? '+' : ''}${pnl.toFixed(2)}
                </span>
              </div>

              {/* Quick Action Buttons on Entry Line */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 px-1.5 py-0.5 rounded shadow-lg opacity-85 group-hover:opacity-100 mr-2">
                {/* Break-Even Button */}
                <button
                  onClick={() =>
                    pos.isLive
                      ? setLiveBreakeven(pos.ticket)
                      : setBacktestBE(pos.id)
                  }
                  title={t.moveSLBreakEven}
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 rounded transition-colors"
                >
                  BE
                </button>

                {/* Close 50% Button */}
                <button
                  onClick={() =>
                    pos.isLive
                      ? partialCloseLive(pos.ticket, 50)
                      : partialCloseBacktest(pos.id, 50)
                  }
                  title={t.closeHalfVolume}
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 rounded transition-colors"
                >
                  50%
                </button>

                {/* Close 100% Button */}
                <button
                  onClick={() =>
                    pos.isLive
                      ? closeLivePosition(pos.ticket)
                      : closeBacktestPosition(pos.id)
                  }
                  title={t.closeAllPositions}
                  className="p-0.5 text-rose-400 hover:bg-rose-500/30 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* STOP LOSS HANDLE (SL) */}
            {posCoord.slY !== null && (!dragging || dragging.positionId !== pos.id || dragging.type !== 'SL') && (
              <div
                className="absolute left-0 right-14 flex items-center justify-between pointer-events-auto select-none cursor-ns-resize group"
                style={{ top: `${posCoord.slY - 10}px` }}
                onMouseDown={(e) => handleMouseDown(e, 'SL', pos)}
              >
                <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-950/90 border border-rose-500/60 rounded text-[10px] font-mono text-rose-300 shadow-md">
                  <Shield className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="font-bold">SL: {pos.stopLoss?.toFixed(instrument.digits)}</span>
                  <MoveVertical className="w-2.5 h-2.5 opacity-60" />
                </div>
              </div>
            )}

            {/* TAKE PROFIT HANDLE (TP) */}
            {posCoord.tpY !== null && (!dragging || dragging.positionId !== pos.id || dragging.type !== 'TP') && (
              <div
                className="absolute left-0 right-14 flex items-center justify-between pointer-events-auto select-none cursor-ns-resize group"
                style={{ top: `${posCoord.tpY - 10}px` }}
                onMouseDown={(e) => handleMouseDown(e, 'TP', pos)}
              >
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/90 border border-emerald-500/60 rounded text-[10px] font-mono text-emerald-300 shadow-md">
                  <Target className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-bold">TP: {pos.takeProfit?.toFixed(instrument.digits)}</span>
                  <MoveVertical className="w-2.5 h-2.5 opacity-60" />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 2. Render Real-time Dragging HUD Preview */}
      {dragging && (
        <div
          className="absolute left-4 right-16 flex items-center pointer-events-none select-none z-30"
          style={{ top: `${dragging.currentY - 14}px` }}
        >
          {/* Draggable Line Bar */}
          <div
            className={`w-full h-0.5 border-b-2 border-dashed ${
              dragging.type === 'SL' ? 'border-rose-500' : 'border-emerald-500'
            }`}
          />

          {/* Floating Pill Tooltip */}
          {(() => {
            const isBuy = dragging.side === 'BUY';
            const priceDiff =
              dragging.type === 'SL'
                ? isBuy
                  ? dragging.currentPrice - dragging.entryPrice
                  : dragging.entryPrice - dragging.currentPrice
                : isBuy
                ? dragging.currentPrice - dragging.entryPrice
                : dragging.entryPrice - dragging.currentPrice;

            const pipDist = Math.abs((dragging.currentPrice - dragging.entryPrice) / instrument.pipSize);
            const dollarVal = priceDiff * instrument.contractSize * dragging.lotSize;
            const pctVal = currentBalance > 0 ? (dollarVal / currentBalance) * 100 : 0;

            return (
              <div
                className={`absolute left-1/3 -top-3.5 px-3 py-1 rounded-full shadow-2xl border text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-md ${
                  dragging.type === 'SL'
                    ? 'bg-rose-950/95 border-rose-500 text-rose-200'
                    : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                }`}
              >
                {dragging.type === 'SL' ? (
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {dragging.type}: {dragging.currentPrice.toFixed(instrument.digits)}
                </span>
                <span className="text-slate-400">({pipDist.toFixed(1)} pips)</span>
                <span
                  className={`px-1.5 py-0.2 rounded ${
                    dollarVal >= 0 ? 'bg-emerald-900/80 text-emerald-300' : 'bg-rose-900/80 text-rose-300'
                  }`}
                >
                  {dollarVal >= 0 ? '+' : ''}${dollarVal.toFixed(2)} ({pctVal >= 0 ? '+' : ''}
                  {pctVal.toFixed(2)}%)
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
