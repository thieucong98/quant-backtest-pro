import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';

interface BottomPanelSplitterProps {
  className?: string;
}

export const BottomPanelSplitter: React.FC<BottomPanelSplitterProps> = ({ className = '' }) => {
  const {
    bottomPanelHeight,
    isBottomPanelCollapsed,
    setBottomPanelHeight,
    setBottomPanelCollapsed,
    resetBottomPanelHeight,
    language
  } = useBacktestStore();

  const t = getTranslation(language);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only respond to main left click / primary touch
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const currentHeight = isBottomPanelCollapsed ? 36 : bottomPanelHeight;
      if (isBottomPanelCollapsed) {
        setBottomPanelCollapsed(false);
      }

      dragStartRef.current = {
        startY: e.clientY,
        startHeight: currentHeight
      };

      setIsDragging(true);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!dragStartRef.current) return;
        moveEvent.preventDefault();

        // Dragging upward (clientY decreases) -> height increases
        const deltaY = dragStartRef.current.startY - moveEvent.clientY;
        const targetHeight = dragStartRef.current.startHeight + deltaY;

        setBottomPanelHeight(targetHeight);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        upEvent.preventDefault();
        dragStartRef.current = null;
        setIsDragging(false);

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);

        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';

      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [bottomPanelHeight, isBottomPanelCollapsed, setBottomPanelHeight, setBottomPanelCollapsed]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      resetBottomPanelHeight();
    },
    [resetBottomPanelHeight]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      title={t.dragToResizePanel}
      className={`group relative w-full h-2 -mt-1 z-30 cursor-row-resize flex items-center justify-center select-none touch-none ${className}`}
      role="separator"
      aria-orientation="horizontal"
      aria-valuenow={isBottomPanelCollapsed ? 36 : bottomPanelHeight}
    >
      {/* Invisible expanded hit area for effortless grabbing */}
      <div className="absolute inset-x-0 -top-1 -bottom-1 z-10" />

      {/* Visual divider line with animated hover glow */}
      <div
        className={`w-full h-px transition-colors duration-150 ${
          isDragging
            ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
            : 'bg-slate-800/90 group-hover:bg-indigo-500/80 group-hover:shadow-[0_0_6px_rgba(99,102,241,0.5)]'
        }`}
      />

      {/* Center tactile grip pill (TradingView aesthetic) */}
      <div
        className={`absolute z-20 flex items-center justify-center transition-all duration-150 ${
          isDragging
            ? 'w-14 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.9)]'
            : 'w-10 h-1 bg-slate-600/80 rounded-full group-hover:w-14 group-hover:h-1.5 group-hover:bg-indigo-400 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.6)]'
        }`}
      >
        <div className="w-1 h-1 rounded-full bg-slate-900/60 mx-0.5" />
        <div className="w-1 h-1 rounded-full bg-slate-900/60 mx-0.5" />
        <div className="w-1 h-1 rounded-full bg-slate-900/60 mx-0.5" />
      </div>
    </div>
  );
};
