/**
 * useAutoSave — Debounced auto-save hook
 * 
 * Syncs the current backtest session to the server every 30s or on critical events.
 * Also handles session recovery on app startup and beforeunload force-save.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useBacktestStore } from '../store/backtestStore';
import { useAuthStore } from '../store/authStore';
import { sessionsApi } from '../api/sessions';
import { tradesApi } from '../api/trades';
import { drawingsApi } from '../api/index';
import { checkServerHealth } from '../api/client';

const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaveRef = useRef<number>(0);
  const serverAvailableRef = useRef(false);

  const sessionId = useBacktestStore(s => s.activeSessionId);
  const account = useBacktestStore(s => s.account);
  const currentIndex = useBacktestStore(s => s.currentIndex);
  const openPositions = useBacktestStore(s => s.openPositions);
  const closedPositions = useBacktestStore(s => s.closedPositions);
  const drawings = useBacktestStore(s => s.drawings);
  const equityCurve = useBacktestStore(s => s.equityCurve);
  const instrument = useBacktestStore(s => s.instrument);
  const timeframe = useBacktestStore(s => s.timeframe);

  // Perform auto-save
  const performSave = useCallback(async () => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!sessionId || !serverAvailableRef.current || !isAuth || sessionId.startsWith('guest-')) return;

    try {
      // 1. Update session metadata
      await sessionsApi.update(sessionId, {
        finalBalance: account.balance,
        finalEquity: account.equity,
        currentIndex,
        symbol: instrument.symbol,
        timeframe
      });

      // 2. Bulk sync trades (open + closed)
      const allTrades = [
        ...openPositions.map(p => ({ ...p, status: 'OPEN' })),
        ...closedPositions.map(p => ({ ...p, status: 'CLOSED' }))
      ];
      await tradesApi.bulkSync(sessionId, allTrades);

      // 3. Sync drawings
      if (drawings.length > 0) {
        await drawingsApi.sync(sessionId, drawings);
      }

      // 4. Sync equity curve (sampled)
      if (equityCurve.length > 0) {
        await drawingsApi.syncEquity(sessionId, equityCurve);
      }

      lastSaveRef.current = Date.now();
      console.log(`[AutoSave] Saved session ${sessionId} — ${allTrades.length} trades, ${drawings.length} drawings`);
    } catch (err) {
      console.warn('[AutoSave] Failed:', err);
    }
  }, [sessionId, account, currentIndex, openPositions, closedPositions, drawings, equityCurve, instrument, timeframe]);

  // Check server availability on mount
  useEffect(() => {
    checkServerHealth().then(ok => {
      serverAvailableRef.current = ok;
      if (ok) {
        console.log('[AutoSave] Server connected — auto-save enabled');
      } else {
        console.log('[AutoSave] Server not available — running in offline mode');
      }
    });
  }, []);

  // Auto-save interval
  useEffect(() => {
    if (!sessionId) return;

    timerRef.current = setInterval(() => {
      performSave();
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, performSave]);

  // Save on beforeunload (tab close / refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const isAuth = useAuthStore.getState().isAuthenticated;
      if (sessionId && serverAvailableRef.current && isAuth && !sessionId.startsWith('guest-')) {
        // Use sendBeacon for reliable last-moment save
        const payload = JSON.stringify({
          finalBalance: account.balance,
          finalEquity: account.equity,
          currentIndex
        });
        navigator.sendBeacon(`/api/sessions/${sessionId}`, new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, account, currentIndex]);

  return {
    performSave,
    isServerAvailable: serverAvailableRef.current,
    lastSaveTime: lastSaveRef.current
  };
}
