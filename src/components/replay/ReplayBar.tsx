import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
  Calendar,
  Layers
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';

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
    timeframe
  } = useBacktestStore();

  const currentCandle = candles[currentIndex];
  const totalCandles = candles.length;
  const progressPercent = totalCandles > 0 ? ((currentIndex + 1) / totalCandles) * 100 : 0;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  return (
    <div className="h-12 bg-[#111622] border-t border-slate-800/80 px-4 flex items-center justify-between gap-4 select-none z-20 text-xs">
      {/* PLAYBACK CONTROLS */}
      <div className="flex items-center gap-1.5">
        {/* Step Backward (-1) */}
        <button
          onClick={stepBackward}
          disabled={isPlaying || currentIndex <= 0}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
          title="Lùi 1 nến (Step -1)"
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
          title="Play / Pause (Phím Space)"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Step Forward Button (+1) */}
        <button
          onClick={stepForward}
          disabled={isPlaying || currentIndex >= totalCandles - 1}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 rounded-md flex items-center gap-1 font-mono transition-colors"
          title="Tới 1 nến (Phím F)"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Step +1</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSimulation}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
          title="Khởi động lại mô phỏng"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 ml-1">
          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-mono hidden md:inline">Tốc độ:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-transparent text-indigo-300 font-bold font-mono focus:outline-none cursor-pointer text-xs"
          >
            <option value={1} className="bg-slate-900">1x (1 nến/s)</option>
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
          {currentIndex + 1} / {totalCandles} nến
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

      {/* DATE / TIMESTAMP DISPLAY */}
      <div className="flex items-center gap-2 font-mono text-slate-300">
        <Calendar className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
        <span className="bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
          {formatDate(currentCandle?.timestamp)}
        </span>
      </div>
    </div>
  );
};
