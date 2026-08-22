import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, ArrowUpRight, ArrowDownRight, Calculator } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { OrderSide, OrderType } from '../../types/order';

export const OrderEntryModal: React.FC = () => {
  const {
    isOrderModalOpen,
    setOrderModalOpen,
    instrument,
    account,
    candles,
    currentIndex,
    executeMarketOrder,
    placePendingOrder,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  const currentCandle = candles[currentIndex];

  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [pendingPrice, setPendingPrice] = useState<string>('');
  
  // SL & TP mode: 'pips' | 'price'
  const [slMode, setSlMode] = useState<'pips' | 'price'>('pips');
  const [slValue, setSlValue] = useState<string>('20');
  const [tpValue, setTpValue] = useState<string>('40');
  const [trailingStop, setTrailingStop] = useState<string>('');

  useEffect(() => {
    if (currentCandle) {
      setPendingPrice(currentCandle.close.toFixed(instrument.digits));
    }
  }, [currentCandle, instrument]);

  if (!isOrderModalOpen) return null;

  const currentPrice = currentCandle?.close || 0;
  const spread = instrument.defaultSpreadPips * instrument.pipSize;
  const executionPrice = side === 'BUY' ? currentPrice + spread : currentPrice;

  // Tính giá SL và TP tương ứng
  let calculatedSLPrice: number | undefined = undefined;
  let calculatedTPPrice: number | undefined = undefined;

  if (slValue) {
    const val = parseFloat(slValue);
    if (!isNaN(val)) {
      if (slMode === 'pips') {
        const pipsDist = val * instrument.pipSize;
        calculatedSLPrice = side === 'BUY' ? executionPrice - pipsDist : executionPrice + pipsDist;
      } else {
        calculatedSLPrice = val;
      }
    }
  }

  if (tpValue) {
    const val = parseFloat(tpValue);
    if (!isNaN(val)) {
      if (slMode === 'pips') {
        const pipsDist = val * instrument.pipSize;
        calculatedTPPrice = side === 'BUY' ? executionPrice + pipsDist : executionPrice - pipsDist;
      } else {
        calculatedTPPrice = val;
      }
    }
  }

  // Risk / Reward Math
  const slPips = calculatedSLPrice ? Math.abs((executionPrice - calculatedSLPrice) / instrument.pipSize) : 0;
  const tpPips = calculatedTPPrice ? Math.abs((calculatedTPPrice - executionPrice) / instrument.pipSize) : 0;
  
  const estimatedRiskUSD = slPips * (lotSize * instrument.contractSize * instrument.pipSize);
  const estimatedRewardUSD = tpPips * (lotSize * instrument.contractSize * instrument.pipSize);
  const riskReward = estimatedRiskUSD > 0 ? (estimatedRewardUSD / estimatedRiskUSD).toFixed(2) : '0';

  const requiredMargin = (lotSize * instrument.contractSize * executionPrice) / instrument.leverage;

  const handleQuickRisk = (percent: number) => {
    const riskUSD = account.balance * (percent / 100);
    const pips = slPips > 0 ? slPips : 20;
    const calculatedLot = riskUSD / (pips * instrument.contractSize * instrument.pipSize);
    setLotSize(Number(Math.max(instrument.minLot, Math.min(calculatedLot, instrument.maxLot)).toFixed(2)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderType === 'MARKET') {
      const success = executeMarketOrder(
        side,
        lotSize,
        calculatedSLPrice,
        calculatedTPPrice,
        trailingStop ? parseFloat(trailingStop) : undefined
      );
      if (success) setOrderModalOpen(false);
    } else {
      const price = parseFloat(pendingPrice);
      if (isNaN(price)) return;

      const success = placePendingOrder(
        side,
        orderType,
        lotSize,
        price,
        calculatedSLPrice,
        calculatedTPPrice,
        trailingStop ? parseFloat(trailingStop) : undefined
      );
      if (success) setOrderModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-100">{instrument.symbol}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
              {instrument.category}
            </span>
          </div>
          <button
            onClick={() => setOrderModalOpen(false)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ORDER FORM */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Order Type Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {(['MARKET', 'LIMIT', 'STOP'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`py-1.5 rounded-md font-semibold text-center transition-all ${
                  orderType === type ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Side Selector (BUY vs SELL) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                side === 'BUY'
                  ? 'bg-teal-600 text-white ring-2 ring-teal-400 shadow-lg shadow-teal-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400'
              }`}
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>BUY (LONG)</span>
            </button>

            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400'
              }`}
            >
              <ArrowDownRight className="w-5 h-5" />
              <span>SELL (SHORT)</span>
            </button>
          </div>

          {/* Pending Price Input (If Limit/Stop) */}
          {orderType !== 'MARKET' && (
            <div>
              <label className="block text-slate-400 mb-1">Giá kích hoạt ({orderType}):</label>
              <input
                type="number"
                step="any"
                required
                value={pendingPrice}
                onChange={(e) => setPendingPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Volume / Lot Size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-medium">Khối lượng (Lot):</label>
              <div className="flex gap-1">
                {[1, 2, 5].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickRisk(pct)}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded text-[10px]"
                  >
                    Risk {pct}%
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              step={instrument.lotStep}
              min={instrument.minLot}
              max={instrument.maxLot}
              value={lotSize}
              onChange={(e) => setLotSize(parseFloat(e.target.value) || instrument.minLot)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* SL & TP Inputs */}
          <div className="grid grid-cols-2 gap-3">
            {/* Stop Loss */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-rose-400 font-medium">Stop Loss:</label>
                <button
                  type="button"
                  onClick={() => setSlMode(slMode === 'pips' ? 'price' : 'pips')}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                >
                  {slMode === 'pips' ? 'Nhập Pips' : 'Nhập Giá'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={slValue}
                onChange={(e) => setSlValue(e.target.value)}
                placeholder={slMode === 'pips' ? 'Ví dụ: 20 pips' : 'Giá SL'}
                className="w-full bg-slate-900 border border-rose-900/50 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Take Profit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-teal-400 font-medium">Take Profit:</label>
                <span className="text-[10px] text-slate-500">{slMode === 'pips' ? 'Pips' : 'Giá'}</span>
              </div>
              <input
                type="number"
                step="any"
                value={tpValue}
                onChange={(e) => setTpValue(e.target.value)}
                placeholder={slMode === 'pips' ? 'Ví dụ: 40 pips' : 'Giá TP'}
                className="w-full bg-slate-900 border border-teal-900/50 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Trailing Stop Input */}
          <div>
            <label className="block text-slate-400 mb-1">Trailing Stop (Pips - Bỏ trống nếu không dùng):</label>
            <input
              type="number"
              step="1"
              value={trailingStop}
              onChange={(e) => setTrailingStop(e.target.value)}
              placeholder="VD: 15 pips"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* SUMMARY RISK / REWARD BOX */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Giá khớp dự kiến:</span>
              <span className="font-semibold text-slate-200">{executionPrice.toFixed(instrument.digits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rủi ro (Risk SL):</span>
              <span className="font-semibold text-rose-400">
                -${estimatedRiskUSD.toFixed(2)} ({slPips.toFixed(1)} pips)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lợi nhuận (Reward TP):</span>
              <span className="font-semibold text-teal-400">
                +${estimatedRewardUSD.toFixed(2)} ({tpPips.toFixed(1)} pips)
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-400">Tỷ lệ Risk:Reward:</span>
              <span className="font-bold text-indigo-400">1 : {riskReward}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ký quỹ (Margin):</span>
              <span className="text-slate-300">${requiredMargin.toFixed(2)}</span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-sm text-white shadow-lg transition-all active:scale-98 ${
              side === 'BUY'
                ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
          >
            {orderType === 'MARKET' ? `VÀO LỆNH ${side} ${lotSize} LOT` : `ĐẶT LỆNH ${orderType} ${side}`}
          </button>
        </form>
      </div>
    </div>
  );
};
