import React, { useState } from 'react';
import {
  Layers,
  Clock,
  History,
  Terminal,
  X,
  Edit2,
  TrendingUp,
  TrendingDown,
  Trash2,
  ShieldCheck,
  Percent,
  Tag,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Radio,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { INSTRUMENTS } from '../../config/instruments';
import { useBacktestStore } from '../../store/backtestStore';
import { useBrokerStore } from '../../store/brokerStore';
import { translations } from '../../i18n/translations';
import { Position } from '../../types/order';
import { BrokerPosition } from '../../types/broker';

export const PositionsTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'history' | 'logs'>('open');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [editingPosition, setEditingPosition] = useState<Position | BrokerPosition | null>(null);
  const [editSL, setEditSL] = useState<string>('');
  const [editTP, setEditTP] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('SMC Order Block');
  const [noteText, setNoteText] = useState<string>('');

  const {
    openPositions,
    pendingOrders,
    closedPositions,
    strategyLogs,
    closePosition,
    setBreakeven,
    partialClose,
    cancelPendingOrder,
    modifyPositionSLTP,
    updatePositionTags,
    instrument,
    candles,
    currentIndex,
    language
  } = useBacktestStore();

  const {
    isLiveTradingMode,
    activeBroker,
    positions: livePositions,
    orders: liveOrders,
    deals: liveDeals,
    setLiveBreakeven,
    partialCloseLive,
    closeLivePosition,
    closeAllLivePositions,
    cancelLiveOrder,
    modifyLiveSLTP
  } = useBrokerStore();

  const t = translations[language] || translations.vi;
  const currentCandle = candles[currentIndex];

  const formatPrice = (symbol: string, price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return '---';
    const digits = INSTRUMENTS[symbol]?.digits ?? instrument.digits;
    return price.toFixed(digits);
  };

  const handleOpenEdit = (pos: Position | BrokerPosition) => {
    setEditingPosition(pos);
    const sl = 'stopLoss' in pos ? pos.stopLoss : (pos as BrokerPosition).sl;
    const tp = 'takeProfit' in pos ? pos.takeProfit : (pos as BrokerPosition).tp;
    setEditSL(sl ? sl.toString() : '');
    setEditTP(tp ? tp.toString() : '');
    setSelectedTag(('tags' in pos && pos.tags?.[0]) || 'SMC Order Block');
    setNoteText(('note' in pos && pos.note) || ('comment' in pos ? pos.comment : '') || '');
  };

  const handleSaveEdit = async () => {
    if (!editingPosition) return;
    const sl = editSL ? parseFloat(editSL) : undefined;
    const tp = editTP ? parseFloat(editTP) : undefined;

    if (isLiveTradingMode) {
      const ticket = 'ticket' in editingPosition ? editingPosition.ticket : editingPosition.id;
      await modifyLiveSLTP(ticket, sl, tp);
    } else {
      if ('status' in editingPosition && editingPosition.status === 'OPEN') {
        modifyPositionSLTP(editingPosition.id, sl, tp);
      }
      if ('id' in editingPosition) {
        updatePositionTags(editingPosition.id, [selectedTag], noteText);
      }
    }
    setEditingPosition(null);
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(5, 19);
  };

  const openCount = isLiveTradingMode ? livePositions.length : openPositions.length;
  const pendingCount = isLiveTradingMode ? liveOrders.length : pendingOrders.length;
  const historyCount = isLiveTradingMode ? liveDeals.length : closedPositions.length;

  return (
    <div
      className={`bg-[#0e121b] border-t border-slate-800 flex flex-col z-20 select-none transition-all duration-300 ${
        isCollapsed ? 'h-9' : 'h-44 sm:h-48 md:h-56'
      }`}
    >
      {/* TABS HEADER */}
      <div className="h-9 bg-[#111622] border-b border-slate-800 flex items-center justify-between px-2 sm:px-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 text-xs shrink-0">
          <button
            onClick={() => {
              setActiveTab('open');
              setIsCollapsed(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-t font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'open'
                ? 'bg-[#0e121b] text-indigo-400 border-t-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {t.openPositions} ({openCount})
            </span>
            {isLiveTradingMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('pending');
              setIsCollapsed(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-t font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'pending'
                ? 'bg-[#0e121b] text-indigo-400 border-t-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {t.pendingOrders} ({pendingCount})
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setIsCollapsed(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-t font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-[#0e121b] text-indigo-400 border-t-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>
              {t.history} ({historyCount})
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              setIsCollapsed(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-t font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'bg-[#0e121b] text-indigo-400 border-t-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>
              {t.strategyLogs} ({strategyLogs.length})
            </span>
          </button>
        </div>

        {/* Action buttons & collapse toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Close All */}
          {openCount > 0 && activeTab === 'open' && !isCollapsed && (
            <button
              onClick={() => {
                if (isLiveTradingMode) {
                  closeAllLivePositions();
                } else {
                  openPositions.forEach((p) => closePosition(p.id));
                }
              }}
              className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded transition-colors font-bold flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>{t.closeAll}</span>
            </button>
          )}

          {/* Toggle Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isCollapsed ? t.expandTable : t.collapseTable}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto text-xs font-mono">
          {/* 1. OPEN POSITIONS TAB */}
          {activeTab === 'open' && (
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50 sticky top-0 text-[11px]">
                  <th className="py-1.5 px-3">Ticket / Symbol</th>
                  <th className="py-1.5 px-2">{t.side}</th>
                  <th className="py-1.5 px-2">{t.lot}</th>
                  <th className="py-1.5 px-2">{t.entryPrice}</th>
                  <th className="py-1.5 px-2">{t.currentPrice}</th>
                  <th className="py-1.5 px-2">SL / TP</th>
                  <th className="py-1.5 px-2">Pro Actions</th>
                  <th className="py-1.5 px-3 text-right">{t.floatingPnL}</th>
                  <th className="py-1.5 px-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {isLiveTradingMode ? (
                  // LIVE BROKER POSITIONS
                  livePositions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-500">
                        No live open positions on {activeBroker}.
                      </td>
                    </tr>
                  ) : (
                    livePositions.map((pos) => (
                      <tr
                        key={pos.ticket}
                        className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-1.5 px-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">#{pos.ticket}</span>
                            <span className="font-bold text-white">{pos.symbol}</span>
                          </div>
                          {pos.comment && (
                            <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{pos.comment}</div>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'BUY'
                                ? 'bg-teal-950 text-teal-400 border border-teal-500/40'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-300 font-bold">{pos.lotSize}</td>
                        <td className="py-1.5 px-2 text-slate-300">{formatPrice(pos.symbol, pos.openPrice)}</td>
                        <td className="py-1.5 px-2 text-indigo-300 font-semibold">
                          {formatPrice(pos.symbol, pos.currentPrice)}
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="text-rose-400 text-[10px]">
                            SL: {pos.sl ? formatPrice(pos.symbol, pos.sl) : 'None'}
                          </div>
                          <div className="text-teal-400 text-[10px]">
                            TP: {pos.tp ? formatPrice(pos.symbol, pos.tp) : 'None'}
                          </div>
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setLiveBreakeven(pos.ticket)}
                              className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded text-[10px] font-bold flex items-center gap-0.5"
                              title="Set Breakeven SL"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>BE</span>
                            </button>
                            <button
                              onClick={() => partialCloseLive(pos.ticket, 50)}
                              className="px-1.5 py-0.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 rounded text-[10px] font-bold flex items-center gap-0.5"
                              title="Close 50% Lot"
                            >
                              <Percent className="w-3 h-3" />
                              <span>50%</span>
                            </button>
                          </div>
                        </td>
                        <td
                          className={`py-1.5 px-3 text-right font-bold text-xs ${
                            pos.floatingPnL >= 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {pos.floatingPnL >= 0 ? '+' : ''}${pos.floatingPnL.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(pos)}
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-300"
                              title="Edit SL/TP"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => closeLivePosition(pos.ticket)}
                              className="p-1 hover:bg-rose-900/60 rounded text-slate-400 hover:text-rose-400"
                              title="Close Position"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  // REPLAY BACKTEST POSITIONS
                  openPositions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-500">
                        {t.noOpenPositions}
                      </td>
                    </tr>
                  ) : (
                    openPositions.map((pos) => (
                      <tr
                        key={pos.id}
                        className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-1.5 px-3 font-semibold text-slate-200">
                          <div>{pos.symbol}</div>
                          {pos.tags && pos.tags.length > 0 && (
                            <span className="text-[9px] px-1 py-0.2 bg-indigo-950 text-indigo-400 rounded border border-indigo-500/30">
                              {pos.tags[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'BUY'
                                ? 'bg-teal-950 text-teal-400 border border-teal-500/40'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-300 font-bold">{pos.lotSize}</td>
                        <td className="py-1.5 px-2 text-slate-300">
                          {pos.entryPrice.toFixed(instrument.digits)}
                        </td>
                        <td className="py-1.5 px-2 text-indigo-300 font-semibold">
                          {currentCandle?.close.toFixed(instrument.digits)}
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="text-rose-400 text-[10px]">
                            SL: {pos.stopLoss ? pos.stopLoss.toFixed(instrument.digits) : 'None'}
                          </div>
                          <div className="text-teal-400 text-[10px]">
                            TP: {pos.takeProfit ? pos.takeProfit.toFixed(instrument.digits) : 'None'}
                          </div>
                          {pos.stopLoss && pos.takeProfit && (
                            <div className="mt-0.5">
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-mono">
                                R:R 1:
                                {(
                                  Math.abs(pos.takeProfit - pos.entryPrice) /
                                  Math.abs(pos.entryPrice - pos.stopLoss)
                                ).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setBreakeven(pos.id)}
                              className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded text-[10px] font-bold flex items-center gap-0.5"
                              title="Set Breakeven SL"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{t.setBE}</span>
                            </button>
                            <button
                              onClick={() => partialClose(pos.id, 50)}
                              disabled={pos.lotSize <= instrument.minLot}
                              className="px-1.5 py-0.5 bg-sky-950/80 hover:bg-sky-900 disabled:opacity-40 border border-sky-500/40 text-sky-300 rounded text-[10px] font-bold flex items-center gap-0.5"
                              title="Close 50% Lot"
                            >
                              <Percent className="w-3 h-3" />
                              <span>{t.close50}</span>
                            </button>
                          </div>
                        </td>
                        <td
                          className={`py-1.5 px-3 text-right font-bold text-xs ${
                            pos.floatingPnL >= 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {pos.floatingPnL >= 0 ? '+' : ''}${pos.floatingPnL.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(pos)}
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-300"
                              title={t.editSLTP}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => closePosition(pos.id)}
                              className="p-1 hover:bg-rose-900/60 rounded text-slate-400 hover:text-rose-400"
                              title={t.closePosition}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          )}

          {/* 2. PENDING ORDERS TAB */}
          {activeTab === 'pending' && (
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50 sticky top-0 text-[11px]">
                  <th className="py-1.5 px-3">Ticket / Symbol</th>
                  <th className="py-1.5 px-2">{t.side}</th>
                  <th className="py-1.5 px-2">{t.lot}</th>
                  <th className="py-1.5 px-2">Trigger Price</th>
                  <th className="py-1.5 px-2">SL</th>
                  <th className="py-1.5 px-2">TP</th>
                  <th className="py-1.5 px-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {isLiveTradingMode ? (
                  // LIVE BROKER ORDERS
                  liveOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No pending orders on {activeBroker}.
                      </td>
                    </tr>
                  ) : (
                    liveOrders.map((order) => (
                      <tr
                        key={order.ticket}
                        className="border-b border-slate-800/40 hover:bg-slate-800/30"
                      >
                        <td className="py-1.5 px-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">#{order.ticket}</span>
                            <span>{order.symbol}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/40">
                            {order.type}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">{order.lotSize}</td>
                        <td className="py-1.5 px-2 text-amber-300 font-semibold">
                          {formatPrice(order.symbol, order.triggerPrice)}
                        </td>
                        <td className="py-1.5 px-2 text-rose-400">
                          {order.sl ? formatPrice(order.symbol, order.sl) : '---'}
                        </td>
                        <td className="py-1.5 px-2 text-teal-400">
                          {order.tp ? formatPrice(order.symbol, order.tp) : '---'}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => cancelLiveOrder(order.ticket)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  // REPLAY BACKTEST ORDERS
                  pendingOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        {t.noPendingOrders}
                      </td>
                    </tr>
                  ) : (
                    pendingOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                        <td className="py-1.5 px-3 font-semibold text-slate-200">{order.symbol}</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-500/40">
                            {order.side} {order.type}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">{order.lotSize}</td>
                        <td className="py-1.5 px-2 text-amber-300 font-semibold">
                          {order.price.toFixed(instrument.digits)}
                        </td>
                        <td className="py-1.5 px-2 text-rose-400">
                          {order.stopLoss ? order.stopLoss.toFixed(instrument.digits) : '---'}
                        </td>
                        <td className="py-1.5 px-2 text-teal-400">
                          {order.takeProfit ? order.takeProfit.toFixed(instrument.digits) : '---'}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => cancelPendingOrder(order.id)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded text-[10px]"
                          >
                            {t.cancel}
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          )}

          {/* 3. CLOSED TRADES TAB */}
          {activeTab === 'history' && (
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50 sticky top-0 text-[11px]">
                  <th className="py-1.5 px-3">Time</th>
                  <th className="py-1.5 px-2">Ticket / Symbol</th>
                  <th className="py-1.5 px-2">{t.side}</th>
                  <th className="py-1.5 px-2">{t.lot}</th>
                  <th className="py-1.5 px-2">Price</th>
                  <th className="py-1.5 px-2">Comm / Swap</th>
                  <th className="py-1.5 px-3 text-right">{t.realizedPnL}</th>
                </tr>
              </thead>
              <tbody>
                {isLiveTradingMode ? (
                  // LIVE DEALS
                  liveDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No trade history on {activeBroker}.
                      </td>
                    </tr>
                  ) : (
                    [...liveDeals].reverse().map((deal) => (
                      <tr
                        key={deal.ticket}
                        className="border-b border-slate-800/40 hover:bg-slate-800/30"
                      >
                        <td className="py-1.5 px-3 text-slate-400 text-[10px]">{formatTime(deal.time)}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-200">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">#{deal.ticket}</span>
                            <span>{deal.symbol}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              deal.side === 'BUY' ? 'bg-teal-950 text-teal-400' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {deal.side}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">{deal.lotSize}</td>
                        <td className="py-1.5 px-2 text-slate-300">{formatPrice(deal.symbol, deal.price)}</td>
                        <td className="py-1.5 px-2 text-slate-400 text-[10px]">
                          ${deal.commission.toFixed(2)} / ${deal.swap.toFixed(2)}
                        </td>
                        <td
                          className={`py-1.5 px-3 text-right font-bold ${
                            deal.profit >= 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {deal.profit >= 0 ? '+' : ''}${deal.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  // REPLAY TRADES
                  closedPositions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        {t.noHistory}
                      </td>
                    </tr>
                  ) : (
                    [...closedPositions].reverse().map((trade) => (
                      <tr
                        key={trade.id}
                        className="border-b border-slate-800/40 hover:bg-slate-800/30"
                      >
                        <td className="py-1.5 px-3 text-slate-400 text-[10px]">{formatTime(trade.closeTime)}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-200">{trade.symbol}</td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              trade.side === 'BUY' ? 'bg-teal-950 text-teal-400' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">{trade.lotSize}</td>
                        <td className="py-1.5 px-2 text-slate-300">
                          <div>{formatPrice(trade.symbol, trade.entryPrice)}</div>
                          <div className="text-slate-500 text-[10px]">↳ {formatPrice(trade.symbol, trade.closePrice)}</div>
                        </td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              trade.closeReason === 'TP'
                                ? 'bg-teal-900/60 text-teal-300'
                                : trade.closeReason === 'SL'
                                ? 'bg-rose-900/60 text-rose-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {trade.closeReason}
                          </span>
                        </td>
                        <td
                          className={`py-1.5 px-3 text-right font-bold ${
                            trade.realizedPnL >= 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {trade.realizedPnL >= 0 ? '+' : ''}${trade.realizedPnL.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          )}

          {/* 4. AI STRATEGY LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="p-3 space-y-1.5 font-mono text-xs">
              {strategyLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-slate-300">
                  <span className="text-[10px] text-slate-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span
                    className={`px-1 rounded text-[10px] font-bold ${
                      log.type === 'SIGNAL'
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                        : log.type === 'ERROR'
                        ? 'bg-rose-950 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT SL/TP & TAGGING MODAL DIALOG */}
      {editingPosition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-lg w-84 shadow-2xl space-y-3.5 text-xs">
            <h3 className="font-bold text-sm text-slate-200">
              {isLiveTradingMode ? 'Modify Live SL / TP' : `${t.editSLTP} & ${t.tagStrategy}`}
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-400 mb-1">
                  Stop Loss ({editingPosition.symbol || instrument.symbol}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={editSL}
                  onChange={(e) => setEditSL(e.target.value)}
                  placeholder="None"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Take Profit ({editingPosition.symbol || instrument.symbol}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={editTP}
                  onChange={(e) => setEditTP(e.target.value)}
                  placeholder="None"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingPosition(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
