import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Download,
  Award,
  AlertTriangle,
  Percent,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Dice5,
  Calendar,
  Grid,
  Database,
  Layers,
  Save,
  RefreshCw,
  BarChart3,
  GitCompare,
  CheckSquare,
  Square,
  Trophy,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  FolderKanban,
  Sparkles,
  Clock,
  CalendarDays,
  Lock
} from 'lucide-react';
import { AnalyticsEngine, MonteCarloResult, DayHourHeatmapCell, MonthlyCalendarGroup, DailyCalendarCell, PerformanceReport } from '../../engine/analytics';
import { useBacktestStore } from '../../store/backtestStore';
import { useAuthStore } from '../../store/authStore';
import { getTranslation, formatDate } from '../../i18n';
import { analyticsApi, sessionsApi } from '../../api';

export const AnalyticsDashboardModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'montecarlo' | 'heatmap' | 'comparison' | 'database'>('overview');
  const [heatmapViewMode, setHeatmapViewMode] = useState<'calendar_view' | 'hourly_matrix'>('calendar_view');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ACTIVE_SESSION');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);

  // Custom Dropdown UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Comparison State
  const [comparisonSessionIds, setComparisonSessionIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoadingComparison, setIsLoadingComparison] = useState<boolean>(false);

  // Portfolio Dashboard Data
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const {
    isAnalyticsModalOpen,
    setAnalyticsModalOpen,
    activeSessionId,
    closedPositions,
    account,
    equityCurve,
    instrument,
    language,
    isServerOnline
  } = useBacktestStore();

  const t = getTranslation(language);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch available sessions list from DB
  const fetchSessionList = async () => {
    try {
      const list = await sessionsApi.list();
      setSessionList(list);
      if (comparisonSessionIds.length === 0 && list.length > 0) {
        setComparisonSessionIds(list.slice(0, 3).map((s: any) => s.id));
      }
    } catch (e) {}
  };

  const fetchPortfolio = async () => {
    setIsLoadingDB(true);
    try {
      const data = await analyticsApi.dashboard();
      setPortfolioData(data);
    } catch (err) {
      console.warn('Failed to load portfolio analytics', err);
    } finally {
      setIsLoadingDB(false);
    }
  };

  // 2. Fetch specific session detail when dropdown changes
  const fetchSelectedSessionDetail = async (id: string) => {
    if (id === 'ACTIVE_SESSION') {
      setSelectedSessionDetail(null);
      return;
    }
    setIsLoadingSession(true);
    try {
      const session = await sessionsApi.get(id);
      setSelectedSessionDetail(session);
    } catch (err) {
      console.warn('Failed to load session detail', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // 3. Fetch data for comparison matrix
  const fetchComparisonDetails = async (ids: string[]) => {
    if (ids.length === 0) {
      setComparisonData([]);
      return;
    }
    setIsLoadingComparison(true);
    try {
      const details = await Promise.all(
        ids.map(async (id) => {
          if (id === 'ACTIVE_SESSION') {
            const activeReport = AnalyticsEngine.calculateReport(account.initialBalance, closedPositions);
            return {
              id: 'ACTIVE_SESSION',
              name: `${instrument.symbol} (Active Replay)`,
              symbol: instrument.symbol,
              timeframe: 'M5',
              initialBalance: account.initialBalance,
              finalEquity: account.equity,
              report: activeReport
            };
          }
          const s = await sessionsApi.get(id);
          const closedTrades = (s.trades || [])
            .filter((t: any) => t.status === 'CLOSED')
            .map((t: any) => ({
              ...t,
              realizedPnL: t.realizedPnL || 0,
              commission: t.commission || 0,
              swap: t.swap || 0
            }));
          const rep = AnalyticsEngine.calculateReport(s.initialBalance, closedTrades);
          return {
            id: s.id,
            name: s.name,
            symbol: s.symbol,
            timeframe: s.timeframe,
            initialBalance: s.initialBalance,
            finalEquity: s.finalEquity,
            report: rep
          };
        })
      );
      setComparisonData(details);
    } catch (e) {
      console.warn('Failed to load comparison data', e);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const { isAuthenticated, setAuthModalOpen, loginDemoTrader } = useAuthStore();

  useEffect(() => {
    if (isAnalyticsModalOpen && isAuthenticated) {
      fetchSessionList();
      if (activeTab === 'database') fetchPortfolio();
      if (activeTab === 'comparison') fetchComparisonDetails(comparisonSessionIds);
    }
  }, [isAnalyticsModalOpen, activeTab, isAuthenticated]);

  useEffect(() => {
    if (selectedSessionId !== 'ACTIVE_SESSION' && isAuthenticated) {
      fetchSelectedSessionDetail(selectedSessionId);
    } else {
      setSelectedSessionDetail(null);
    }
  }, [selectedSessionId, isAuthenticated]);

  if (!isAnalyticsModalOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none p-2 sm:p-4 font-sans">
        <div className="bg-[#0f1422] border border-amber-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center text-xs relative flex flex-col items-center">
          <button
            onClick={() => setAnalyticsModalOpen(false)}
            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-md shadow-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">{t.authRequiredTitle}</h3>
          <p className="text-slate-400 mb-5 leading-relaxed max-w-sm">
            {t.authRequiredAnalytics}
          </p>
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => {
                setAnalyticsModalOpen(false);
                setAuthModalOpen(true, 'login');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98 transition-all"
            >
              <span>{t.loginNow}</span>
            </button>
            <button
              onClick={async () => {
                await loginDemoTrader();
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-medium rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.quickDemoLogin}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Resolve target report & data depending on selected session
  let report: PerformanceReport;
  let monteCarlo: MonteCarloResult;
  let heatmapData: DayHourHeatmapCell[];
  let monthlyCalendars: MonthlyCalendarGroup[];
  let targetEquityCurve: any[];
  let currentSymbolName = instrument.symbol;
  let currentSessionTitle = t.currentActiveSessionLabel;

  if (selectedSessionDetail && selectedSessionId !== 'ACTIVE_SESSION') {
    const s = selectedSessionDetail;
    currentSymbolName = s.symbol;
    currentSessionTitle = s.name;
    const closedTrades = (s.trades || [])
      .filter((t: any) => t.status === 'CLOSED')
      .map((t: any) => ({
        ...t,
        realizedPnL: t.realizedPnL || 0,
        commission: t.commission || 0,
        swap: t.swap || 0,
        openTime: Number(t.openTime),
        closeTime: t.closeTime ? Number(t.closeTime) : undefined
      }));
    report = AnalyticsEngine.calculateReport(s.initialBalance, closedTrades);
    monteCarlo = AnalyticsEngine.runMonteCarlo(s.initialBalance, closedTrades, 1000);
    heatmapData = AnalyticsEngine.calculateHeatmap(closedTrades);
    monthlyCalendars = AnalyticsEngine.calculateMonthlyCalendars(closedTrades);
    targetEquityCurve = (s.equityPoints && s.equityPoints.length > 0)
      ? s.equityPoints.map((ep: any) => ({ timestamp: Number(ep.timestamp), balance: ep.balance, equity: ep.equity }))
      : [{ timestamp: 0, balance: s.initialBalance, equity: s.finalEquity }];
  } else {
    // Current Active Replay Session
    report = AnalyticsEngine.calculateReport(account.initialBalance, closedPositions);
    monteCarlo = AnalyticsEngine.runMonteCarlo(account.initialBalance, closedPositions, 1000);
    heatmapData = AnalyticsEngine.calculateHeatmap(closedPositions);
    monthlyCalendars = AnalyticsEngine.calculateMonthlyCalendars(closedPositions);
    targetEquityCurve = equityCurve;
  }

  const handleSaveSnapshot = async () => {
    const targetId = selectedSessionId === 'ACTIVE_SESSION' ? activeSessionId : selectedSessionId;
    if (!targetId) return;
    setSaveStatus('saving');
    try {
      await analyticsApi.saveSession(targetId, {
        totalTrades: report.totalTrades,
        winTrades: report.winTrades,
        lossTrades: report.lossTrades,
        winRate: report.winRate,
        grossProfit: report.grossProfit,
        grossLoss: report.grossLoss,
        netProfit: report.netProfit,
        profitFactor: report.profitFactor,
        expectedPayoff: report.expectedPayoff,
        maxDrawdownAmount: report.maxDrawdownAmount,
        maxDrawdownPercent: report.maxDrawdownPercent,
        avgWin: report.avgWin,
        avgLoss: report.avgLoss,
        riskRewardRatio: report.riskRewardRatio,
        consecutiveWins: report.consecutiveWins,
        consecutiveLosses: report.consecutiveLosses,
        sharpeRatio: report.sharpeRatio,
        sortinoRatio: report.sortinoRatio,
        heatmapData: heatmapData,
        monteCarloData: monteCarlo
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleExportCSV = () => {
    const targetTrades = selectedSessionDetail ? (selectedSessionDetail.trades || []).filter((t: any) => t.status === 'CLOSED') : closedPositions;
    if (targetTrades.length === 0) return;

    let csvContent = 'ID,Symbol,Side,Lot,EntryPrice,ClosePrice,OpenTime,CloseTime,Commission,Swap,RealizedPnL,Reason,Tags,Note\n';
    targetTrades.forEach((p: any) => {
      const tagStr = p.tags ? (typeof p.tags === 'string' ? p.tags : p.tags.join(';')) : '';
      csvContent += `${p.id},${p.symbol},${p.side},${p.lotSize},${p.entryPrice},${p.closePrice},${p.openTime},${p.closeTime},${p.commission || 0},${p.swap || 0},${p.realizedPnL},${p.closeReason || ''},"${tagStr}","${p.note || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_${currentSymbolName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleComparisonSession = (id: string) => {
    const next = comparisonSessionIds.includes(id)
      ? comparisonSessionIds.filter(x => x !== id)
      : [...comparisonSessionIds, id];
    setComparisonSessionIds(next);
    fetchComparisonDetails(next);
  };

  // Filtered session list for search
  const filteredSessions = sessionList.filter(s =>
    s.name.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
    s.symbol.toLowerCase().includes(sessionSearchQuery.toLowerCase())
  );

  // Helper render Equity Chart SVG
  const renderEquityChart = () => {
    if (targetEquityCurve.length < 2) {
      return (
        <div className="h-40 flex items-center justify-center text-slate-500 text-xs font-mono">
          {t.equityCurveMinPoints}
        </div>
      );
    }

    const minBalance = Math.min(...targetEquityCurve.map(p => Math.min(p.balance, p.equity))) * 0.98;
    const maxBalance = Math.max(...targetEquityCurve.map(p => Math.max(p.balance, p.equity))) * 1.02;
    const range = maxBalance - minBalance || 1;

    const width = 750;
    const height = 150;
    const padding = 20;

    const points = targetEquityCurve.map((pt, idx) => {
      const x = padding + (idx / (targetEquityCurve.length - 1)) * (width - padding * 2);
      const y = height - padding - ((pt.equity - minBalance) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const balancePoints = targetEquityCurve.map((pt, idx) => {
      const x = padding + (idx / (targetEquityCurve.length - 1)) * (width - padding * 2);
      const y = height - padding - ((pt.balance - minBalance) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative w-full h-44 bg-slate-950 p-2 rounded-lg border border-slate-800">
        <div className="absolute top-2 left-3 flex items-center gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-teal-400">
            <span className="w-2 h-2 rounded-full bg-teal-400" /> Equity Curve
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Balance
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <polyline fill="none" stroke="#6366f1" strokeWidth="1.5" points={balancePoints} />
          <polyline fill="none" stroke="#2dd4bf" strokeWidth="2" points={points} />
        </svg>
      </div>
    );
  };

  // Helper render Monte Carlo Chart SVG
  const renderMonteCarloChart = () => {
    if (monteCarlo.simulationPaths.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-slate-500 text-xs font-mono">
          {t.monteCarloMinTrades}
        </div>
      );
    }

    const allValues = monteCarlo.simulationPaths.flat();
    const minVal = Math.min(...allValues) * 0.95;
    const maxVal = Math.max(...allValues) * 1.05;
    const range = maxVal - minVal || 1;

    const width = 750;
    const height = 160;
    const padding = 20;

    const colors = ['#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#f43f5e', '#fb923c', '#eab308', '#22c55e', '#14b8a6', '#06b6d4'];

    return (
      <div className="relative w-full h-48 bg-slate-950 p-2 rounded-lg border border-slate-800">
        <div className="absolute top-2 left-3 text-[10px] font-mono text-purple-300">
          {t.monteCarloSimPaths}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
          {monteCarlo.simulationPaths.map((path, pIdx) => {
            const polyPoints = path.map((val, idx) => {
              const x = padding + (idx / (path.length - 1)) * (width - padding * 2);
              const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
              return `${x},${y}`;
            }).join(' ');

            return (
              <polyline
                key={pIdx}
                fill="none"
                stroke={colors[pIdx % colors.length]}
                strokeWidth="1.2"
                opacity={0.7}
                points={polyPoints}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  // Find best performer in comparison
  const bestSession = comparisonData.length > 0
    ? [...comparisonData].sort((a, b) => (b.report.netProfit - a.report.netProfit))[0]
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in select-none p-2 sm:p-4">
      <div className="bg-[#0f141f] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-xs">
        
        {/* TOP HEADER: Clean Title & Primary Actions */}
        <div className="bg-[#0b0e17] border-b border-slate-800 px-3 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-sm shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">{t.analyticsTitle}</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                  QUANT ANALYTICS PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {t.analyticsSub}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleSaveSnapshot}
              disabled={saveStatus === 'saving'}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title={t.saveSnapshotTitle}
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {saveStatus === 'saving' ? t.savingSnapshot : saveStatus === 'success' ? t.snapshotSaved : t.saveSnapshot}
              </span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title={t.exportCSV}
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{t.exportCSV}</span>
            </button>

            <button
              onClick={() => setAnalyticsModalOpen(false)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUB-BAR: Dedicated Luxury Session Selector & Navigation Tabs */}
        <div className="bg-[#0e121d] border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2.5 shrink-0">
          
          {/* LEFT: LUXURY CUSTOM SESSION SELECTOR (Anchored with left-0 so it NEVER clips!) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/95 hover:bg-slate-800 border border-slate-700/90 hover:border-indigo-500/70 rounded-xl text-xs transition-all shadow-md group max-w-[calc(100vw-3rem)]"
            >
              <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex flex-col text-left max-w-[160px] sm:max-w-[280px]">
                <span className="text-[9px] text-slate-400 uppercase font-sans font-bold tracking-wider">
                  {t.selectSessionPrompt}
                </span>
                <span className="font-bold text-slate-100 truncate text-[11px] font-mono group-hover:text-indigo-300 transition-colors">
                  {selectedSessionId === 'ACTIVE_SESSION' ? `🌟 ${t.currentActiveSessionLabel}` : (selectedSessionDetail?.name || t.selectSessionPlaceholder)}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {/* DROPDOWN POPOVER MENU (Anchored to left-0, extends to the right with ample space) */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-84 sm:w-96 max-w-[calc(100vw-2rem)] bg-[#111726] border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                
                {/* Search input */}
                <div className="relative mb-2 px-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t.searchSessionsPlaceholder}
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {/* Active Replay Session Card */}
                  <div
                    onClick={() => {
                      setSelectedSessionId('ACTIVE_SESSION');
                      setIsDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                      selectedSessionId === 'ACTIVE_SESSION'
                        ? 'bg-indigo-950/70 border-indigo-500/70 text-white shadow-md'
                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                          <span>🌟 {t.currentActiveSessionLabel}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono">LIVE REPLAY</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {instrument.symbol} • {closedPositions.length} {t.closedTradesCount}
                        </div>
                      </div>
                    </div>
                    {selectedSessionId === 'ACTIVE_SESSION' && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </div>

                  {/* Divider Title */}
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 pt-2 pb-0.5 font-mono">
                    {t.savedSessionsInDB} ({filteredSessions.length})
                  </div>

                  {/* Saved Sessions Cards */}
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs font-mono">
                      {t.noSessionsMatch}
                    </div>
                  ) : (
                    filteredSessions.map((s) => {
                      const isSelected = selectedSessionId === s.id;
                      const pnl = s.finalEquity - s.initialBalance;
                      const isProfit = pnl >= 0;

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSessionId(s.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-950/70 border-indigo-500/70 text-white shadow-md'
                              : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs text-slate-200 truncate flex items-center gap-1.5">
                              <span>{s.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span className="text-indigo-300 font-bold">{s.symbol}</span>
                              <span>•</span>
                              <span>{s.timeframe}</span>
                              <span>•</span>
                              <span>{s._count?.trades || 0} {t.tradesCountLabel}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <div className={`font-bold text-xs ${isProfit ? 'text-teal-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}${pnl.toFixed(2)}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto mt-0.5" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: NAVIGATION TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.overviewTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('montecarlo')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'montecarlo' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Dice5 className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.monteCarloTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'heatmap' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.heatmapTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('comparison');
                fetchComparisonDetails(comparisonSessionIds);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'comparison' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.comparisonTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('database');
                fetchPortfolio();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'database' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.portfolioTab}</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono">
          {isLoadingSession ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40 text-indigo-400" />
              {t.loadingAnalyticsReport}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* EQUITY CURVE GRAPH */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>{t.equityGrowth}:</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {t.sessionLabel} <strong className="text-slate-200">{currentSessionTitle}</strong> ({currentSymbolName})
                      </span>
                    </div>
                    {renderEquityChart()}
                  </div>

                  {/* KEY METRICS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-3.5 rounded-xl shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] font-medium">{t.netProfit}</span>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className={`text-xl font-bold mt-1 ${report.netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                        {report.netProfit >= 0 ? '+' : ''}${report.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {report.netProfit >= 0 ? t.netProfitStatus : t.netLossStatus}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-3.5 rounded-xl shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] font-medium">{t.winRate}</span>
                        <Percent className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="text-xl font-bold text-indigo-300 mt-1">{report.winRate}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{report.winTrades} {t.winTradesCount} / {report.lossTrades} {t.lossTradesCount}</div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-3.5 rounded-xl shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] font-medium">{t.profitFactor}</span>
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className={`text-xl font-bold mt-1 ${report.profitFactor >= 1.5 ? 'text-teal-400' : report.profitFactor >= 1.0 ? 'text-slate-200' : 'text-rose-400'}`}>
                        {report.profitFactor > 99 ? '99+' : report.profitFactor.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {report.profitFactor >= 1.5 ? t.profitFactorExcellent : report.profitFactor >= 1.0 ? t.profitFactorBalanced : t.profitFactorSuboptimal}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-3.5 rounded-xl shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] font-medium">{t.maxDrawdown}</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="text-xl font-bold text-rose-400 mt-1">{report.maxDrawdownPercent.toFixed(2)}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">-${report.maxDrawdownAmount.toFixed(2)} USD</div>
                    </div>
                  </div>

                  {/* WIN / LOSS PROGRESS BAR */}
                  {report.totalTrades > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t.winTradesCount}: {report.winTrades} ({report.winRate}%)</span>
                        </span>
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>{t.lossTradesCount}: {report.lossTrades} ({(100 - report.winRate).toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all"
                          style={{ width: `${report.winRate}%` }}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-700 transition-all"
                          style={{ width: `${100 - report.winRate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CATEGORIZED DETAILED STATS TABLE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Card 1: Profitability */}
                    <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                      <div className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{t.profitabilityCardTitle}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.grossProfit}:</span>
                          <span className="font-bold text-teal-400">+${report.grossProfit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.grossLoss}:</span>
                          <span className="font-bold text-rose-400">-${Math.abs(report.grossLoss).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.profitFactor}:</span>
                          <span className="font-bold text-slate-200">{report.profitFactor.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.expectedPayoff}:</span>
                          <span className="font-bold text-indigo-300">${report.expectedPayoff.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Precision & Sizing */}
                    <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                      <div className="font-bold text-indigo-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{t.ratiosVolumeCardTitle}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.totalTrades}:</span>
                          <span className="font-bold text-slate-200">{report.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.avgWin}:</span>
                          <span className="font-bold text-teal-400">+${report.avgWin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.avgLoss}:</span>
                          <span className="font-bold text-rose-400">-${Math.abs(report.avgLoss).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.riskReward}:</span>
                          <span className="font-bold text-indigo-300">1 : {report.riskRewardRatio.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Streaks & Consistency */}
                    <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                      <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                        <Award className="w-3.5 h-3.5" />
                        <span>{t.streaksCardTitle}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.consecutiveWins}:</span>
                          <span className="font-bold text-teal-400">{report.consecutiveWins} {t.streaksWinsLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.consecutiveLosses}:</span>
                          <span className="font-bold text-rose-400">{report.consecutiveLosses} {t.streaksLossesLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.winTradesRatioLabel}</span>
                          <span className="font-bold text-slate-200">{report.winRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.lossTradesRatioLabel}</span>
                          <span className="font-bold text-slate-200">{(100 - report.winRate).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Institutional Risk */}
                    <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                      <div className="font-bold text-purple-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{t.institutionalRiskCardTitle}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.sharpeRatio}:</span>
                          <span className="font-bold text-slate-200">{report.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.sortinoRatio}:</span>
                          <span className="font-bold text-teal-400">{report.sortinoRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Calmar Ratio:</span>
                          <span className="font-bold text-amber-300">{report.calmarRatio ? report.calmarRatio.toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">{t.sqnScoreLabel}</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                            {report.systemQualityNumber?.toFixed(2) || '0.00'} ({report.sqnRating || 'N/A'})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.maxDrawdown}:</span>
                          <span className="font-bold text-rose-400">{report.maxDrawdownPercent.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MONTE CARLO */}
              {activeTab === 'montecarlo' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
                      {t.monteCarloDesc}
                    </p>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      monteCarlo.riskOfRuinPercent === 0
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : monteCarlo.riskOfRuinPercent < 5
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                        : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                    }`}>
                      <Dice5 className="w-3.5 h-3.5" />
                      <span>{monteCarlo.riskOfRuinPercent === 0 ? t.riskOfRuinSafe : t.riskOfRuinProb.replace('{prob}', monteCarlo.riskOfRuinPercent.toString())}</span>
                    </div>
                  </div>

                  {renderMonteCarloChart()}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <div className="text-slate-400 text-[11px]">{t.medianProfit}:</div>
                      <div className="text-lg font-bold text-teal-400 mt-1">${monteCarlo.medianProfit.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.medianProfitSub}</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <div className="text-slate-400 text-[11px]">{t.worstCaseDD}:</div>
                      <div className="text-lg font-bold text-rose-400 mt-1">{monteCarlo.worstCaseDrawdown.toFixed(2)}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.worstCaseDDSub}</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <div className="text-slate-400 text-[11px]">{t.percentile95DD}:</div>
                      <div className="text-lg font-bold text-amber-400 mt-1">{monteCarlo.percentile95Drawdown.toFixed(2)}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.percentile95DDSub}</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <div className="text-slate-400 text-[11px]">{t.riskOfRuin}:</div>
                      <div className="text-lg font-bold text-purple-300 mt-1">{monteCarlo.riskOfRuinPercent.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.riskOfRuinSub}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HEATMAP (INSTITUTIONAL DUAL-MODE: CALENDAR VIEW + HOURLY MATRIX) */}
              {activeTab === 'heatmap' && (() => {
                const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
                const dayLabels = t.heatmapDays.split(',');

                const calendarWeekHeaders = t.calendarHeaders.split(',');

                // Current selected calendar month
                const validMonthIdx = Math.max(0, Math.min(selectedMonthIdx, monthlyCalendars.length - 1));
                const currentMonth = monthlyCalendars[validMonthIdx] || monthlyCalendars[0];

                // Hourly matrix insights
                const activeCells = heatmapData.filter(c => c.tradesCount > 0);
                const bestCell = activeCells.length > 0 ? [...activeCells].sort((a, b) => b.pnl - a.pnl)[0] : null;
                const worstCell = activeCells.length > 0 ? [...activeCells].sort((a, b) => a.pnl - b.pnl)[0] : null;

                const dayPnL: Record<number, { pnl: number; count: number }> = {};
                for (let d = 1; d <= 5; d++) dayPnL[d] = { pnl: 0, count: 0 };
                heatmapData.forEach(c => {
                  if (dayPnL[c.day]) {
                    dayPnL[c.day].pnl += c.pnl;
                    dayPnL[c.day].count += c.tradesCount;
                  }
                });
                const bestDayIdx = Object.keys(dayPnL).map(Number).sort((a, b) => dayPnL[b].pnl - dayPnL[a].pnl)[0] || 1;

                return (
                  <div className="space-y-4">
                    {/* VIEW MODE SELECTOR BAR */}
                    <div className="bg-[#0b0e17] p-2 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-sans font-medium">{t.analysisModeLabel}</span>
                        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => setHeatmapViewMode('calendar_view')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                              heatmapViewMode === 'calendar_view'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{t.calendarViewTab}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeatmapViewMode('hourly_matrix')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                              heatmapViewMode === 'hourly_matrix'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t.hourlyMatrixTab}</span>
                          </button>
                        </div>
                      </div>

                      {/* Month Navigator if in Calendar View */}
                      {heatmapViewMode === 'calendar_view' && monthlyCalendars.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={validMonthIdx <= 0}
                            onClick={() => setSelectedMonthIdx(validMonthIdx - 1)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            title={t.prevMonthTitle}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 font-mono">
                            {currentMonth?.monthLabel || 'Month'}
                          </span>
                          <button
                            type="button"
                            disabled={validMonthIdx >= monthlyCalendars.length - 1}
                            onClick={() => setSelectedMonthIdx(validMonthIdx + 1)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            title={t.nextMonthTitle}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* MODE 1: MONTHLY CALENDAR VIEW (DAY-BY-DAY HEATMAP)           */}
                    {/* ------------------------------------------------------------- */}
                    {heatmapViewMode === 'calendar_view' && (() => {
                      if (!currentMonth) return null;

                      const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();
                      const firstDayDow = new Date(Date.UTC(currentMonth.year, currentMonth.month - 1, 1)).getUTCDay();
                      const startOffset = (firstDayDow + 6) % 7; // Mon=0, Sun=6
                      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
                      const weeksCount = totalCells / 7;

                      return (
                        <div className="space-y-4">
                          {/* MONTHLY SUMMARY METRICS CARDS */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-emerald-400">
                                <DollarSign className="w-3 h-3" />
                                <span>{t.monthlyProfit}</span>
                              </div>
                              <div className={`text-base font-bold mt-1 font-mono ${currentMonth.totalPnL >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                {currentMonth.totalPnL >= 0 ? '+' : ''}${currentMonth.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {currentMonth.totalPnL >= 0 ? t.netProfitStatus : t.monthlyLossLabel}
                              </div>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-indigo-400">
                                <Calendar className="w-3 h-3" />
                                <span>{t.winningDays}</span>
                              </div>
                              <div className="text-base font-bold text-slate-100 mt-1 font-mono">
                                <span className="text-teal-400">{currentMonth.profitableDaysCount} {t.winTradesCount}</span> / <span className="text-rose-400">{currentMonth.lossDaysCount} {t.lossTradesCount}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {t.profitableDaysRatioLabel}: <strong className="text-indigo-300">{currentMonth.profitableDaysCount + currentMonth.lossDaysCount > 0 ? ((currentMonth.profitableDaysCount / (currentMonth.profitableDaysCount + currentMonth.lossDaysCount)) * 100).toFixed(0) : 0}%</strong>
                              </div>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-amber-400">
                                <Sparkles className="w-3 h-3" />
                                <span>{t.bestTradingDay}</span>
                              </div>
                              <div className="text-sm font-bold text-slate-100 mt-1 truncate">
                                {currentMonth.bestDay ? currentMonth.bestDay.dateStr : t.noProfitLabel}
                              </div>
                              <div className="text-[11px] font-bold text-teal-400 mt-0.5">
                                {currentMonth.bestDay ? `+$${currentMonth.bestDay.pnl.toFixed(2)}` : '-'}
                              </div>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-purple-400">
                                <Activity className="w-3 h-3" />
                                <span>{t.tradesInMonth}</span>
                              </div>
                              <div className="text-base font-bold text-slate-100 mt-1 font-mono">
                                {currentMonth.totalTrades} {t.tradesCountLabel}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {t.monthlyWinrateLabel}: <strong className="text-teal-400">{currentMonth.winRate}%</strong>
                              </div>
                            </div>
                          </div>

                          {/* CALENDAR GRID TABLE (7 DAYS + 1 WEEKLY TOTAL COLUMN) */}
                          <div className="bg-[#0b0e17] p-4 rounded-2xl border border-slate-800/90 overflow-x-auto shadow-inner">
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, minmax(80px, 1fr)) 110px',
                                gap: '6px'
                              }}
                              className="min-w-[760px] text-center text-xs"
                            >
                              {/* Headers: Mon..Sun + Week Total */}
                              {calendarWeekHeaders.map((header, hIdx) => (
                                <div
                                  key={header}
                                  className={`p-2 rounded-lg border text-[11px] font-bold font-sans ${
                                    hIdx === 7
                                      ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 uppercase'
                                      : hIdx >= 5
                                      ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                                  }`}
                                >
                                  {header}
                                </div>
                              ))}

                              {/* Rows of Weeks */}
                              {Array.from({ length: weeksCount }).map((_, wIdx) => {
                                let weekTotalPnL = 0;
                                let weekTradesCount = 0;

                                const dayCells = Array.from({ length: 7 }).map((_, dIdx) => {
                                  const cellIndex = wIdx * 7 + dIdx;
                                  const dayNum = cellIndex - startOffset + 1;

                                  if (dayNum < 1 || dayNum > daysInMonth) {
                                    return (
                                      <div
                                        key={dIdx}
                                        className="min-h-[64px] bg-slate-950/20 border border-slate-900/40 rounded-lg"
                                      />
                                    );
                                  }

                                  const dateStr = `${currentMonth.monthKey}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                                  const cellData = currentMonth.days[dateStr];

                                  if (cellData) {
                                    weekTotalPnL += cellData.pnl;
                                    weekTradesCount += cellData.tradesCount;
                                  }

                                  const hasTrades = cellData && cellData.tradesCount > 0;
                                  const isProfit = cellData && cellData.pnl > 0;
                                  const isLoss = cellData && cellData.pnl < 0;

                                  let cellBg = 'bg-slate-950/60 border-slate-800/40 text-slate-500 hover:border-slate-700';
                                  if (hasTrades) {
                                    if (isProfit) cellBg = 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-xs hover:border-emerald-400 hover:scale-105';
                                    else if (isLoss) cellBg = 'bg-rose-950/70 border-rose-500/50 text-rose-300 shadow-xs hover:border-rose-400 hover:scale-105';
                                    else cellBg = 'bg-slate-900 border-slate-700 text-slate-300 hover:scale-105';
                                  }

                                  return (
                                    <div
                                      key={dIdx}
                                      className={`min-h-[64px] p-2 rounded-lg border flex flex-col justify-between transition-all select-none ${cellBg}`}
                                      title={hasTrades ? `${dateStr}: ${cellData.tradesCount} ${t.tradesCountLabel} (PnL: ${cellData.pnl.toFixed(2)})` : dateStr}
                                    >
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className={`font-bold ${hasTrades ? 'text-slate-100' : 'text-slate-600'}`}>{dayNum}</span>
                                        {hasTrades && (
                                          <span className="text-[9px] opacity-75 font-sans">
                                            {cellData.tradesCount}t
                                          </span>
                                        )}
                                      </div>

                                      {hasTrades ? (
                                        <div className="text-center my-auto">
                                          <div className="font-bold text-xs font-mono leading-tight">
                                            {cellData.pnl >= 0 ? `+$${cellData.pnl.toFixed(0)}` : `-$${Math.abs(cellData.pnl).toFixed(0)}`}
                                          </div>
                                          <div className="text-[9px] opacity-80 font-sans mt-0.5">
                                            {cellData.winRate}% win
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center text-slate-800 text-xs font-mono">·</div>
                                      )}
                                    </div>
                                  );
                                });

                                return (
                                  <React.Fragment key={wIdx}>
                                    {dayCells}
                                    {/* Week Summary Cell */}
                                    <div
                                      className={`min-h-[64px] p-2 rounded-lg border flex flex-col items-center justify-center font-mono ${
                                        weekTradesCount > 0
                                          ? weekTotalPnL >= 0
                                            ? 'bg-emerald-950/40 border-emerald-500/30 text-teal-300'
                                            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                                          : 'bg-slate-950/40 border-slate-900/60 text-slate-600'
                                      }`}
                                    >
                                      <span className="text-[10px] font-sans text-slate-400 font-medium uppercase">{t.weekNumberLabel.replace('{num}', (wIdx + 1).toString())}</span>
                                      <span className="font-bold text-xs mt-0.5">
                                        {weekTradesCount > 0
                                          ? (weekTotalPnL >= 0 ? `+$${weekTotalPnL.toFixed(0)}` : `-$${Math.abs(weekTotalPnL).toFixed(0)}`)
                                          : '-'}
                                      </span>
                                      {weekTradesCount > 0 && (
                                        <span className="text-[9px] opacity-75 font-sans mt-0.5">{weekTradesCount} {t.tradesCountLabel}</span>
                                      )}
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ------------------------------------------------------------- */}
                    {/* MODE 2: 2D DAY & HOUR MATRIX (INTRADAY & SESSION HEATMAP)     */}
                    {/* ------------------------------------------------------------- */}
                    {heatmapViewMode === 'hourly_matrix' && (
                      <div className="space-y-4">
                        {/* TOP INSIGHT CARDS */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-emerald-400">
                              <Sparkles className="w-3 h-3" />
                              <span>{t.bestTradingHourCard}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-100 mt-1 truncate">
                              {bestCell ? `${dayLabels[bestCell.day - 1]} @ ${bestCell.hour}:00` : t.notEnoughDataLabel}
                            </div>
                            <div className="text-[11px] font-bold text-teal-400 mt-0.5">
                              {bestCell ? `+${bestCell.pnl.toFixed(2)} (${bestCell.tradesCount} ${t.tradesCountLabel})` : '-'}
                            </div>
                          </div>

                          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-rose-400">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t.worstTradingHourCard}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-100 mt-1 truncate">
                              {worstCell && worstCell.pnl < 0 ? `${dayLabels[worstCell.day - 1]} @ ${worstCell.hour}:00` : t.noMajorLossLabel}
                            </div>
                            <div className="text-[11px] font-bold text-rose-400 mt-0.5">
                              {worstCell && worstCell.pnl < 0 ? `-${Math.abs(worstCell.pnl).toFixed(2)} (${worstCell.tradesCount} ${t.tradesCountLabel})` : '-'}
                            </div>
                          </div>

                          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-indigo-400">
                              <Calendar className="w-3 h-3" />
                              <span>{t.bestDayCard}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-100 mt-1">
                              {dayLabels[bestDayIdx - 1]}
                            </div>
                            <div className="text-[11px] font-bold text-indigo-300 mt-0.5">
                              {dayPnL[bestDayIdx]?.pnl >= 0 ? '+' : ''}${dayPnL[bestDayIdx]?.pnl.toFixed(2)} ({dayPnL[bestDayIdx]?.count} {t.tradesCountLabel})
                            </div>
                          </div>

                          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1 text-amber-400">
                              <Activity className="w-3 h-3" />
                              <span>{t.totalClosedTradesCard}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-100 mt-1">
                              {report.totalTrades} {t.closedTradesSuffix}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Winrate: <strong className="text-teal-400">{report.winRate}%</strong>
                            </div>
                          </div>
                        </div>

                        {/* GLOBAL SESSION COLOR LEGEND */}
                        <div className="bg-slate-900/50 border border-slate-800/80 px-3.5 py-2 rounded-xl flex items-center justify-between text-[11px] flex-wrap gap-2">
                          <span className="text-slate-400 font-sans font-medium">{t.worldTradingSessionsLabel}</span>
                          <div className="flex items-center gap-3 text-[10px] font-sans">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-slate-300">{t.asianSessionLabel}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-slate-300">{t.europeanSessionLabel}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-slate-300">{t.americanSessionLabel}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                              {t.overlapEuroUsLabel}
                            </span>
                          </div>
                        </div>

                        {/* 2D HEATMAP MATRIX TABLE */}
                        <div className="bg-[#0b0e17] p-4 rounded-2xl border border-slate-800/90 overflow-x-auto shadow-inner">
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '95px repeat(12, minmax(62px, 1fr))',
                              gap: '6px'
                            }}
                            className="min-w-[840px] text-center text-xs"
                          >
                            {/* Header Cell: Day / Hour */}
                            <div className="font-bold text-slate-500 p-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-center text-[10px] uppercase font-sans">
                              {t.dayHourMatrixHeader}
                            </div>

                            {/* Hour Column Headers */}
                            {hours.map(h => {
                              let sessionBadge = 'text-slate-400 border-slate-800';
                              if (h >= 13 && h <= 15) sessionBadge = 'text-amber-300 bg-amber-950/40 border-amber-500/30';
                              else if (h >= 8 && h < 16) sessionBadge = 'text-amber-400 bg-slate-900 border-slate-800';
                              else if (h >= 0 && h < 8) sessionBadge = 'text-blue-400 bg-slate-900 border-slate-800';
                              else sessionBadge = 'text-purple-400 bg-slate-900 border-slate-800';

                              return (
                                <div
                                  key={h}
                                  className={`p-1.5 rounded-lg border font-mono font-bold text-[11px] flex flex-col items-center justify-center ${sessionBadge}`}
                                  title={`${h}:00 - ${h + 1}:59 UTC`}
                                >
                                  <span>{h < 10 ? `0${h}` : h}:00</span>
                                </div>
                              );
                            })}

                            {/* 5 Day Rows (Mon - Fri) */}
                            {dayLabels.map((dayName, dIdx) => (
                              <React.Fragment key={dayName}>
                                {/* Day Label with Day Total PnL */}
                                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex flex-col justify-center items-start text-left">
                                  <span className="text-slate-200 font-bold text-xs">{dayName}</span>
                                  <span className={`text-[10px] font-mono font-semibold ${dayPnL[dIdx + 1]?.pnl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                    {dayPnL[dIdx + 1]?.count > 0 
                                      ? (dayPnL[dIdx + 1].pnl >= 0 ? `+$${dayPnL[dIdx + 1].pnl.toFixed(0)}` : `-$${Math.abs(dayPnL[dIdx + 1].pnl).toFixed(0)}`)
                                      : '-'}
                                  </span>
                                </div>

                                {/* 12 Hour Cells */}
                                {hours.map(h => {
                                  const cell = heatmapData.find(c => c.day === dIdx + 1 && Math.abs(c.hour - h) < 2);
                                  const pnl = cell ? cell.pnl : 0;
                                  const count = cell ? cell.tradesCount : 0;
                                  const winRate = cell ? cell.winRate : 0;

                                  let cellStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-600 hover:border-slate-700';
                                  if (count > 0) {
                                    if (pnl > 0) {
                                      cellStyle = 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-xs hover:border-emerald-400 hover:scale-105';
                                    } else if (pnl < 0) {
                                      cellStyle = 'bg-rose-950/70 border-rose-500/50 text-rose-300 shadow-xs hover:border-rose-400 hover:scale-105';
                                    } else {
                                      cellStyle = 'bg-slate-900 border-slate-700 text-slate-300 hover:scale-105';
                                    }
                                  }

                                  return (
                                    <div
                                      key={h}
                                      className={`p-1.5 min-h-[46px] rounded-lg border flex flex-col items-center justify-center transition-all cursor-default select-none ${cellStyle}`}
                                      title={`${dayName} @ ${h}:00 UTC — ${count} ${t.tradesCountLabel} | PnL: ${pnl.toFixed(2)} | WR: ${winRate}%`}
                                    >
                                      {count > 0 ? (
                                        <>
                                          <span className="font-bold text-[11px] font-mono leading-tight">
                                            {pnl >= 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`}
                                          </span>
                                          <span className="text-[9px] opacity-80 font-sans mt-0.5">
                                            {count}t • {winRate}%
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-slate-700 font-mono text-xs">·</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB 4: SESSION COMPARISON */}
              {activeTab === 'comparison' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <GitCompare className="w-4 h-4 text-indigo-400" />
                        {t.compareSessionsTitle}
                      </h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {t.selectSessionsToCompare}
                      </p>
                    </div>

                    {bestSession && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>{t.bestPerformerBadge}: {bestSession.name} (+${bestSession.report.netProfit.toFixed(2)})</span>
                      </div>
                    )}
                  </div>

                  {/* Multi-Session Selector Pills */}
                  <div className="flex items-center gap-2 flex-wrap bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <button
                      onClick={() => toggleComparisonSession('ACTIVE_SESSION')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        comparisonSessionIds.includes('ACTIVE_SESSION')
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {comparisonSessionIds.includes('ACTIVE_SESSION') ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>🌟 {t.currentActiveSessionLabel}</span>
                    </button>

                    {sessionList.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggleComparisonSession(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          comparisonSessionIds.includes(s.id)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {comparisonSessionIds.includes(s.id) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>📁 {s.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Comparison Matrix Table */}
                  {isLoadingComparison ? (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40 text-indigo-400" />
                      {t.processingBtn}
                    </div>
                  ) : comparisonData.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                      {t.selectAtLeastOneSession}
                    </div>
                  ) : (
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80">
                            <th className="p-3 text-slate-400 font-bold">{t.metricCriteriaHeader}</th>
                            {comparisonData.map((c) => (
                              <th key={c.id} className="p-3 font-bold text-slate-200 border-l border-slate-800 min-w-[150px]">
                                <div className="truncate">{c.name}</div>
                                <div className="text-[10px] text-slate-500 font-normal">{c.symbol} • {c.timeframe}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.netProfit}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className={`p-3 font-bold border-l border-slate-800 ${c.report.netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                {c.report.netProfit >= 0 ? '+' : ''}${c.report.netProfit.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.winRate}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 font-bold text-indigo-300 border-l border-slate-800">
                                {c.report.winRate}% <span className="text-[10px] text-slate-500 font-normal">({c.report.winTrades}W/{c.report.lossTrades}L)</span>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.profitFactor}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 font-bold text-slate-200 border-l border-slate-800">
                                {c.report.profitFactor > 99 ? '99+' : c.report.profitFactor.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.maxDrawdown}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 font-bold text-rose-400 border-l border-slate-800">
                                {c.report.maxDrawdownPercent.toFixed(2)}% <span className="text-[10px] text-slate-500 font-normal">(-${c.report.maxDrawdownAmount.toFixed(2)})</span>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.riskReward}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 font-bold text-slate-200 border-l border-slate-800">
                                1 : {c.report.riskRewardRatio.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.totalTrades}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 text-slate-300 border-l border-slate-800">
                                {c.report.totalTrades}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.avgWin} / {t.avgLoss}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 border-l border-slate-800 text-[11px]">
                                <span className="text-teal-400">+${c.report.avgWin.toFixed(1)}</span> / <span className="text-rose-400">-${Math.abs(c.report.avgLoss).toFixed(1)}</span>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-400 font-medium">{t.sharpeRatio}</td>
                            {comparisonData.map((c) => (
                              <td key={c.id} className="p-3 text-slate-300 border-l border-slate-800">
                                {c.report.sharpeRatio.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: DATABASE PORTFOLIO */}
              {activeTab === 'database' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        {t.databasePortfolioTitle}
                      </h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {t.databasePortfolioDesc}
                      </p>
                    </div>
                    <button
                      onClick={fetchPortfolio}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDB ? 'animate-spin' : ''}`} />
                      <span>{t.refreshBtn}</span>
                    </button>
                  </div>

                  {isLoadingDB ? (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40 text-indigo-400" />
                      {t.processingBtn}
                    </div>
                  ) : portfolioData ? (
                    <div className="space-y-4">
                      {/* Aggregated Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                          <div className="text-slate-400 text-[11px]">{t.totalSessionsCount}:</div>
                          <div className="text-lg font-bold text-indigo-300 mt-1">{portfolioData.totalSessions}</div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                          <div className="text-slate-400 text-[11px]">{t.totalTradesAll}:</div>
                          <div className="text-lg font-bold text-slate-200 mt-1">{portfolioData.totalTrades}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{portfolioData.totalWins} W / {portfolioData.totalLosses} L</div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                          <div className="text-slate-400 text-[11px]">{t.portfolioWinRate}:</div>
                          <div className="text-lg font-bold text-teal-400 mt-1">{portfolioData.overallWinRate}%</div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                          <div className="text-slate-400 text-[11px]">{t.portfolioNetProfit}:</div>
                          <div className={`text-lg font-bold mt-1 ${portfolioData.totalNetProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                            {portfolioData.totalNetProfit >= 0 ? '+' : ''}${portfolioData.totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Sessions Breakdown Table */}
                      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
                          <span>{t.sessionHistoryTitle} ({portfolioData.sessions?.length || 0})</span>
                          <span className="text-[10px] text-slate-500 font-normal">{t.clickToViewReport}</span>
                        </div>
                        <div className="divide-y divide-slate-900 max-h-60 overflow-y-auto">
                          {(portfolioData.sessions || []).map((s: any) => {
                            const net = s.finalEquity ? (s.finalEquity - s.initialBalance) : (s.analytics?.netProfit || 0);
                            const isWin = net >= 0;
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  setSelectedSessionId(s.id);
                                  setActiveTab('overview');
                                }}
                                className="px-4 py-3 flex items-center justify-between text-xs hover:bg-indigo-950/30 cursor-pointer transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-slate-200 hover:text-indigo-300 flex items-center gap-1.5">
                                    <span>{s.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">{t.viewReportBadge}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {s.symbol} • {s.timeframe} • {formatDate(s.createdAt, language)} • {s.tradeCount} {t.tradesCountLabel}
                                  </div>
                                </div>
                                <div className="text-right font-mono">
                                  <div className={`font-bold ${isWin ? 'text-teal-400' : 'text-rose-400'}`}>
                                    {isWin ? '+' : ''}${net.toFixed(2)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {t.capitalLabel}: ${s.initialBalance.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="h-10 bg-[#0b0e17] border-t border-slate-800 px-6 flex items-center justify-between text-slate-500 text-[11px] font-mono">
          <span>Quant Backtest Pro Institutional Analytics & Comparison Matrix</span>
          <span>{report.totalTrades} Trades Evaluated</span>
        </div>
      </div>
    </div>
  );
};
