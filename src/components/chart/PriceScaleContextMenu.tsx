import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Check,
  ChevronRight,
  Settings,
  Lock,
  ArrowLeftRight,
  Plus
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';

interface PriceScaleContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onResetPriceScale: () => void;
  onOpenSettings?: () => void;
}

export const PriceScaleContextMenu: React.FC<PriceScaleContextMenuProps> = ({
  x,
  y,
  onClose,
  onResetPriceScale,
  onOpenSettings
}) => {
  const {
    language,
    isAutoScale,
    isPriceRatioLocked,
    priceScalePosition,
    scaleChartOnly,
    isInvertedScale,
    isLogScale,
    isPercentageScale,
    isIndexedScale,
    showScalePlusButton,
    scaleLabels,
    scaleLines,
    toggleAutoScale,
    togglePriceRatioLocked,
    toggleScaleChartOnly,
    toggleInvertedScale,
    setScaleMode,
    togglePriceScalePosition,
    toggleScalePlusButton,
    toggleScaleLabel,
    toggleScaleLine
  } = useBacktestStore();

  const t = getTranslation(language);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<'labels' | 'lines' | null>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Intelligent viewport-bounded positioning
  useEffect(() => {
    if (!menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    const maxX = window.innerWidth - offsetWidth - 10;
    const maxY = window.innerHeight - offsetHeight - 10;

    setPos({
      left: Math.max(10, Math.min(x, maxX)),
      top: Math.max(10, Math.min(y, maxY))
    });
  }, [x, y]);

  // Click outside & Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const isRegularMode = !isLogScale && !isPercentageScale && !isIndexedScale;

  return (
    <div
      ref={menuRef}
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
      className="fixed z-50 w-64 bg-[#131722]/95 backdrop-blur-xl border border-[#2a2e39] rounded-lg shadow-2xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
    >
      {/* 1. RESET PRICE SCALE */}
      <button
        type="button"
        onClick={() => handleAction(onResetPriceScale)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors group cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-[-45deg] transition-transform" />
          <span className="font-semibold text-slate-100">{t.resetPriceScale}</span>
        </div>
        <kbd className="text-[10px] font-mono text-slate-400 bg-[#1e222d] border border-slate-700/60 px-1.5 py-0.5 rounded">
          Alt + R
        </kbd>
      </button>

      <div className="my-1 border-t border-[#2a2e39]" />

      {/* 2. AUTO (FITS DATA TO SCREEN) */}
      <button
        type="button"
        onClick={() => handleAction(toggleAutoScale)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isAutoScale && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.autoFitsDataToScreen}</span>
        </div>
        <kbd className="text-[10px] font-mono text-slate-500">Alt + A</kbd>
      </button>

      {/* 3. LOCK PRICE TO BAR RATIO */}
      <button
        type="button"
        onClick={() => handleAction(togglePriceRatioLocked)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isPriceRatioLocked && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.lockPriceToBarRatio}</span>
        </div>
        <Lock className={`w-3 h-3 ${isPriceRatioLocked ? 'text-amber-400' : 'text-slate-600'}`} />
      </button>

      {/* 4. SCALE PRICE CHART ONLY */}
      <button
        type="button"
        onClick={() => handleAction(toggleScaleChartOnly)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {scaleChartOnly && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.scalePriceChartOnly}</span>
        </div>
      </button>

      {/* 5. INVERT SCALE */}
      <button
        type="button"
        onClick={() => handleAction(toggleInvertedScale)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isInvertedScale && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.invertScaleMenu}</span>
        </div>
        <kbd className="text-[10px] font-mono text-slate-500">Alt + I</kbd>
      </button>

      <div className="my-1 border-t border-[#2a2e39]" />

      {/* 6. REGULAR SCALE */}
      <button
        type="button"
        onClick={() => handleAction(() => setScaleMode('regular'))}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isRegularMode && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.regularScale}</span>
        </div>
      </button>

      {/* 7. PERCENT SCALE */}
      <button
        type="button"
        onClick={() => handleAction(() => setScaleMode('percent'))}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isPercentageScale && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.percentScale}</span>
        </div>
        <kbd className="text-[10px] font-mono text-slate-500">Alt + P</kbd>
      </button>

      {/* 8. INDEXED TO 100 */}
      <button
        type="button"
        onClick={() => handleAction(() => setScaleMode('indexed'))}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isIndexedScale && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.indexedTo100Scale}</span>
        </div>
      </button>

      {/* 9. LOGARITHMIC SCALE */}
      <button
        type="button"
        onClick={() => handleAction(() => setScaleMode('log'))}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {isLogScale && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.logarithmicScale}</span>
        </div>
        <kbd className="text-[10px] font-mono text-slate-500">Alt + L</kbd>
      </button>

      <div className="my-1 border-t border-[#2a2e39]" />

      {/* 10. MOVE SCALE TO LEFT / RIGHT */}
      <button
        type="button"
        onClick={() => handleAction(togglePriceScalePosition)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{priceScalePosition === 'right' ? t.moveScaleToLeft : t.moveScaleToRight}</span>
        </div>
      </button>

      <div className="my-1 border-t border-[#2a2e39]" />

      {/* 11. LABELS SUBMENU */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('labels')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer">
          <div className="flex items-center gap-2 pl-3.5">
            <span>{t.labelsSubmenu}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {activeSubmenu === 'labels' && (
          <div className="absolute right-full top-0 w-60 bg-[#131722]/98 backdrop-blur-xl border border-[#2a2e39] rounded-lg shadow-2xl py-1 text-xs mr-1 animate-in fade-in">
            <button
              type="button"
              onClick={() => toggleScaleLabel('symbolName')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLabels.symbolName && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.symbolNameLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleScaleLabel('lastPrice')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLabels.lastPrice && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.symbolLastPriceLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleScaleLabel('bidAsk')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLabels.bidAsk && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.bidAskLabels}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleScaleLabel('highLow')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLabels.highLow && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.highLowPriceLabels}</span>
            </button>
          </div>
        )}
      </div>

      {/* 12. LINES SUBMENU */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu('lines')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <div className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer">
          <div className="flex items-center gap-2 pl-3.5">
            <span>{t.linesSubmenu}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {activeSubmenu === 'lines' && (
          <div className="absolute right-full top-0 w-60 bg-[#131722]/98 backdrop-blur-xl border border-[#2a2e39] rounded-lg shadow-2xl py-1 text-xs mr-1 animate-in fade-in">
            <button
              type="button"
              onClick={() => toggleScaleLine('lastPrice')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLines.lastPrice && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.symbolLastPriceLine}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleScaleLine('bidAsk')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLines.bidAsk && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.bidAskLines}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleScaleLine('highLow')}
              className="w-full flex items-center px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white text-left cursor-pointer"
            >
              <div className="w-4 flex items-center">
                {scaleLines.highLow && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span>{t.highLowPriceLines}</span>
            </button>
          </div>
        )}
      </div>

      {/* 13. PLUS BUTTON */}
      <button
        type="button"
        onClick={() => handleAction(toggleScalePlusButton)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-200 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 flex items-center justify-center">
            {showScalePlusButton && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </div>
          <span>{t.plusButtonScale}</span>
        </div>
        <Plus className="w-3 h-3 text-slate-400" />
      </button>

      <div className="my-1 border-t border-[#2a2e39]" />

      {/* 14. MORE SETTINGS */}
      <button
        type="button"
        onClick={() => {
          onClose();
          if (onOpenSettings) onOpenSettings();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:bg-[#2a2e39] hover:text-white transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.moreScaleSettings}</span>
        </div>
      </button>
    </div>
  );
};
