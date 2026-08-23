import React, { useEffect, useState } from 'react';
import {
  X,
  FolderOpen,
  PlusCircle,
  Play,
  CheckCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Coins,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { sessionsApi, SessionListItem } from '../../api/sessions';
import { INSTRUMENTS } from '../../config/instruments';
import { translations } from '../../i18n/translations';

export const SessionManagerModal: React.FC = () => {
  const {
    isSessionManagerOpen,
    setSessionManagerOpen,
    activeSessionId,
    loadSessionById,
    createNewSession,
    deleteSessionById,
    completeCurrentSession,
    isServerOnline,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.en;

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDeleteSession)) {
      await deleteSessionById(id);
      await fetchSessions();
    }
  };

  const handleCompleteActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeCurrentSession();
    await fetchSessions();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111622] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d111a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{t.sessionManagerTitle}</h2>
                {isServerOnline ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                    <Database className="w-3 h-3" /> SQLite Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/30">
                    Local Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.sessionManagerDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreating ? t.sessionList : t.createNewSession}</span>
            </button>
            <button
              onClick={fetchSessions}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setSessionManagerOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isCreating ? (
            /* CREATE SESSION FORM */
            <form onSubmit={handleCreate} className="max-w-xl mx-auto space-y-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
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
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
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
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  {t.noSessionsFound}
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const pnl = s.finalEquity - s.initialBalance;
                  const returnPct = s.initialBalance > 0 ? (pnl / s.initialBalance) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* Left Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                            {s.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
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
                            {new Date(s.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} {new Date(s.createdAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            {s._count.trades} {t.tradesCountLabel} ({s._count.drawings} {t.drawingsCountLabel})
                          </span>
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
                              onClick={handleCompleteActive}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                              title="Mark session as completed"
                            >
                              {t.completeSession}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSelectSession(s.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{t.resumeSession}</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDelete(s.id, e)}
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
        <div className="px-6 py-3 border-t border-slate-800/80 bg-[#0d111a] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{t.totalSessions}: {sessions.length}</span>
          <span>Quant Backtest Pro Database Engine</span>
        </div>
      </div>
    </div>
  );
};
