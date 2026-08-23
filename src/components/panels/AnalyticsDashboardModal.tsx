import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
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
  BarChart3
} from 'lucide-react';
import { AnalyticsEngine, MonteCarloResult, DayHourHeatmapCell } from '../../engine/analytics';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { analyticsApi } from '../../api';

export const AnalyticsDashboardModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'montecarlo' | 'heatmap' | 'database'>('overview');
  const [viewScope, setViewScope] = useState<'current' | 'portfolio'>('current');
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

  const t = translations[language] || translations.vi;

  // Compute live real-time report for current session
  const report = AnalyticsEngine.calculateReport(account.initialBalance, closedPositions);
  const monteCarlo: MonteCarloResult = AnalyticsEngine.runMonteCarlo(account.initialBalance, closedPositions, 1000);
  const heatmapData: DayHourHeatmapCell[] = AnalyticsEngine.calculateHeatmap(closedPositions);

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

  useEffect(() => {
    if (isAnalyticsModalOpen && (viewScope === 'portfolio' || activeTab === 'database')) {
      fetchPortfolio();
    }
  }, [isAnalyticsModalOpen, viewScope, activeTab]);

  if (!isAnalyticsModalOpen) return null;

  const handleSaveSnapshot = async () => {
    if (!activeSessionId) return;
    setSaveStatus('saving');
    try {
      await analyticsApi.saveSession(activeSessionId, {
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
    if (closedPositions.length === 0) return;

    let csvContent = 'ID,Symbol,Side,Lot,EntryPrice,ClosePrice,OpenTime,CloseTime,Commission,Swap,RealizedPnL,Reason,Tags,Note\n';
    closedPositions.forEach(p => {
      const tagStr = p.tags ? p.tags.join(';') : '';
      csvContent += `${p.id},${p.symbol},${p.side},${p.lotSize},${p.entryPrice},${p.closePrice},${p.openTime},${p.closeTime},${p.commission},${p.swap},${p.realizedPnL},${p.closeReason},"${tagStr}","${p.note || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Backtest_Report_${instrument.symbol}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper render Equity Chart SVG
  const renderEquityChart = () => {
    if (equityCurve.length < 2) {
      return (
        <div className="h-40 flex items-center justify-center text-slate-500 text-xs">
          Cần ít nhất 2 điểm dữ liệu để vẽ biểu đồ tăng trưởng vốn (Equity Curve).
        </div>
      );
    }

    const minBalance = Math.min(...equityCurve.map(p => Math.min(p.balance, p.equity))) * 0.98;
    const maxBalance = Math.max(...equityCurve.map(p => Math.max(p.balance, p.equity))) * 1.02;
    const range = maxBalance - minBalance || 1;

    const width = 750;
    const height = 150;
    const padding = 20;

    const points = equityCurve.map((pt, idx) => {
      const x = padding + (idx / (equityCurve.length - 1)) * (width - padding * 2);
      const y = height - padding - ((pt.equity - minBalance) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const balancePoints = equityCurve.map((pt, idx) => {
      const x = padding + (idx / (equityCurve.length - 1)) * (width - padding * 2);
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
        <div className="h-40 flex items-center justify-center text-slate-500 text-xs">
          Cần ít nhất 5 lệnh đã hoàn thành để chạy mô phỏng Monte Carlo.
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
          🎲 10 Đường Mô phỏng Đại diện (từ 1,000 lần lặp)
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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none p-3">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100">{t.analyticsTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Snapshot Button */}
            {activeSessionId && (
              <button
                onClick={handleSaveSnapshot}
                disabled={saveStatus === 'saving'}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Lưu Snapshot Báo cáo vào Database"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'success' ? 'Đã lưu DB ✓' : 'Lưu Snapshot'}
                </span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={closedPositions.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.exportCSV}</span>
            </button>

            <button
              onClick={() => setAnalyticsModalOpen(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUB TABS */}
        <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.overviewTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('montecarlo')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'montecarlo' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dice5 className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.monteCarloTab}</span>
            </button>

            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'heatmap' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.heatmapTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('database');
                fetchPortfolio();
              }}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'database' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Danh Mục Đa Phiên (Database)</span>
            </button>
          </div>

          {/* Scope Indicator */}
          {activeTab !== 'database' && (
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Phiên: {instrument.symbol}</span>
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* EQUITY CURVE GRAPH */}
              <div>
                <h4 className="font-bold text-slate-300 text-xs mb-2">{t.equityGrowth}:</h4>
                {renderEquityChart()}
              </div>

              {/* KEY METRICS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.netProfit}:</div>
                  <div className={`text-lg font-bold mt-1 ${report.netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {report.netProfit >= 0 ? '+' : ''}${report.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.winRate}:</div>
                  <div className="text-lg font-bold text-indigo-300 mt-1">{report.winRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{report.winTrades} W / {report.lossTrades} L</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.profitFactor}:</div>
                  <div className={`text-lg font-bold mt-1 ${report.profitFactor >= 1.5 ? 'text-teal-400' : report.profitFactor >= 1.0 ? 'text-slate-200' : 'text-rose-400'}`}>
                    {report.profitFactor > 99 ? '99+' : report.profitFactor.toFixed(2)}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.maxDrawdown}:</div>
                  <div className="text-lg font-bold text-rose-400 mt-1">{report.maxDrawdownPercent.toFixed(2)}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">-${report.maxDrawdownAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* DETAILED STATS TABLE */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400">{t.totalTrades}:</span>
                  <div className="font-bold text-slate-200">{report.totalTrades}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.grossProfit}:</span>
                  <div className="font-bold text-teal-400">+${report.grossProfit.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.grossLoss}:</span>
                  <div className="font-bold text-rose-400">-${Math.abs(report.grossLoss).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.avgWin}:</span>
                  <div className="font-bold text-teal-400">+${report.avgWin.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.avgLoss}:</span>
                  <div className="font-bold text-rose-400">-${Math.abs(report.avgLoss).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.riskReward}:</span>
                  <div className="font-bold text-indigo-300">1 : {report.riskRewardRatio.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.sharpeRatio}:</span>
                  <div className="font-bold text-slate-200">{report.sharpeRatio.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.sortinoRatio}:</span>
                  <div className="font-bold text-slate-200">{report.sortinoRatio.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.consecutiveWins}:</span>
                  <div className="font-bold text-teal-400">{report.consecutiveWins}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.consecutiveLosses}:</span>
                  <div className="font-bold text-rose-400">{report.consecutiveLosses}</div>
                </div>
                <div>
                  <span className="text-slate-400">{t.expectedPayoff}:</span>
                  <div className="font-bold text-slate-200">${report.expectedPayoff.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONTE CARLO */}
          {activeTab === 'montecarlo' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs leading-relaxed">
                {t.monteCarloDesc}
              </p>

              {renderMonteCarloChart()}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.medianProfit}:</div>
                  <div className="text-base font-bold text-teal-400 mt-1">${monteCarlo.medianProfit.toFixed(2)}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.worstCaseDD}:</div>
                  <div className="text-base font-bold text-rose-400 mt-1">{monteCarlo.worstCaseDrawdown.toFixed(2)}%</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.percentile95DD}:</div>
                  <div className="text-base font-bold text-amber-400 mt-1">{monteCarlo.percentile95Drawdown.toFixed(2)}%</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.riskOfRuin}:</div>
                  <div className="text-base font-bold text-purple-300 mt-1">{monteCarlo.riskOfRuinPercent.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEATMAP */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">
                {t.heatmapDesc}
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                <div className="grid grid-cols-13 gap-1 min-w-[600px] text-center text-[10px]">
                  <div className="font-bold text-slate-500 py-1">Thứ / Giờ</div>
                  {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => (
                    <div key={h} className="font-mono text-slate-400 py-1">{h}h</div>
                  ))}

                  {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'].map((day, dIdx) => (
                    <React.Fragment key={day}>
                      <div className="text-slate-400 text-left py-1.5 font-bold flex items-center">{day}</div>
                      {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => {
                        const cell = heatmapData.find(c => c.day === dIdx + 1 && Math.abs(c.hour - h) < 2);
                        const pnl = cell ? cell.pnl : 0;
                        const count = cell ? cell.tradesCount : 0;

                        let bg = 'bg-slate-900/60 border-slate-800/40 text-slate-600';
                        if (count > 0) {
                          if (pnl > 0) bg = 'bg-emerald-950 border-emerald-500/30 text-emerald-300 font-bold';
                          else if (pnl < 0) bg = 'bg-rose-950 border-rose-500/30 text-rose-300 font-bold';
                        }

                        return (
                          <div
                            key={h}
                            className={`p-1.5 rounded border flex flex-col items-center justify-center transition-all ${bg}`}
                            title={`${day} lúc ${h}:00 — ${count} lệnh (PnL: $${pnl.toFixed(2)})`}
                          >
                            <span>{count > 0 ? (pnl >= 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`) : '-'}</span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE PORTFOLIO */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Hiệu Suất Tổng Hợp Danh Mục (Database Portfolio)
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Thống kê tổng hợp toàn bộ các phiên backtest đã lưu trong cơ sở dữ liệu.
                  </p>
                </div>
                <button
                  onClick={fetchPortfolio}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDB ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {isLoadingDB ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40" />
                  Đang truy vấn dữ liệu báo cáo từ SQLite Database...
                </div>
              ) : portfolioData ? (
                <div className="space-y-4">
                  {/* Aggregated Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 text-[11px]">Tổng số phiên:</div>
                      <div className="text-lg font-bold text-indigo-300 mt-1">{portfolioData.totalSessions}</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 text-[11px]">Tổng số lệnh toàn bộ:</div>
                      <div className="text-lg font-bold text-slate-200 mt-1">{portfolioData.totalTrades}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{portfolioData.totalWins} W / {portfolioData.totalLosses} L</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 text-[11px]">Win Rate Danh mục:</div>
                      <div className="text-lg font-bold text-teal-400 mt-1">{portfolioData.overallWinRate}%</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <div className="text-slate-400 text-[11px]">Tổng PnL Danh mục:</div>
                      <div className={`text-lg font-bold mt-1 ${portfolioData.totalNetProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                        {portfolioData.totalNetProfit >= 0 ? '+' : ''}${portfolioData.totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Sessions Breakdown Table */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800 font-bold text-xs text-slate-300">
                      Lịch Sử Các Phiên Backtest ({portfolioData.sessions?.length || 0})
                    </div>
                    <div className="divide-y divide-slate-900 max-h-60 overflow-y-auto">
                      {(portfolioData.sessions || []).map((s: any) => {
                        const net = s.finalEquity ? (s.finalEquity - s.initialBalance) : (s.analytics?.netProfit || 0);
                        const isWin = net >= 0;
                        return (
                          <div key={s.id} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-900/50">
                            <div>
                              <div className="font-bold text-slate-200">{s.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {s.symbol} • {s.timeframe} • {new Date(s.createdAt).toLocaleDateString('vi-VN')} • {s.tradeCount} lệnh
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <div className={`font-bold ${isWin ? 'text-teal-400' : 'text-rose-400'}`}>
                                {isWin ? '+' : ''}${net.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Vốn: ${s.initialBalance.toLocaleString()}
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
        </div>

        {/* FOOTER */}
        <div className="h-10 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-500 text-[11px] font-mono">
          <span>Quant Backtest Pro Institutional Analytics</span>
          <span>{closedPositions.length} Closed Trades Sampled</span>
        </div>
      </div>
    </div>
  );
};
