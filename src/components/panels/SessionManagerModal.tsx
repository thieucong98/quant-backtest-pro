import React, { useEffect, useState } from 'react';
import {
  X,
  FolderOpen,
  PlusCircle,
  Play,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Layers,
  Database,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { sessionsApi, SessionListItem } from '../../api/sessions';
import { INSTRUMENTS } from '../../config/instruments';
import { getTranslation, formatDate } from '../../i18n';

export const SessionManagerModal: React.FC = () => {
  const {
    isSessionManagerOpen,
    setSessionManagerOpen,
    activeSessionId,
    loadSessionById,
    createNewSession,
    deleteBulkSessions,
    clearAllSessions,
    resetActiveSession,
    completeCurrentSession,
    isServerOnline,
    language
  } = useBacktestStore();

  const t = getTranslation(language);

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'deleteSelected' | 'clearAll' | 'resetActive';
    title: string;
    description: string;
  } | null>(null);

  // New Session Form State
  const [newSymbol, setNewSymbol] = useState<string>('XAUUSD');
  const [newTimeframe, setNewTimeframe] = useState<any>('M5');
  const [newBalance, setNewBalance] = useState<number>(10000);
  const [newName, setNewName] = useState<string>('');

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const list = await sessionsApi.list();
      setSessions(list);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to list sessions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSessionManagerOpen) {
      fetchSessions();
    }
  }, [isSessionManagerOpen]);

  if (!isSessionManagerOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNewSession(newName.trim() || undefined, newSymbol, newTimeframe, newBalance);
      setIsCreating(false);
      setNewName('');
      await fetchSessions();
      setSessionManagerOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSession = async (id: string) => {
    const success = await loadSessionById(id);
    if (success) {
      setSessionManagerOpen(false);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sessions.map(s => s.id));
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'deleteSelected') {
      await deleteBulkSessions(selectedIds);
      await fetchSessions();
    } else if (confirmDialog.type === 'clearAll') {
      await clearAllSessions();
      await fetchSessions();
    } else if (confirmDialog.type === 'resetActive') {
      await resetActiveSession();
      await fetchSessions();
    }

    setConfirmDialog(null);
  };

  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds([id]);
    setConfirmDialog({
      type: 'deleteSelected',
      title: t.confirmDeleteSession,
      description: t.confirmDeleteSessionDesc
    });
  };

  const handleCompleteActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeCurrentSession();
    await fetchSessions();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 relative">
        
        {/* Glow Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />

        {/* Confirmation Modal Overlay */}
        {confirmDialog && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-[#141a29] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-100">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{confirmDialog.description}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                  {t.confirmAction}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-[#0b0f19] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-400 shadow-inner shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{t.sessionManagerTitle}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                  {sessions.length} {t.totalSessions}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.sessionManagerDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchSessions}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60"
              title={t.refreshBtn}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setSessionManagerOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {isCreating ? (
            /* CREATE SESSION FORM */
            <form onSubmit={handleCreate} className="max-w-xl mx-auto space-y-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                {t.createNewSession}
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t.sessionName}:</label>
                <input
                  type="text"
                  placeholder={`VD: ${newSymbol} Scalping Session`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{t.symbol}:</label>
                  <select
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    {Object.keys(INSTRUMENTS).map(sym => (
                      <option key={sym} value={sym}>{sym} - {INSTRUMENTS[sym].name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{t.timeframe}:</label>
                  <select
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => (
                      <option key={tf} value={tf}>{tf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t.initialBalance} (USD):</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1000, 5000, 10000, 50000].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setNewBalance(amt)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        newBalance === amt
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(parseFloat(e.target.value) || 1000)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                >
                  {t.createNewSession}
                </button>
              </div>
            </form>
          ) : (
            /* SESSIONS LIST */
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-3">
                  <Database className="w-12 h-12 mx-auto text-slate-600 opacity-40" />
                  <p>{t.noSessionsFound}</p>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{t.createNewSession}</span>
                  </button>
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const isSelected = selectedIds.includes(s.id);
                  const pnl = s.finalEquity - s.initialBalance;
                  const returnPct = s.initialBalance > 0 ? (pnl / s.initialBalance) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isActive
                          ? 'bg-indigo-950/50 border-indigo-500/70 shadow-lg shadow-indigo-950/60'
                          : isSelected
                          ? 'bg-indigo-950/30 border-indigo-500/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* Checkbox & Left Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(s.id, e)}
                          className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                              {s.name}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {t.runningStatus}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                              {s.symbol} • {s.timeframe}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                              s.status === 'COMPLETED'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                                : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                            }`}>
                              {s.status === 'COMPLETED' ? t.completedStatus : t.runningStatus}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {formatDate(s.createdAt, language)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-slate-500" />
                              {s._count.trades} {t.tradesCountLabel} ({s._count.drawings} {t.drawingsCountLabel})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics & Action Buttons */}
                      <div className="flex items-center gap-4 font-mono">
                        {/* Financial Stats */}
                        <div className="text-right">
                          <div className="text-xs text-slate-400">
                            {t.initialBalance}: ${s.initialBalance.toLocaleString()} → <span className="font-bold text-slate-200">${s.finalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className={`text-xs font-bold flex items-center justify-end gap-1 ${isProfit ? 'text-teal-400' : 'text-rose-400'}`}>
                            {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{isProfit ? '+' : ''}${pnl.toFixed(2)} ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%)</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {isActive ? (
                            <button
                              type="button"
                              onClick={handleCompleteActive}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                              title="Mark session as completed"
                            >
                              {t.completeSession}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectSession(s.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{t.resumeSession}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSingle(s.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title={t.deleteSession}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-[#0b0f19] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{t.totalSessions}: {sessions.length}</span>
          <span>Quant Backtest Pro Database Engine</span>
        </div>
      </div>
    </div>
  );
};
