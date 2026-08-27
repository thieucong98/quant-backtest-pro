import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Coins,
  DollarSign,
  BarChart2,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from 'lucide-react';
import { useBrokerStore } from '../../store/brokerStore';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { AssetCategory } from '../../types/market';
import { INSTRUMENTS } from '../../config/instruments';

export const MarketWatchDrawer: React.FC = () => {
  const {
    isMarketWatchOpen,
    setMarketWatchOpen,
    brokerSymbols,
    liveTicks,
    isLiveTradingMode,
    connectionStatus,
    fetchAndApplyBrokerCandles,
    executeLiveMarketOrder
  } = useBrokerStore();

  const {
    instrument,
    setInstrument,
    timeframe,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('quant_fav_symbols');
        return saved ? JSON.parse(saved) : ['XAUUSD', 'EURUSD', 'BTCUSD'];
      } catch {
        return ['XAUUSD', 'EURUSD', 'BTCUSD'];
      }
    }
    return ['XAUUSD', 'EURUSD', 'BTCUSD'];
  });

  const toggleFavorite = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem('quant_fav_symbols', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Merge default instruments with broker live symbols
  const allSymbols = useMemo(() => {
    if (brokerSymbols && brokerSymbols.length > 0) {
      return brokerSymbols;
    }
    const defaultPrices: Record<string, number> = {
      XAUUSD: 2724.50,
      XAGUSD: 31.85,
      EURUSD: 1.08350,
      GBPUSD: 1.29420,
      USDJPY: 153.450,
      AUDUSD: 0.65420,
      USDCAD: 1.38520,
      BTCUSD: 94250.0,
      ETHUSD: 2785.50,
      SOLUSD: 188.40,
      US30: 43850.0,
      NAS100: 21120.0,
      USOIL: 72.40
    };

    return Object.values(INSTRUMENTS).map((inst) => {
      const basePrice = defaultPrices[inst.symbol] || 100.0;
      const spreadVal = inst.defaultSpreadPips * Math.pow(10, -inst.digits) * (inst.digits === 5 || inst.digits === 3 ? 10 : 1);
      return {
        symbol: inst.symbol,
        description: inst.name,
        category: inst.category,
        digits: inst.digits,
        point: Math.pow(10, -inst.digits),
        spread: Math.round(inst.defaultSpreadPips * 10),
        min_lot: inst.minLot || 0.01,
        max_lot: inst.maxLot || 100.0,
        step: inst.lotStep || 0.01,
        contract_size: inst.contractSize,
        bid: basePrice,
        ask: Number((basePrice + spreadVal).toFixed(inst.digits)),
        change24h: 0.0
      };
    });
  }, [brokerSymbols]);

  const filteredSymbols = useMemo(() => {
    return allSymbols.filter((s) => {
      const matchSearch =
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (selectedCategory === 'FAVORITES') return favorites.includes(s.symbol);
      if (selectedCategory === 'ALL') return true;
      return s.category === selectedCategory;
    });
  }, [allSymbols, search, selectedCategory, favorites]);

  const handleSelectSymbol = async (symbol: string) => {
    setInstrument(symbol);
    if (connectionStatus === 'CONNECTED') {
      await fetchAndApplyBrokerCandles(symbol, timeframe);
    }
    // Auto-close on small screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMarketWatchOpen(false);
    }
  };

  if (!isMarketWatchOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0e131f] border-l border-slate-800 shadow-2xl z-40 flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* HEADER */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Bảng Giá Thị Trường (Market Watch)</span>
              {connectionStatus === 'CONNECTED' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {connectionStatus === 'CONNECTED' ? 'Exness MT5 Real-time Feed' : 'Offline Mode (Simulation)'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setMarketWatchOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã (XAUUSD, EURUSD, BTC...)"
            className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
          {[
            { id: 'ALL', label: 'TẤT CẢ' },
            { id: 'FAVORITES', label: '⭐ YÊU THÍCH' },
            { id: 'METALS', label: '🥇 VÀNG/BẠC' },
            { id: 'FOREX', label: '💱 TIỀN TỆ' },
            { id: 'CRYPTO', label: '⚡ CRYPTO' },
            { id: 'INDICES', label: '📊 CHỈ SỐ' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SYMBOL LIST TABLE */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {filteredSymbols.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Không tìm thấy cặp giao dịch phù hợp
          </div>
        ) : (
          filteredSymbols.map((sym) => {
            const isSelected = sym.symbol === instrument.symbol;
            const isFav = favorites.includes(sym.symbol);
            const live = liveTicks[sym.symbol];
            const bid = live?.bid ?? sym.bid;
            const ask = live?.ask ?? sym.ask;
            const digits = live?.digits ?? sym.digits ?? 2;
            const spreadPips = live?.spread
              ? (live.spread / 10).toFixed(1)
              : ((sym.spread || 12) / 10).toFixed(1);

            const isPositive = (sym.change24h || 0) >= 0;

            return (
              <div
                key={sym.symbol}
                onClick={() => handleSelectSymbol(sym.symbol)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {/* LEFT: SYMBOL & SPREAD */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={(e) => toggleFavorite(sym.symbol, e)}
                    className="text-slate-600 hover:text-amber-400 transition-colors shrink-0"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {sym.symbol}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-600 text-white font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {sym.description}
                    </div>
                  </div>
                </div>

                {/* MIDDLE: SPREAD */}
                <div className="text-center px-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                    {spreadPips}p
                  </span>
                </div>

                {/* RIGHT: BID / ASK */}
                <div className="flex items-center gap-2 text-right font-mono shrink-0">
                  <div>
                    <div className="text-[10px] text-slate-500">BID</div>
                    <div className="text-xs font-bold text-rose-400">
                      {bid.toFixed(digits)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">ASK</div>
                    <div className="text-xs font-bold text-emerald-400">
                      {ask.toFixed(digits)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tổng số: {filteredSymbols.length} cặp</span>
        </div>
        <button
          onClick={() => handleSelectSymbol(instrument.symbol)}
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Đồng bộ biểu đồ ⚡
        </button>
      </div>
    </div>
  );
};
