import React, { useEffect } from 'react';
import { TradingViewChart } from './components/chart/TradingViewChart';
import { Header } from './components/header/Header';
import { ReplayBar } from './components/replay/ReplayBar';
import { PositionsTable } from './components/panels/PositionsTable';
import { OrderEntryModal } from './components/panels/OrderEntryModal';
import { AIStrategyModal } from './components/panels/AIStrategyModal';
import { AnalyticsDashboardModal } from './components/panels/AnalyticsDashboardModal';
import { DataImportModal } from './components/panels/DataImportModal';
import { ShortcutsModal } from './components/panels/ShortcutsModal';
import { SessionManagerModal } from './components/panels/SessionManagerModal';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { AIBotHUD } from './components/panels/AIBotHUD';
import { useBacktestStore } from './store/backtestStore';
import { useAutoSave } from './hooks/useAutoSave';

export const App: React.FC = () => {
  const {
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    setOrderModalOpen,
    isOrderModalOpen,
    isAIModalOpen,
    isAnalyticsModalOpen,
    isDataModalOpen,
    isShortcutsModalOpen,
    isProfileModalOpen,
    isSessionManagerOpen,
    setAIModalOpen,
    setAnalyticsModalOpen,
    setDataModalOpen,
    setShortcutsModalOpen,
    setProfileModalOpen,
    setSessionManagerOpen,
    initSession
  } = useBacktestStore();

  // Initialize auto-save connection
  useAutoSave();

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) pause();
        else play();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        stepForward();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        stepBackward();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setOrderModalOpen(true);
      } else if (e.code === 'Escape') {
        if (isOrderModalOpen) setOrderModalOpen(false);
        if (isAIModalOpen) setAIModalOpen(false);
        if (isAnalyticsModalOpen) setAnalyticsModalOpen(false);
        if (isDataModalOpen) setDataModalOpen(false);
        if (isShortcutsModalOpen) setShortcutsModalOpen(false);
        if (isProfileModalOpen) setProfileModalOpen(false);
        if (isSessionManagerOpen) setSessionManagerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    isOrderModalOpen,
    isAIModalOpen,
    isAnalyticsModalOpen,
    isDataModalOpen,
    isShortcutsModalOpen,
    isProfileModalOpen,
    isSessionManagerOpen
  ]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0e14] text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. TOP HEADER */}
      <Header />

      {/* 2. MAIN CENTER: CHART & DRAWINGS */}
      <main className="flex-1 relative w-full h-full min-h-0 bg-[#0b0e14]">
        <TradingViewChart />
        <AIBotHUD />
      </main>

      {/* 3. REPLAY TIMELINE CONTROLLER */}
      <ReplayBar />

      {/* 4. BOTTOM DOCK: POSITIONS & TRADES TABLE */}
      <PositionsTable />

      {/* 5. MODAL DIALOGS */}
      <OrderEntryModal />
      <AIStrategyModal />
      <AnalyticsDashboardModal />
      <DataImportModal />
      <SessionManagerModal />
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
      <AuthModal />
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default App;
