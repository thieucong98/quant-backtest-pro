import React, { useState } from 'react';
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
  Grid
} from 'lucide-react';
import { AnalyticsEngine, MonteCarloResult, DayHourHeatmapCell } from '../../engine/analytics';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

export const AnalyticsDashboardModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'montecarlo' | 'heatmap'>('overview');

  const {
    isAnalyticsModalOpen,
    setAnalyticsModalOpen,
    closedPositions,
    account,
    equityCurve,
    instrument,
    language
  } = useBacktestStore();

  if (!isAnalyticsModalOpen) return null;

  const t = translations[language] || translations.vi;
  const report = AnalyticsEngine.calculateReport(account.initialBalance, closedPositions);
  const monteCarlo: MonteCarloResult = AnalyticsEngine.runMonteCarlo(account.initialBalance, closedPositions, 1000);
  const heatmapData: DayHourHeatmapCell[] = AnalyticsEngine.calculateHeatmap(closedPositions);

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

  // Helper vẽ đồ thị Equity SVG
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

  // Helper vẽ đồ thị Monte Carlo SVG
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
          🎲 10 Representative Paths (out of 1,000 runs)
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">{t.analyticsTitle}</span>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center gap-2 text-xs font-mono">
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
                    {report.netProfit >= 0 ? '+' : ''}${report.netProfit.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.winRate}:</div>
                  <div className="text-lg font-bold text-indigo-300 mt-1">{report.winRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{report.winTrades} W / {report.lossTrades} L</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.profitFactor}:</div>
                  <div className="text-lg font-bold text-amber-300 mt-1">{report.profitFactor}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.maxDrawdown}:</div>
                  <div className="text-lg font-bold text-rose-400 mt-1">{report.maxDrawdownPercent.toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">-${report.maxDrawdownAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* DETAILED STATS TABLE */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.totalTrades}:</span>
                  <span className="font-semibold text-slate-200">{report.totalTrades}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.grossProfit}:</span>
                  <span className="font-semibold text-teal-400">+${report.grossProfit}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.grossLoss}:</span>
                  <span className="font-semibold text-rose-400">-${report.grossLoss}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.avgWin}:</span>
                  <span className="text-teal-400">+${report.avgWin}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.avgLoss}:</span>
                  <span className="text-rose-400">-${report.avgLoss}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.riskReward}:</span>
                  <span className="font-bold text-indigo-300">1 : {report.riskRewardRatio}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.expectedPayoff}:</span>
                  <span className="text-slate-200">${report.expectedPayoff}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.sharpeRatio}:</span>
                  <span className="font-bold text-amber-400">{report.sharpeRatio}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">{t.sortinoRatio}:</span>
                  <span className="font-bold text-amber-400">{report.sortinoRatio}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONTE CARLO SIMULATION */}
          {activeTab === 'montecarlo' && (
            <div className="space-y-4">
              <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-lg text-xs leading-relaxed text-purple-200">
                🎲 {t.monteCarloDesc}
              </div>

              {renderMonteCarloChart()}

              {/* Monte Carlo Results Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.medianProfit}:</div>
                  <div className="text-lg font-bold text-teal-400 mt-1">+${monteCarlo.medianProfit}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.worstCaseDD}:</div>
                  <div className="text-lg font-bold text-rose-400 mt-1">-{monteCarlo.worstCaseDrawdown}%</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.percentile95DD}:</div>
                  <div className="text-lg font-bold text-amber-300 mt-1">-{monteCarlo.percentile95Drawdown}%</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-slate-400 text-[11px]">{t.riskOfRuin}:</div>
                  <div className={`text-lg font-bold mt-1 ${monteCarlo.riskOfRuinPercent > 5 ? 'text-rose-400' : 'text-teal-400'}`}>
                    {monteCarlo.riskOfRuinPercent}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRADING HEATMAP */}
          {activeTab === 'heatmap' && (
            <div className="space-y-3">
              <div className="text-slate-300 text-xs font-semibold">
                {t.heatmapDesc}
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
                <div className="grid grid-cols-12 gap-1 min-w-[600px] text-[10px]">
                  {heatmapData.filter(c => c.tradesCount > 0).length === 0 ? (
                    <div className="col-span-12 py-8 text-center text-slate-500">
                      Chưa có đủ dữ liệu lệnh để tổng hợp Heatmap. Hãy hoàn thành ít nhất 5 lệnh giao dịch.
                    </div>
                  ) : (
                    heatmapData.filter(c => c.tradesCount > 0).map((cell, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-center ${
                          cell.pnl > 0
                            ? 'bg-teal-950/80 border-teal-500/40 text-teal-300'
                            : cell.pnl < 0
                            ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-bold">{cell.dayName} {cell.hour}h</div>
                        <div className="text-[11px] font-bold mt-0.5">{cell.pnl >= 0 ? '+' : ''}${cell.pnl}</div>
                        <div className="text-[9px] opacity-75">{cell.tradesCount} trades ({cell.winRate}%)</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
