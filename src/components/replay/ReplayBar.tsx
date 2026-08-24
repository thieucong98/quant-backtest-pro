import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
  Calendar,
  Layers,
  Clock,
  ChevronRight,
  Sparkles,
  X,
  FastForward
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

export const ReplayBar: React.FC = () => {
  const {
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    resetSimulation,
    speed,
    setSpeed,
    currentIndex,
    candles,
    jumpToIndex,
    jumpToDate,
    timeframe,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState('');

  const currentCandle = candles[currentIndex];
  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];
  const totalCandles = candles.length;
  const progressPercent = totalCandles > 0 ? ((currentIndex + 1) / totalCandles) * 100 : 0;

  // Convert Unix timestamp to YYYY-MM-DDTHH:mm format for input type="datetime-local"
  const toDateTimeLocalValue = (timestamp?: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (currentCandle?.timestamp) {
      setSelectedDateTime(toDateTimeLocalValue(currentCandle.timestamp));
    }
  }, [currentCandle?.timestamp]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  const handleApplyDateTime = () => {
    if (!selectedDateTime) return;
    const targetTimestamp = Math.floor(new Date(selectedDateTime).getTime() / 1000);
    if (!isNaN(targetTimestamp)) {
      jumpToDate(targetTimestamp);
      setIsTimePickerOpen(false);
    }
  };

  return (
    <div className="relative h-12 bg-[#111622] border-t border-slate-800/80 px-4 flex items-center justify-between gap-4 select-none z-20 text-xs">
      {/* PLAYBACK CONTROLS */}
      <div className="flex items-center gap-1.5">
        {/* Step Backward (-1) */}
        <button
          onClick={stepBackward}
          disabled={isPlaying || currentIndex <= 0}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
          title={`${t.stepBackward} (Ctrl+Z)`}
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? pause : play}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold text-white shadow transition-all active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
          }`}
          title={`${t.play} / ${t.pause} (Space)`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>{t.pause}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.play}</span>
            </>
          )}
        </button>

        {/* Step Forward Button (+1) */}
        <button
          onClick={stepForward}
          disabled={isPlaying || currentIndex >= totalCandles - 1}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 rounded-md flex items-center gap-1 font-mono transition-colors"
          title={`${t.stepForward} (F)`}
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.stepForward}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSimulation}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
          title="Reset về cây nến đầu tiên"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 ml-1">
          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-mono hidden md:inline">{t.speed}:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-transparent text-indigo-300 font-bold font-mono focus:outline-none cursor-pointer text-xs"
          >
            <option value={1} className="bg-slate-900">1x (1 {t.candlesCount}/s)</option>
            <option value={2} className="bg-slate-900">2x</option>
            <option value={5} className="bg-slate-900">5x</option>
            <option value={10} className="bg-slate-900">10x</option>
            <option value={20} className="bg-slate-900">20x</option>
            <option value={50} className="bg-slate-900">50x</option>
            <option value={100} className="bg-slate-900">100x (Max)</option>
          </select>
        </div>
      </div>

      {/* TIMELINE PROGRESS & SCRUBBER */}
      <div className="flex-1 max-w-xl flex items-center gap-3">
        <span className="font-mono text-[11px] text-slate-400 hidden md:inline">
          {currentIndex + 1} / {totalCandles} {t.candlesCount}
        </span>

        {/* Scrubber Range Slider */}
        <input
          type="range"
          min={0}
          max={Math.max(0, totalCandles - 1)}
          value={currentIndex}
          onChange={(e) => jumpToIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />

        <span className="font-mono text-[11px] text-indigo-400 font-bold hidden sm:inline">
          {progressPercent.toFixed(0)}%
        </span>
      </div>

      {/* INTERACTIVE TIME-TRAVEL BUTTON */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/80 hover:border-indigo-500/50 text-[11px] font-mono text-slate-200 transition-all shadow-sm group active:scale-95"
          title="Bấm để chọn chính xác Ngày/Giờ bắt đầu Backtest"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 animate-pulse" />
          <span>{formatDate(currentCandle?.timestamp)}</span>
          <Clock className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
        </button>

        {/* TIME-TRAVEL POPOVER DIALOG */}
        {isTimePickerOpen && (
          <div className="absolute right-0 bottom-14 w-80 bg-[#111622]/98 border border-slate-700/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl space-y-3 z-50 animate-in fade-in zoom-in-95 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <FastForward className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-slate-200 text-xs">Time-Travel: Chọn Mốc Replay</h4>
              </div>
              <button
                onClick={() => setIsTimePickerOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Jump Shortcuts */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Phím tắt nhanh:</span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => {
                    jumpToIndex(0);
                    setIsTimePickerOpen(false);
                  }}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 border border-slate-700 rounded text-slate-300 font-bold transition-colors text-center"
                >
                  ⏪ Đầu Dữ Liệu
                </button>
                <button
                  onClick={() => {
                    jumpToIndex(Math.floor(totalCandles / 2));
                    setIsTimePickerOpen(false);
                  }}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 border border-slate-700 rounded text-slate-300 font-bold transition-colors text-center"
                >
                  📍 Giữa (50%)
                </button>
                <button
                  onClick={() => {
                    jumpToIndex(totalCandles - 1);
                    setIsTimePickerOpen(false);
                  }}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-300 border border-slate-700 rounded text-slate-300 font-bold transition-colors text-center"
                >
                  ⏩ Mới Nhất
                </button>
              </div>
            </div>

            {/* Custom DateTime Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] text-slate-300 font-medium">Chọn ngày & giờ cụ thể:</label>
              <input
                type="datetime-local"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                min={toDateTimeLocalValue(firstCandle?.timestamp)}
                max={toDateTimeLocalValue(lastCandle?.timestamp)}
                className="w-full bg-slate-900 border border-slate-700/90 rounded-lg p-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                <span>Min: {firstCandle ? new Date(firstCandle.timestamp * 1000).toLocaleDateString() : '---'}</span>
                <span>Max: {lastCandle ? new Date(lastCandle.timestamp * 1000).toLocaleDateString() : '---'}</span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsTimePickerOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleApplyDateTime}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
              >
                Tua Tới Mốc Này
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
