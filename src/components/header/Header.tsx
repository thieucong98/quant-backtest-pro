import React, { useState } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  BarChart3,
  Upload,
  PlusCircle,
  Clock,
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
  FolderOpen,
  Menu,
  X,
  Shield,
  Layers,
  Radio,
  Calendar,
  Eye,
  EyeOff,
  Filter,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import { INSTRUMENTS } from '../../config/instruments';
import { getCurrenciesForSymbol } from '../../config/newsEvents';
import { useBacktestStore } from '../../store/backtestStore';
import { useBrokerStore } from '../../store/brokerStore';
import { useAuthStore } from '../../store/authStore';
import { useTunnelStore } from '../../store/tunnelStore';
import { translations, Language } from '../../i18n/translations';
import { AssetCategory, ChartType, DrawingToolType, Timeframe } from '../../types/market';
import { SymbolSearchModal } from './SymbolSearchModal';
import { BrokerConnectionModal } from '../panels/BrokerConnectionModal';
import { MarketWatchDrawer } from '../panels/MarketWatchDrawer';

export const Header: React.FC = () => {
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
    showEconomicNews,
    toggleEconomicNews,
    economicNewsFilter,
    setEconomicNewsFilter,
    economicNewsDisplayMode,
    setEconomicNewsDisplayMode,
    economicNewsOnlyCurrentPair,
    setEconomicNewsOnlyCurrentPair,
    setOrderModalOpen,
    setAIModalOpen,
    setAnalyticsModalOpen,
    setDataModalOpen,
    setShortcutsModalOpen,
    setProfileModalOpen,
    setSessionManagerOpen
  } = useBacktestStore();

  const {
    isLiveTradingMode,
    setLiveTradingMode,
    connectionStatus: brokerStatus,
    activeBroker,
    account: brokerAccount,
    pingLatency,
    isMarketWatchOpen,
    setMarketWatchOpen,
    setBrokerModalOpen
  } = useBrokerStore();

  const isTunnelActive = useTunnelStore(s => s.isActive);
  const setTunnelModalOpen = useTunnelStore(s => s.setTunnelModalOpen);

  const { user, isAuthenticated, setAuthModalOpen } = useAuthStore();
  const t = translations[language] || translations.vi;

  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  const languages: { code: 'vi' | 'en' | 'ja' | 'zh'; label: string; flag: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const isLiveActive = isLiveTradingMode && brokerStatus === 'CONNECTED';
  const activeBalance = isLiveActive && brokerAccount ? brokerAccount.balance : account.balance;
  const activeEquity = isLiveActive && brokerAccount ? brokerAccount.equity : account.equity;
  const floatingPnL = activeEquity - activeBalance;
  const relevantCurrencies = getCurrenciesForSymbol(instrument.symbol);

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
      <header className="h-13 bg-[#101520] border-b border-slate-800/90 px-3 flex items-center justify-between select-none z-30 relative shadow-sm">
        {/* LEFT: BRAND, SYMBOL TICKER & TIMEFRAMES */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xs tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline font-mono">
              QuantBacktest<span className="text-indigo-400 font-mono text-[10px] ml-1 px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/40 font-bold hidden 2xl:inline">PRO</span>
            </span>
          </div>

          {/* Clean Symbol Button (TradingView Style) */}
          <button
            onClick={() => setIsSymbolModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700/80 hover:border-indigo-500/50 text-xs font-bold transition-all shadow-xs group shrink-0"
            title={t.searchSymbol}
          >
            <div className="flex items-center gap-1.5">
              {getAssetBadge(instrument.category)}
              <span className="font-mono text-slate-100 group-hover:text-indigo-300 text-xs tracking-wide">
                {instrument.symbol}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
          </button>

          {/* Market Watch Toggle Button */}
          <button
            onClick={() => setMarketWatchOpen(!isMarketWatchOpen)}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono transition-all shrink-0 ${
              isMarketWatchOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800'
            }`}
            title="Mở Bảng giá Market Watch"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden 2xl:inline text-[11px] font-bold">Market Watch</span>
          </button>

          {/* Timeframe Selector (Responsive: Compact on small screens) */}
          <div className="hidden sm:flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 shrink-0">
            <Clock className="w-3 h-3 text-slate-500 ml-1 mr-0.5 hidden 2xl:inline" />
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 2xl:px-2 py-1 rounded text-xs font-mono font-medium transition-all ${
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
          <div className="relative shrink-0 hidden sm:block">
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
              <span className="hidden 2xl:inline text-slate-200 font-bold text-[11px]">
                {chartType === 'candlestick' && t.candleShort}
                {chartType === 'bar' && t.barShort}
                {chartType === 'line' && t.lineShort}
                {chartType === 'area' && t.areaShort}
                {chartType === 'heikin-ashi' && t.heikinAshiShort}
                {chartType === 'hollow' && t.hollowShort}
                {chartType === 'baseline' && t.baselineShort}
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

          {/* Drawing Tools Quick Bar (Desktop Only) */}
          <div className="hidden 2xl:flex items-center gap-0.5 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setActiveTool('cursor')}
              title={t.cursorToolTitle}
              className={`p-1.5 rounded text-xs ${activeTool === 'cursor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ↖
            </button>
            <button
              onClick={() => setActiveTool('trendline')}
              title={t.trendlineToolTitle}
              className={`p-1.5 rounded text-xs font-mono ${activeTool === 'trendline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ╱
            </button>
            <button
              onClick={() => setActiveTool('horizontal')}
              title={t.horizontalRayToolTitle}
              className={`p-1.5 rounded text-xs ${activeTool === 'horizontal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTool('fibonacci')}
              title={t.fibonacciToolTitle}
              className={`p-1.5 rounded text-xs font-mono font-bold ${activeTool === 'fibonacci' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Fib
            </button>
            <button
              onClick={() => setActiveTool('rectangle')}
              title={t.rectangleToolTitle}
              className={`p-1.5 rounded text-xs ${activeTool === 'rectangle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearDrawings}
              title={t.clearAllDrawingsTitle}
              className="p-1.5 rounded text-xs text-slate-500 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Economic Calendar Quick Controls */}
          <div className="relative shrink-0 hidden sm:block">
            <button
              onClick={() => setIsCalendarMenuOpen(!isCalendarMenuOpen)}
              className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs ${
                showEconomicNews
                  ? 'bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400/80 hover:bg-slate-850'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
              title={t.calendarDisplayMode || 'Cài đặt hiển thị lịch kinh tế trên biểu đồ'}
            >
              <Calendar className={`w-3.5 h-3.5 ${showEconomicNews ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="hidden 2xl:inline text-[11px] font-mono">
                {showEconomicNews ? (
                  economicNewsDisplayMode === 'AUTO' ? 'Lịch: Auto' :
                  economicNewsDisplayMode === 'COMPACT' ? 'Lịch: Gọn' :
                  economicNewsDisplayMode === 'CLUSTERED' ? 'Lịch: Gộp' : 'Lịch: Đầy đủ'
                ) : 'Lịch: TẮT'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                showEconomicNews
                  ? (economicNewsFilter === 'HIGH' ? 'bg-rose-500' : economicNewsFilter === 'HIGH_MEDIUM' ? 'bg-amber-400' : 'bg-sky-400')
                  : 'bg-slate-600'
              }`} />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCalendarMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCalendarMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-72 bg-[#111622] border border-slate-700/80 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 font-sans text-xs space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-slate-100 text-xs">
                        {t.calendarDisplayMode || 'Lịch Kinh Tế Trên Biểu Đồ'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleEconomicNews()}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
                        showEconomicNews
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {showEconomicNews ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>

                  {showEconomicNews && (
                    <>
                      {/* Display Mode Options */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                          {t.calendarDisplayMode}:
                        </span>
                        <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                          {[
                            { id: 'AUTO' as const, label: '🧠 ' + (t.calendarModeAuto?.split('(')[0] || 'Auto Smart'), desc: 'Theo timeframe' },
                            { id: 'COMPACT' as const, label: '🏷️ ' + (t.calendarModeCompact?.split('(')[0] || 'Tối giản'), desc: 'Chỉ chấm tròn' },
                            { id: 'CLUSTERED' as const, label: '📦 ' + (t.calendarModeClustered?.split('(')[0] || 'Gộp cụm'), desc: '1 badge / nến' },
                            { id: 'FULL' as const, label: '📜 ' + (t.calendarModeFull?.split('(')[0] || 'Đầy đủ'), desc: 'Chi tiết tin' }
                          ].map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setEconomicNewsDisplayMode(mode.id)}
                              className={`p-1.5 rounded-lg border text-left transition-all ${
                                economicNewsDisplayMode === mode.id
                                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="text-[11px] truncate">{mode.label}</div>
                              <div className="text-[9px] text-slate-500 truncate">{mode.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filter by Impact */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                          {t.calendarImpactLabel}:
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          <button
                            onClick={() => setEconomicNewsFilter('HIGH')}
                            className={`flex-1 py-1 px-1.5 rounded border transition-all text-center ${
                              economicNewsFilter === 'HIGH'
                                ? 'bg-rose-950 text-rose-300 border-rose-500/60 font-bold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            🔴 Chỉ Tin Đỏ
                          </button>
                          <button
                            onClick={() => setEconomicNewsFilter('HIGH_MEDIUM')}
                            className={`flex-1 py-1 px-1.5 rounded border transition-all text-center ${
                              economicNewsFilter === 'HIGH_MEDIUM'
                                ? 'bg-amber-950 text-amber-300 border-amber-500/60 font-bold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            🟡 Đỏ + Vàng
                          </button>
                          <button
                            onClick={() => setEconomicNewsFilter('ALL')}
                            className={`flex-1 py-1 px-1.5 rounded border transition-all text-center ${
                              economicNewsFilter === 'ALL'
                                ? 'bg-sky-950 text-sky-300 border-sky-500/60 font-bold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Tất Cả
                          </button>
                        </div>
                      </div>

                      {/* Filter by Current Pair Checkbox */}
                      <div className="pt-2 border-t border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={economicNewsOnlyCurrentPair}
                            onChange={(e) => setEconomicNewsOnlyCurrentPair(e.target.checked)}
                            className="accent-indigo-500 rounded cursor-pointer w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-slate-300">
                            Chỉ tin liên quan <span className="text-amber-300 font-mono font-bold">{instrument.symbol}</span> ({relevantCurrencies.filter(c => c !== 'GLOBAL').join(', ')})
                          </span>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: ACCOUNT METRICS & ACTIONS */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* LIVE BROKER MODE SWITCHER & CONNECTION HUD */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setBrokerModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                brokerStatus === 'CONNECTED'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-600'
              }`}
              title="Quản lý kết nối Sàn Giao Dịch (Exness, MT5, XTB, Binance)"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  brokerStatus === 'CONNECTED'
                    ? 'bg-emerald-400 animate-pulse'
                    : brokerStatus === 'CONNECTING'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-slate-500'
                }`}
              />
              <span className="font-mono font-bold text-[11px] hidden sm:inline">
                {brokerStatus === 'CONNECTED'
                  ? `${activeBroker === 'MT5_EXNESS' ? 'EXNESS' : activeBroker} #${brokerAccount?.login || ''}`
                  : 'Broker'}
              </span>
              {brokerStatus === 'CONNECTED' && pingLatency > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono hidden xl:inline">
                  {pingLatency}ms
                </span>
              )}
            </button>

            {/* Mode Switcher Toggle */}
            {brokerStatus === 'CONNECTED' && (
              <button
                onClick={() => setLiveTradingMode(!isLiveActive)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                  isLiveActive
                    ? 'bg-rose-950/90 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-500/20'
                    : 'bg-indigo-950/90 border-indigo-500/60 text-indigo-300'
                }`}
                title={isLiveActive ? 'Chuyển về Replay Sandbox' : 'Chuyển sang Live Broker Mode'}
              >
                {isLiveActive ? '🔴 LIVE' : '🔄 REPLAY'}
              </button>
            )}
          </div>

          {/* Smart Live Account Widget (Desktop & Laptop) */}
          <div 
            className="hidden xl:flex items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono select-none shrink-0"
            title={`${t.balanceLabel}: $${activeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} • ${t.equityLabel}: $${activeEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })} • ${t.floatingPnLLabel}: ${floatingPnL >= 0 ? '+' : ''}$${floatingPnL.toFixed(2)}`}
          >
            {floatingPnL === 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium hidden 2xl:inline">{t.balanceLabel}:</span>
                <span className="font-bold text-slate-200">${activeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium hidden 2xl:inline">{t.equityLabel}:</span>
                  <span className={`font-bold ${activeEquity >= activeBalance ? 'text-teal-400' : 'text-rose-400'}`}>
                    ${activeEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight ${floatingPnL > 0 ? 'bg-teal-950/80 text-teal-300 border border-teal-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'}`}>
                  {floatingPnL > 0 ? '+' : ''}${floatingPnL.toFixed(2)} ({activeBalance > 0 ? ((floatingPnL / activeBalance) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            )}
          </div>

          {/* New Order Button */}
          <button
            onClick={() => setOrderModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.orderEntry}</span>
          </button>

          {/* Desktop & Laptop Action Buttons Group */}
          <div className="hidden xl:flex items-center gap-1.5 shrink-0">
            {/* AI Strategy Studio Button */}
            <button
              onClick={() => setAIModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 shrink-0 ${
                autoTradingEnabled
                  ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/25 animate-pulse'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
              title="AI Strategy Studio"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden 2xl:inline">AI Studio</span>
              {autoTradingEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* MORE TOOLS DROPDOWN (Sessions, Analytics, Data Manager, Remote Access, Shortcuts) */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                  isMoreMenuOpen
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                }`}
                title={t.moreToolsDesc || 'Công cụ mở rộng và tiện ích'}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-xs font-semibold">{t.moreTools || 'Công cụ'}</span>
                {isTunnelActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400 animate-pulse" />
                )}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[#111622] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 font-sans text-xs space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono border-b border-slate-800/80 mb-1 flex items-center justify-between">
                      <span>{t.moreTools || 'Công cụ mở rộng'}</span>
                      <span className="text-[9px] text-indigo-400 font-normal">Pro Suite</span>
                    </div>

                    {/* Sessions */}
                    <button
                      onClick={() => {
                        setSessionManagerOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">{t.sessions}</div>
                          <div className="text-[10px] text-slate-500">{t.sessionManagerDesc?.slice(0, 30) || 'Quản lý phiên replay'}...</div>
                        </div>
                      </div>
                    </button>

                    {/* Analytics */}
                    <button
                      onClick={() => {
                        setAnalyticsModalOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">{t.analytics}</div>
                          <div className="text-[10px] text-slate-500">Báo cáo hiệu suất & Win Rate</div>
                        </div>
                      </div>
                    </button>

                    {/* Data Manager */}
                    <button
                      onClick={() => {
                        setDataModalOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">{t.dataImport}</div>
                          <div className="text-[10px] text-slate-500">Import CSV & Crawl dữ liệu</div>
                        </div>
                      </div>
                    </button>

                    {/* Remote Access */}
                    <button
                      onClick={() => {
                        setTunnelModalOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">{t.remoteTunnel || 'Remote Access'}</span>
                            {isTunnelActive && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                                ONLINE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">Cloudflare Tunnel p2p</div>
                        </div>
                      </div>
                    </button>

                    {/* Shortcuts */}
                    <div className="pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setShortcutsModalOpen(true);
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{t.shortcuts}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          Shift + ?
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Language Switcher */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 transition-colors"
                title={t.languageLabel}
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
          </div>

          {/* USER PROFILE / AUTH BUTTON */}
          {isAuthenticated && user ? (
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-full transition-all active:scale-95 shrink-0"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-indigo-500/50"
              />
              <span className="text-xs font-semibold text-slate-200 hidden 2xl:inline max-w-[80px] truncate">
                {user.name}
              </span>
              <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950">
                {user.tier}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.login}</span>
            </button>
          )}

          {/* MOBILE & TABLET HAMBURGER BUTTON (Visible on < xl) */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="xl:hidden p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg transition-colors ml-0.5 shrink-0"
            title={t.sessionManagerTitle}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-[#111622] border-l border-slate-800 shadow-2xl p-4 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 font-mono">
            {/* Top Drawer Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-100">Quant Backtest Pro</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Quick Stats */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t.balanceLabel}:</span>
                  <span className="font-bold text-slate-200">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t.equityLabel}:</span>
                  <span className={`font-bold ${account.equity >= account.balance ? 'text-teal-400' : 'text-rose-400'}`}>
                    ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Drawer Menu Links */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => { setAIModalOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span>AI Strategy Studio</span>
                </button>

                <button
                  onClick={() => { setSessionManagerOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <span>{t.sessionManagerTitle}</span>
                </button>

                <button
                  onClick={() => { setAnalyticsModalOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>{t.analytics}</span>
                </button>

                <button
                  onClick={() => { setDataModalOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>{t.dataImport}</span>
                </button>

                <button
                  onClick={() => { setTunnelModalOpen(true); setIsMobileDrawerOpen(false); }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    isTunnelActive
                      ? 'bg-emerald-950/80 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-teal-400" />
                    <span>{t.remoteTunnelTitle || 'Truy Cập Từ Xa'}</span>
                  </div>
                  {isTunnelActive && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold">ONLINE</span>
                  )}
                </button>

                <button
                  onClick={() => { setShortcutsModalOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <span>{t.shortcuts}</span>
                </button>
              </div>
            </div>

            {/* Bottom Drawer Section: Language & Auth */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.languageLabel}</span>
                </span>
                <div className="flex items-center gap-1">
                  {languages.map(item => (
                    <button
                      key={item.code}
                      onClick={() => setLanguage(item.code)}
                      className={`px-1.5 py-0.5 rounded text-[11px] ${language === item.code ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                      {item.flag}
                    </button>
                  ))}
                </div>
              </div>

              {isAuthenticated && user && (
                <button
                  onClick={() => { setProfileModalOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{user.name} ({user.tier})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SYMBOL SEARCH MODAL (TRADINGVIEW STYLE) */}
      <SymbolSearchModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        currentSymbol={instrument.symbol}
        onSelectSymbol={(sym) => setInstrument(sym)}
      />

      {/* BROKER CONNECTION MODAL */}
      <BrokerConnectionModal />

      {/* MARKET WATCH DRAWER */}
      <MarketWatchDrawer />
    </>
  );
};
