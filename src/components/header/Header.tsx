import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Globe,
  Keyboard,
  User,
  Zap,
  Coins,
  DollarSign,
  BarChart2,
  FolderOpen
} from 'lucide-react';
import { INSTRUMENTS } from '../../config/instruments';
import { useBacktestStore } from '../../store/backtestStore';
import { useAuthStore } from '../../store/authStore';
import { translations, Language } from '../../i18n/translations';
import { AssetCategory, ChartType, DrawingToolType, Timeframe } from '../../types/market';
import { SymbolSearchModal } from './SymbolSearchModal';

export const Header: React.FC = () => {
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);

  const {
    instrument,
    setInstrument,
    timeframe,
    setTimeframe,
    chartType,
    setChartType,
    account,
    activeTool,
    setActiveTool,
    clearDrawings,
    autoTradingEnabled,
    language,
    setLanguage,
    setOrderModalOpen,
    setAIModalOpen,
    setAnalyticsModalOpen,
    setDataModalOpen,
    setShortcutsModalOpen,
    setProfileModalOpen,
    setSessionManagerOpen
  } = useBacktestStore();

  const { user, isAuthenticated, setAuthModalOpen } = useAuthStore();
  const t = translations[language] || translations.vi;

  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const floatingPnL = account.equity - account.balance;

  const getAssetBadge = (cat: AssetCategory) => {
    switch (cat) {
      case 'METALS': return <Coins className="w-3.5 h-3.5 text-amber-400" />;
      case 'CRYPTO': return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'FOREX': return <DollarSign className="w-3.5 h-3.5 text-teal-400" />;
      case 'INDICES': return <BarChart2 className="w-3.5 h-3.5 text-sky-400" />;
      default: return null;
    }
  };

  return (
    <>
      <header className="h-13 bg-[#101520] border-b border-slate-800/90 px-3.5 flex items-center justify-between select-none z-30 relative shadow-sm">
        {/* LEFT: BRAND, SYMBOL TICKER & TIMEFRAMES */}
        <div className="flex items-center gap-2.5">
          {/* Brand */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xs tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline font-mono">
              QuantBacktest<span className="text-indigo-400 font-mono text-[10px] ml-1 px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/40 font-bold">PRO</span>
            </span>
          </div>

          {/* Clean Symbol Button (TradingView Style) */}
          <button
            onClick={() => setIsSymbolModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/80 hover:border-indigo-500/50 text-xs font-bold transition-all shadow-xs group"
            title="Bấm để đổi mã tài sản (Symbol Search)"
          >
            <div className="flex items-center gap-1.5">
              {getAssetBadge(instrument.category)}
              <span className="font-mono text-slate-100 group-hover:text-indigo-300 text-xs tracking-wide">
                {instrument.symbol}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
          </button>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
            <Clock className="w-3 h-3 text-slate-500 ml-1.5 mr-0.5" />
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Selector Dropdown (TradingView Style) */}
          <div className="relative">
            <button
              onClick={() => setIsChartTypeDropdownOpen(!isChartTypeDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-xs font-mono transition-all"
              title={t.chartType}
            >
              <span className="text-sm">
                {chartType === 'candlestick' && '🕯️'}
                {chartType === 'bar' && '📊'}
                {chartType === 'line' && '📈'}
                {chartType === 'area' && '🏔️'}
                {chartType === 'heikin-ashi' && '⛩️'}
                {chartType === 'hollow' && '🕳️'}
                {chartType === 'baseline' && '📉'}
              </span>
              <span className="hidden md:inline text-slate-200 font-bold text-[11px]">
                {chartType === 'candlestick' && 'Nến'}
                {chartType === 'bar' && 'Bar'}
                {chartType === 'line' && 'Line'}
                {chartType === 'area' && 'Area'}
                {chartType === 'heikin-ashi' && 'H-A'}
                {chartType === 'hollow' && 'Hollow'}
                {chartType === 'baseline' && 'Base'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isChartTypeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsChartTypeDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-60 bg-[#111622] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 font-mono text-xs space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                    {t.chartType}
                  </div>
                  {[
                    { id: 'candlestick' as const, label: t.candlestick, icon: '🕯️' },
                    { id: 'heikin-ashi' as const, label: t.heikinAshi, icon: '⛩️' },
                    { id: 'hollow' as const, label: t.hollowCandles, icon: '🕳️' },
                    { id: 'bar' as const, label: t.barChart, icon: '📊' },
                    { id: 'line' as const, label: t.lineChart, icon: '📈' },
                    { id: 'area' as const, label: t.areaChart, icon: '🏔️' },
                    { id: 'baseline' as const, label: t.baselineChart, icon: '📉' },
                  ].map(ct => {
                    const isSelected = chartType === ct.id;
                    return (
                      <button
                        key={ct.id}
                        onClick={() => {
                          setChartType(ct.id);
                          setIsChartTypeDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors text-left ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{ct.icon}</span>
                          <span className="text-xs">{ct.label}</span>
                        </div>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Drawing Tools Quick Bar */}
          <div className="hidden 2xl:flex items-center gap-0.5 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
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
        <div className="flex items-center gap-2">
          {/* Live Account Stats */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
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
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.orderEntry}</span>
          </button>

          {/* AI Strategy Studio Button */}
          <button
            onClick={() => setAIModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
              autoTradingEnabled
                ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/25 animate-pulse'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Studio</span>
            {autoTradingEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Sessions Manager Button */}
          <button
            onClick={() => setSessionManagerOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title={t.sessionManagerTitle}
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">{t.sessions}</span>
          </button>

          {/* Analytics Report Button */}
          <button
            onClick={() => setAnalyticsModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title={t.analytics}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">{t.analytics.split('&')[0].trim()}</span>
          </button>

          {/* Data Import Button */}
          <button
            onClick={() => setDataModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title={t.dataImport}
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">{t.dataImport}</span>
          </button>

          {/* Shortcuts Button */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-lg transition-colors"
            title={t.shortcuts}
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* LANGUAGE SWITCHER */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 transition-colors"
              title="Đổi ngôn ngữ (Language)"
            >
              <span>{languages.find(l => l.code === language)?.flag}</span>
              <span className="font-bold uppercase text-[11px]">{language}</span>
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 glass-dropdown rounded-lg p-1.5 z-50 animate-in fade-in zoom-in-95">
                {languages.map(item => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded text-xs transition-colors ${language === item.code ? 'bg-indigo-950 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* USER PROFILE / AUTH BUTTON */}
          {isAuthenticated && user ? (
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-full transition-all active:scale-95"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-indigo-500/50"
              />
              <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[80px] truncate">
                {user.name}
              </span>
              <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950">
                {user.tier}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </header>

      {/* SYMBOL SEARCH MODAL (TRADINGVIEW STYLE) */}
      <SymbolSearchModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        currentSymbol={instrument.symbol}
        onSelectSymbol={(sym) => setInstrument(sym)}
      />
    </>
  );
};
