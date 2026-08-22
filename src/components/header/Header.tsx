import React, { useState } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  BarChart3,
  Upload,
  PlusCircle,
  Clock,
  PenTool,
  Minus,
  Maximize2,
  Trash2,
  Search,
  Check
} from 'lucide-react';
import { INSTRUMENTS } from '../../config/instruments';
import { useBacktestStore } from '../../store/backtestStore';
import { AssetCategory, DrawingToolType, Timeframe } from '../../types/market';

export const Header: React.FC = () => {
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');

  const {
    instrument,
    setInstrument,
    timeframe,
    setTimeframe,
    account,
    activeTool,
    setActiveTool,
    clearDrawings,
    autoTradingEnabled,
    setOrderModalOpen,
    setAIModalOpen,
    setAnalyticsModalOpen,
    setDataModalOpen
  } = useBacktestStore();

  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  const filteredInstruments = Object.values(INSTRUMENTS).filter(inst => {
    const matchCategory = selectedCategory === 'ALL' || inst.category === selectedCategory;
    const matchSearch = inst.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
                        inst.name.toLowerCase().includes(symbolSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  const floatingPnL = account.equity - account.balance;

  return (
    <header className="h-14 bg-[#111622] border-b border-slate-800/80 px-4 flex items-center justify-between select-none z-30 relative">
      {/* LEFT: LOGO & INSTRUMENT & TIMEFRAMES */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
            QuantBacktest<span className="text-indigo-400 font-mono text-xs ml-1 px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40">PRO</span>
          </span>
        </div>

        {/* Symbol Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-md border border-slate-700 text-sm font-semibold transition-colors"
          >
            <span className="text-indigo-400 font-mono">{instrument.symbol}</span>
            <span className="text-xs text-slate-400 hidden md:inline">({instrument.name.split('/')[0].trim()})</span>
            <span className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 font-normal">{instrument.category}</span>
          </button>

          {isSymbolDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 glass-dropdown rounded-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Category tabs */}
              <div className="flex gap-1 mb-2 p-1 bg-slate-900/90 rounded border border-slate-800 text-xs">
                {(['ALL', 'FOREX', 'METALS', 'CRYPTO', 'INDICES'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 py-1 rounded transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {cat === 'METALS' ? 'GOLD' : cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tài sản (XAU, BTC, EUR...)"
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded py-1.5 pl-8 pr-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Instrument List */}
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredInstruments.map(inst => (
                  <button
                    key={inst.symbol}
                    onClick={() => {
                      setInstrument(inst.symbol);
                      setIsSymbolDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors ${inst.symbol === instrument.symbol ? 'bg-indigo-950/70 border border-indigo-500/50 text-white' : 'hover:bg-slate-800/80 text-slate-300'}`}
                  >
                    <div className="text-left">
                      <div className="font-bold font-mono text-indigo-300">{inst.symbol}</div>
                      <div className="text-[10px] text-slate-400">{inst.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">1:{inst.leverage}</span>
                      {inst.symbol === instrument.symbol && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-slate-900/90 rounded-md p-0.5 border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${timeframe === tf ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Drawing Tools Quick Bar */}
        <div className="hidden lg:flex items-center gap-0.5 bg-slate-900/90 rounded-md p-0.5 border border-slate-800">
          <button
            onClick={() => setActiveTool('cursor')}
            title="Con trỏ chuột"
            className={`p-1.5 rounded text-xs ${activeTool === 'cursor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ↖
          </button>
          <button
            onClick={() => setActiveTool('trendline')}
            title="Đường xu hướng (Trendline)"
            className={`p-1.5 rounded text-xs font-mono ${activeTool === 'trendline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ╱
          </button>
          <button
            onClick={() => setActiveTool('horizontal')}
            title="Đường ngang (Horizontal Ray)"
            className={`p-1.5 rounded text-xs ${activeTool === 'horizontal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('fibonacci')}
            title="Fibonacci Thoái lui"
            className={`p-1.5 rounded text-xs font-mono font-bold ${activeTool === 'fibonacci' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Fib
          </button>
          <button
            onClick={() => setActiveTool('rectangle')}
            title="Vùng Cung/Cầu (Supply/Demand Box)"
            className={`p-1.5 rounded text-xs ${activeTool === 'rectangle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('measure')}
            title="Thước đo khoảng cách (Pips/Bars)"
            className={`p-1.5 rounded text-xs ${activeTool === 'measure' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📏
          </button>
          <button
            onClick={clearDrawings}
            title="Xóa tất cả bản vẽ"
            className="p-1.5 rounded text-xs text-slate-500 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT: ACCOUNT METRICS & ACTIONS */}
      <div className="flex items-center gap-3">
        {/* Live Account Stats */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-500 mr-1.5">Balance:</span>
            <span className="font-semibold text-slate-200">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div>
            <span className="text-slate-500 mr-1.5">Equity:</span>
            <span className={`font-semibold ${account.equity >= account.balance ? 'text-teal-400' : 'text-rose-400'}`}>
              ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {floatingPnL !== 0 && (
            <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${floatingPnL > 0 ? 'bg-teal-950/80 text-teal-300 border border-teal-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'}`}>
              {floatingPnL > 0 ? '+' : ''}${floatingPnL.toFixed(2)}
            </span>
          )}
        </div>

        {/* New Order Button */}
        <button
          onClick={() => setOrderModalOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Vào lệnh</span>
        </button>

        {/* AI Strategy Studio Button */}
        <button
          onClick={() => setAIModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
            autoTradingEnabled
              ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/25 animate-pulse'
              : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">AI Studio</span>
          {autoTradingEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* Analytics Report Button */}
        <button
          onClick={() => setAnalyticsModalOpen(true)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Báo cáo & Thống kê"
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Báo cáo</span>
        </button>

        {/* Data Import Button */}
        <button
          onClick={() => setDataModalOpen(true)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Nạp dữ liệu CSV / Mẫu"
        >
          <Upload className="w-4 h-4 text-sky-400" />
          <span className="hidden md:inline">Data</span>
        </button>
      </div>
    </header>
  );
};
