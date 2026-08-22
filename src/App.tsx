import React, { useEffect } from 'react';
import { TradingViewChart } from './components/chart/TradingViewChart';
import { Header } from './components/header/Header';
import { ReplayBar } from './components/replay/ReplayBar';
import { PositionsTable } from './components/panels/PositionsTable';
import { OrderEntryModal } from './components/panels/OrderEntryModal';
import { AIStrategyModal } from './components/panels/AIStrategyModal';
import { AnalyticsDashboardModal } from './components/panels/AnalyticsDashboardModal';
import { DataImportModal } from './components/panels/DataImportModal';
import { useBacktestStore } from './store/backtestStore';

export const App: React.FC = () => {
  const {
    isPlaying,
    play,
    pause,
    stepForward,
    setOrderModalOpen,
    isOrderModalOpen,
    isAIModalOpen,
    isAnalyticsModalOpen,
    isDataModalOpen,
    setAIModalOpen,
    setAnalyticsModalOpen,
    setDataModalOpen
  } = useBacktestStore();

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
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
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setOrderModalOpen(true);
      } else if (e.code === 'Escape') {
        if (isOrderModalOpen) setOrderModalOpen(false);
        if (isAIModalOpen) setAIModalOpen(false);
        if (isAnalyticsModalOpen) setAnalyticsModalOpen(false);
        if (isDataModalOpen) setDataModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, stepForward, isOrderModalOpen, isAIModalOpen, isAnalyticsModalOpen, isDataModalOpen]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0e14] text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. TOP HEADER */}
      <Header />

      {/* 2. MAIN CENTER: CHART & DRAWINGS */}
      <main className="flex-1 relative w-full h-full min-h-0 bg-[#0b0e14]">
        <TradingViewChart />
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
    </div>
  );
};

export default App;
