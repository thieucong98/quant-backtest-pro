import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, ArrowRight, Zap, Coins, DollarSign, BarChart2 } from 'lucide-react';
import { INSTRUMENTS } from '../../config/instruments';
import { AssetCategory } from '../../types/market';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  onSelectSymbol
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
      setSelectedCategory('ALL');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const instrumentsList = Object.values(INSTRUMENTS);

  const filtered = instrumentsList.filter(inst => {
    const matchCategory = selectedCategory === 'ALL' || inst.category === selectedCategory;
    const matchSearch =
      inst.symbol.toLowerCase().includes(search.toLowerCase()) ||
      inst.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case 'METALS': return <Coins className="w-3.5 h-3.5 text-amber-400" />;
      case 'CRYPTO': return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'FOREX': return <DollarSign className="w-3.5 h-3.5 text-teal-400" />;
      case 'INDICES': return <BarChart2 className="w-3.5 h-3.5 text-sky-400" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 z-50 animate-in fade-in select-none p-3">
      <div className="bg-[#111622] border border-slate-700/90 rounded-xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* SEARCH HEADER */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm mã tài sản (ví dụ: XAUUSD, BTC, EURUSD...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CATEGORIES PILLS */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono">
          {(['ALL', 'FOREX', 'METALS', 'CRYPTO', 'INDICES'] as const).map(cat => {
            const count = cat === 'ALL'
              ? instrumentsList.length
              : instrumentsList.filter(i => i.category === cat).length;
            
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{cat === 'METALS' ? 'GOLD / METALS' : cat}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full ${selectedCategory === cat ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SYMBOL LIST */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 font-mono">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Không tìm thấy tài sản nào phù hợp với từ khóa "{search}".
            </div>
          ) : (
            filtered.map(inst => {
              const isSelected = inst.symbol === currentSymbol;
              return (
                <button
                  key={inst.symbol}
                  onClick={() => {
                    onSelectSymbol(inst.symbol);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all group ${
                    isSelected
                      ? 'bg-indigo-950/80 border border-indigo-500/50 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(inst.category)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-mono text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {inst.symbol}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {inst.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {inst.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[10px] text-slate-400 hidden sm:block">
                      <div>Đòn bẩy: <b className="text-slate-200">1:{inst.leverage}</b></div>
                      <div>Spread: <b className="text-indigo-400">{inst.defaultSpreadPips}p</b></div>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
