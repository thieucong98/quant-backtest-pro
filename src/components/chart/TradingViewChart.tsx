import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, LineStyle } from 'lightweight-charts';
import { ArrowUpRight, ArrowDownRight, Zap, Shield, Target } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { DrawingCanvas } from './DrawingCanvas';

export const TradingViewChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Price lines references for open positions and SL/TP
  const priceLinesRef = useRef<any[]>([]);

  // Quick Trade Dock State
  const [quickLot, setQuickLot] = useState<number>(0.1);
  const [useAutoSL, setUseAutoSL] = useState<boolean>(true);
  const [autoSLPips, setAutoSLPips] = useState<number>(20);
  const [useAutoTP, setUseAutoTP] = useState<boolean>(true);
  const [autoTPPips, setAutoTPPips] = useState<number>(40);
  const [isQuickDockOpen, setIsQuickDockOpen] = useState<boolean>(true);

  const {
    candles,
    currentIndex,
    instrument,
    openPositions,
    markers,
    economicNews,
    executeMarketOrder,
    account,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  // Khởi tạo Chart khi component mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#0b0e14' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, Inter, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.2)' },
        horzLines: { color: 'rgba(51, 65, 85, 0.2)' }
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#4f46e5'
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#4f46e5'
        }
      },
      timeScale: {
        borderColor: 'rgba(51, 65, 85, 0.5)',
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: 'rgba(51, 65, 85, 0.5)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      }
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceFormat: {
        type: 'price',
        precision: instrument.digits,
        minMove: instrument.pipSize / 10
      }
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#38bdf8',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale'
    });

    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [instrument.symbol]);

  // Cập nhật dữ liệu nến & Markers khi Replay hoặc chuyển Timeframe
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    candleSeriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision: instrument.digits,
        minMove: instrument.pipSize / 10
      }
    });

    const visibleCandles = candles.slice(0, currentIndex + 1);
    
    const formattedCandles: CandlestickData<Time>[] = visibleCandles.map(c => ({
      time: c.timestamp as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    const formattedVolume = visibleCandles.map(c => ({
      time: c.timestamp as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)'
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolume);

    // Gộp Trade Markers + Economic News Markers
    const allMarkers: any[] = [];

    // 1. Trade Markers
    markers
      .filter(m => m.time <= (candles[currentIndex]?.timestamp || Infinity))
      .forEach(m => {
        allMarkers.push({
          time: m.time as Time,
          position: m.position,
          color: m.color,
          shape: m.shape,
          text: m.text
        });
      });

    // 2. Economic News Markers
    if (economicNews) {
      economicNews
        .filter(n => n.timestamp <= (candles[currentIndex]?.timestamp || Infinity))
        .forEach(n => {
          allMarkers.push({
            time: n.timestamp as Time,
            position: 'inBar',
            color: '#f59e0b',
            shape: 'circle',
            text: `🔴 ${n.title.split(' ')[0]}`
          });
        });
    }

    // Sort ascending by time (bắt buộc đối với Lightweight Charts)
    allMarkers.sort((a, b) => Number(a.time) - Number(b.time));

    candleSeriesRef.current.setMarkers(allMarkers);
    chartRef.current?.timeScale().scrollToRealTime();
  }, [candles, currentIndex, markers, economicNews, instrument.digits]);

  // Cập nhật đường giá hiển thị cho Open Positions (Entry, SL, TP lines)
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    priceLinesRef.current.forEach(line => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch (e) {}
    });
    priceLinesRef.current = [];

    openPositions.forEach(pos => {
      // 1. Entry Line
      const entryLine = candleSeriesRef.current?.createPriceLine({
        price: pos.entryPrice,
        color: pos.side === 'BUY' ? '#26a69a' : '#ef5350',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${pos.side} ${pos.lotSize}L`
      });
      if (entryLine) priceLinesRef.current.push(entryLine);

      // 2. Stop Loss Line
      if (pos.stopLoss) {
        const slLine = candleSeriesRef.current?.createPriceLine({
          price: pos.stopLoss,
          color: '#ef5350',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL (${pos.side})`
        });
        if (slLine) priceLinesRef.current.push(slLine);
      }

      // 3. Take Profit Line
      if (pos.takeProfit) {
        const tpLine = candleSeriesRef.current?.createPriceLine({
          price: pos.takeProfit,
          color: '#26a69a',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP (${pos.side})`
        });
        if (tpLine) priceLinesRef.current.push(tpLine);
      }
    });
  }, [openPositions]);

  // Handle Quick Market Entry
  const handleQuickTrade = (side: 'BUY' | 'SELL') => {
    const currentCandle = candles[currentIndex];
    if (!currentCandle) return;

    let slPrice: number | undefined = undefined;
    let tpPrice: number | undefined = undefined;
    const spread = instrument.defaultSpreadPips * instrument.pipSize;
    const execPrice = side === 'BUY' ? currentCandle.close + spread : currentCandle.close;

    if (useAutoSL) {
      const slDist = autoSLPips * instrument.pipSize;
      slPrice = side === 'BUY' ? execPrice - slDist : execPrice + slDist;
    }

    if (useAutoTP) {
      const tpDist = autoTPPips * instrument.pipSize;
      tpPrice = side === 'BUY' ? execPrice + tpDist : execPrice - tpDist;
    }

    executeMarketOrder(side, quickLot, slPrice, tpPrice);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden select-none">
      {/* 1. ONE-CLICK QUICK TRADING DOCK (OVERLAY) */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        {isQuickDockOpen ? (
          <div className="bg-[#111622]/95 border border-slate-700/90 backdrop-blur-md p-2 rounded-xl flex items-center gap-2.5 shadow-2xl animate-in fade-in zoom-in-95 text-xs font-mono">
            {/* BUY BUTTON */}
            <button
              onClick={() => handleQuickTrade('BUY')}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
              title="Vào lệnh BUY thị trường"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.buy}</span>
            </button>

            {/* LOT SIZE STEPPER CONTROLLER */}
            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQuickLot(Math.max(instrument.minLot, Number((quickLot - instrument.lotStep).toFixed(2))))}
                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-xs"
                title="Giảm Lot"
              >
                -
              </button>
              <input
                type="number"
                step={instrument.lotStep}
                min={instrument.minLot}
                max={instrument.maxLot}
                value={quickLot}
                onChange={(e) => setQuickLot(parseFloat(e.target.value) || instrument.minLot)}
                className="w-13 bg-transparent text-center font-bold text-slate-100 py-1 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Khối lượng Lot"
              />
              <button
                type="button"
                onClick={() => setQuickLot(Math.min(instrument.maxLot, Number((quickLot + instrument.lotStep).toFixed(2))))}
                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-xs"
                title="Tăng Lot"
              >
                +
              </button>
            </div>

            {/* SELL BUTTON */}
            <button
              onClick={() => handleQuickTrade('SELL')}
              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-rose-600/25 active:scale-95 transition-all"
              title="Vào lệnh SELL thị trường"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>{t.sell}</span>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-0.5" />

            {/* AUTO SL PILL CONTAINER */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              useAutoSL ? 'bg-rose-950/40 border-rose-500/40' : 'bg-slate-950/60 border-slate-800 opacity-70'
            }`}>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAutoSL}
                  onChange={(e) => setUseAutoSL(e.target.checked)}
                  className="rounded accent-rose-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-rose-400 font-bold text-[11px]">SL:</span>
              </label>
              <input
                type="number"
                value={autoSLPips}
                onChange={(e) => setAutoSLPips(parseInt(e.target.value) || 0)}
                disabled={!useAutoSL}
                className="w-12 bg-slate-900 border border-slate-700/80 rounded text-center text-xs font-bold py-0.5 text-slate-100 focus:outline-none focus:border-rose-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-slate-500 text-[10px]">p</span>
            </div>

            {/* AUTO TP PILL CONTAINER */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
              useAutoTP ? 'bg-teal-950/40 border-teal-500/40' : 'bg-slate-950/60 border-slate-800 opacity-70'
            }`}>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAutoTP}
                  onChange={(e) => setUseAutoTP(e.target.checked)}
                  className="rounded accent-teal-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-teal-400 font-bold text-[11px]">TP:</span>
              </label>
              <input
                type="number"
                value={autoTPPips}
                onChange={(e) => setAutoTPPips(parseInt(e.target.value) || 0)}
                disabled={!useAutoTP}
                className="w-12 bg-slate-900 border border-slate-700/80 rounded text-center text-xs font-bold py-0.5 text-slate-100 focus:outline-none focus:border-teal-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-slate-500 text-[10px]">p</span>
            </div>

            {/* LIVE R:R RATIO BADGE */}
            {useAutoSL && useAutoTP && autoSLPips > 0 && autoTPPips > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-bold text-[10px]" title="Tỷ lệ Risk:Reward">
                1:{(autoTPPips / autoSLPips).toFixed(1)} R
              </span>
            )}

            {/* MINIMIZE BUTTON */}
            <button
              onClick={() => setIsQuickDockOpen(false)}
              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition-colors"
              title="Thu gọn"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsQuickDockOpen(true)}
            className="bg-[#111622]/95 border border-slate-700/90 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-indigo-300 font-bold hover:bg-slate-800 transition-all shadow-xl backdrop-blur-md active:scale-95"
            title="Mở Quick Trade"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.quickTrade}</span>
          </button>
        )}
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full h-full relative" />
      
      {/* Overlay Drawing Canvas */}
      <DrawingCanvas chart={chartRef.current} series={candleSeriesRef.current} />
    </div>
  );
};
