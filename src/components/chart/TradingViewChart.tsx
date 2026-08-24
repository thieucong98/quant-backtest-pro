import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  BarData,
  AreaData,
  BaselineData,
  Time,
  LineStyle,
  PriceScaleMode
} from 'lightweight-charts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { Candle, ChartType, InstrumentSpec, Timeframe } from '../../types/market';
import { DrawingCanvas } from './DrawingCanvas';

/**
 * Tính toán nến Heikin-Ashi làm mượt xu hướng
 */
export function calculateHeikinAshi(rawCandles: Candle[]): Candle[] {
  if (rawCandles.length === 0) return [];
  const haList: Candle[] = [];

  let prevHaOpen = rawCandles[0].open;
  let prevHaClose = rawCandles[0].close;

  for (let i = 0; i < rawCandles.length; i++) {
    const c = rawCandles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haList.push({
      timestamp: c.timestamp,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }
  return haList;
}

/**
 * Thời lượng mỗi Timeframe tính theo giây
 */
const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400
};

export const TradingViewChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
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

  // Prop Firm Shield State
  const [isShieldExpanded, setIsShieldExpanded] = useState<boolean>(true);

  const {
    candles,
    currentIndex,
    instrument,
    timeframe,
    openPositions,
    markers,
    economicNews,
    executeMarketOrder,
    account,
    language,
    isPropFirmMode,
    propFirmDailyLossLimit,
    propFirmMaxDrawdownLimit,
    propFirmProfitTarget,
    propFirmStartingDayBalance,
    chartType,
    isLogScale,
    isPercentageScale,
    isInvertedScale,
    showCountdown,
    showWatermark,
    showGrid,
    toggleLogScale,
    togglePercentageScale,
    toggleInvertedScale
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  // Track last rendered index and candles array reference
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastCandlesRef = useRef<any[] | null>(null);
  const lastChartTypeRef = useRef<ChartType>(chartType);

  // Tạo Main Series theo Chart Type đã chọn
  const createMainSeriesForType = (chart: IChartApi, type: ChartType, spec: InstrumentSpec, basePrice?: number) => {
    const priceFormat = {
      type: 'price' as const,
      precision: spec.digits,
      minMove: spec.pipSize / 10
    };

    switch (type) {
      case 'hollow':
        return chart.addCandlestickSeries({
          upColor: 'rgba(38, 166, 154, 0.05)',
          downColor: '#ef5350',
          borderVisible: true,
          borderColor: '#26a69a',
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat
        });

      case 'heikin-ashi':
      case 'candlestick':
        return chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat
        });

      case 'bar':
        return chart.addBarSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          thinBars: false,
          priceFormat
        });

      case 'line':
        return chart.addLineSeries({
          color: '#6366f1',
          lineWidth: 2,
          priceFormat
        });

      case 'area':
        return chart.addAreaSeries({
          topColor: 'rgba(99, 102, 241, 0.45)',
          bottomColor: 'rgba(99, 102, 241, 0.02)',
          lineColor: '#6366f1',
          lineWidth: 2,
          priceFormat
        });

      case 'baseline':
        return chart.addBaselineSeries({
          baseValue: { type: 'price', price: basePrice || 100 },
          topFillColor1: 'rgba(38, 166, 154, 0.28)',
          topFillColor2: 'rgba(38, 166, 154, 0.05)',
          topLineColor: '#26a69a',
          bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
          bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
          bottomLineColor: '#ef5350',
          lineWidth: 2,
          priceFormat
        });

      default:
        return chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat
        });
    }
  };

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
        vertLines: { color: showGrid ? 'rgba(51, 65, 85, 0.2)' : 'transparent' },
        horzLines: { color: showGrid ? 'rgba(51, 65, 85, 0.2)' : 'transparent' }
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

    const mainSeries = createMainSeriesForType(chart, chartType, instrument, candles[0]?.close);

    const volumeSeries = chart.addHistogramSeries({
      color: '#38bdf8',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0
      }
    });

    chartRef.current = chart;
    mainSeriesRef.current = mainSeries;
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
    };
  }, []);

  // Xử lý khi đổi ChartType
  useEffect(() => {
    if (!chartRef.current || !volumeSeriesRef.current) return;
    if (lastChartTypeRef.current === chartType && mainSeriesRef.current) return;

    if (mainSeriesRef.current) {
      try {
        chartRef.current.removeSeries(mainSeriesRef.current);
      } catch (e) {}
    }

    const newSeries = createMainSeriesForType(chartRef.current, chartType, instrument, candles[0]?.close);
    mainSeriesRef.current = newSeries;
    lastChartTypeRef.current = chartType;

    // Reset render flags to force full data update
    lastRenderedIndexRef.current = -1;
    lastCandlesRef.current = null;
  }, [chartType, instrument]);

  // Cập nhật Price Scale Modes (Logarithmic, Percentage, Invert Scale, Auto Scale)
  useEffect(() => {
    if (!chartRef.current) return;
    const rightScale = chartRef.current.priceScale('right');

    let mode = PriceScaleMode.Normal;
    if (isLogScale) mode = PriceScaleMode.Logarithmic;
    else if (isPercentageScale) mode = PriceScaleMode.Percentage;

    rightScale.applyOptions({
      mode,
      invertScale: isInvertedScale,
      autoScale: true
    });
  }, [isLogScale, isPercentageScale, isInvertedScale]);

  // Cập nhật Gridlines
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      grid: {
        vertLines: { color: showGrid ? 'rgba(51, 65, 85, 0.2)' : 'transparent' },
        horzLines: { color: showGrid ? 'rgba(51, 65, 85, 0.2)' : 'transparent' }
      }
    });
  }, [showGrid]);

  // Cập nhật Instrument digits khi đổi Symbol
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    mainSeriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision: instrument.digits,
        minMove: instrument.pipSize / 10
      }
    });
  }, [instrument]);

  // Dữ liệu nến Heikin-Ashi tính toán trước
  const effectiveCandles = useMemo(() => {
    if (chartType === 'heikin-ashi') {
      return calculateHeikinAshi(candles);
    }
    return candles;
  }, [candles, chartType]);

  // Cập nhật dữ liệu nến khi Replay thay đổi (O(1) Incremental Update)
  useEffect(() => {
    if (!mainSeriesRef.current || !volumeSeriesRef.current || effectiveCandles.length === 0) return;

    const isSameCandlesArray = lastCandlesRef.current === effectiveCandles;
    const isSequentialStep = isSameCandlesArray && currentIndex === lastRenderedIndexRef.current + 1;

    const isLineOrArea = chartType === 'line' || chartType === 'area' || chartType === 'baseline';

    if (isSequentialStep) {
      // ⚡ FAST PATH: O(1) Incremental Update (0.05ms)
      const c = effectiveCandles[currentIndex];
      if (c) {
        if (isLineOrArea) {
          mainSeriesRef.current.update({
            time: (c.timestamp / 1000) as Time,
            value: c.close
          });
        } else {
          mainSeriesRef.current.update({
            time: (c.timestamp / 1000) as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          });
        }

        volumeSeriesRef.current.update({
          time: (c.timestamp / 1000) as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)'
        });

        lastRenderedIndexRef.current = currentIndex;
      }
    } else {
      // 🔄 FULL PATH: Chạy khi Load dữ liệu mới, Đổi Type, Đổi TF, hoặc Kéo thanh Scrubber
      const visibleCandles = effectiveCandles.slice(0, currentIndex + 1);

      if (isLineOrArea) {
        const lineData: LineData<Time>[] = visibleCandles.map(c => ({
          time: (c.timestamp / 1000) as Time,
          value: c.close
        }));
        mainSeriesRef.current.setData(lineData);
      } else {
        const candleData: CandlestickData<Time>[] = visibleCandles.map(c => ({
          time: (c.timestamp / 1000) as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));
        mainSeriesRef.current.setData(candleData);
      }

      const volumeData = visibleCandles.map(c => ({
        time: (c.timestamp / 1000) as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)'
      }));
      volumeSeriesRef.current.setData(volumeData);

      lastCandlesRef.current = effectiveCandles;
      lastRenderedIndexRef.current = currentIndex;
      chartRef.current?.timeScale().scrollToRealTime();
    }

    // Render Markers
    const currentMaxTime = effectiveCandles[currentIndex]?.timestamp || 0;
    const activeMarkers = markers
      .filter(m => m.time <= currentMaxTime)
      .map(m => ({
        time: (Math.floor(m.time / 1000)) as Time,
        position: m.position as any,
        color: m.color,
        shape: m.shape as any,
        text: m.text,
        size: 1.2
      }));

    // Thêm Economic News Markers
    const newsMarkers = economicNews
      .filter(n => n.timestamp <= currentMaxTime)
      .map(n => ({
        time: (Math.floor(n.timestamp / 1000)) as Time,
        position: 'aboveBar' as any,
        color: n.impact === 'HIGH' ? '#f43f5e' : '#f59e0b',
        shape: 'circle' as any,
        text: `📰 ${n.title}`,
        size: 1.5
      }));

    const allMarkers = [...activeMarkers, ...newsMarkers].sort((a, b) => (a.time as number) - (b.time as number));
    mainSeriesRef.current.setMarkers(allMarkers);
  }, [effectiveCandles, currentIndex, markers, economicNews, instrument.digits, chartType]);

  // Cập nhật đường giá hiển thị cho Open Positions (Entry, SL, TP lines với số tiền USD & %)
  useEffect(() => {
    if (!mainSeriesRef.current) return;

    priceLinesRef.current.forEach(line => {
      try {
        mainSeriesRef.current?.removePriceLine(line);
      } catch (e) {}
    });
    priceLinesRef.current = [];

    openPositions.forEach(pos => {
      // 1. Entry Line
      const entryLine = mainSeriesRef.current?.createPriceLine({
        price: pos.entryPrice,
        color: pos.side === 'BUY' ? '#26a69a' : '#ef5350',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${pos.side} ${pos.lotSize}L @ ${pos.entryPrice.toFixed(instrument.digits)}`
      });
      if (entryLine) priceLinesRef.current.push(entryLine);

      // 2. Stop Loss Line with Dollar Risk & Percent
      if (pos.stopLoss) {
        const slDiff = pos.side === 'BUY' ? pos.stopLoss - pos.entryPrice : pos.entryPrice - pos.stopLoss;
        const slDollar = slDiff * instrument.contractSize * pos.lotSize;
        const slPercent = (slDollar / account.initialBalance) * 100;

        const slLine = mainSeriesRef.current?.createPriceLine({
          price: pos.stopLoss,
          color: '#ef5350',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL: -$${Math.abs(slDollar).toFixed(2)} (${slPercent.toFixed(2)}%)`
        });
        if (slLine) priceLinesRef.current.push(slLine);
      }

      // 3. Take Profit Line with Dollar Gain & Percent
      if (pos.takeProfit) {
        const tpDiff = pos.side === 'BUY' ? pos.takeProfit - pos.entryPrice : pos.entryPrice - pos.takeProfit;
        const tpDollar = tpDiff * instrument.contractSize * pos.lotSize;
        const tpPercent = (tpDollar / account.initialBalance) * 100;

        const tpLine = mainSeriesRef.current?.createPriceLine({
          price: pos.takeProfit,
          color: '#26a69a',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP: +$${tpDollar.toFixed(2)} (+${tpPercent.toFixed(2)}%)`
        });
        if (tpLine) priceLinesRef.current.push(tpLine);
      }
    });
  }, [openPositions, instrument, account.initialBalance, chartType]);

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

  // Tính toán Countdown to Bar Close
  const countdownText = useMemo(() => {
    if (!showCountdown || candles.length === 0 || currentIndex < 0) return null;
    const currentCandle = candles[currentIndex];
    if (!currentCandle) return null;

    const tfSec = TIMEFRAME_SECONDS[timeframe] || 300;
    const candleSec = Math.floor(currentCandle.timestamp / 1000);
    const nextCloseSec = (Math.floor(candleSec / tfSec) + 1) * tfSec;
    const remainingSec = Math.max(0, nextCloseSec - candleSec);

    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [showCountdown, candles, currentIndex, timeframe]);

  // Prop Firm Calculations
  const dailyLossMax = (propFirmStartingDayBalance * (propFirmDailyLossLimit / 100));
  const currentDailyLoss = Math.max(0, propFirmStartingDayBalance - account.equity);
  const dailyLossPercent = (currentDailyLoss / propFirmStartingDayBalance) * 100;

  const maxDDMax = (account.initialBalance * (propFirmMaxDrawdownLimit / 100));
  const currentMaxDD = Math.max(0, account.initialBalance - account.equity);
  const maxDDPercent = (currentMaxDD / account.initialBalance) * 100;

  const profitTargetMax = (account.initialBalance * (propFirmProfitTarget / 100));
  const currentProfit = Math.max(0, account.equity - account.initialBalance);
  const profitProgressPercent = Math.min(100, (currentProfit / profitTargetMax) * 100);

  const isDailyBreached = dailyLossPercent >= propFirmDailyLossLimit;
  const isMaxDDBreached = maxDDPercent >= propFirmMaxDrawdownLimit;
  const isPassed = currentProfit >= profitTargetMax;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden select-none">
      {/* 1. ONE-CLICK QUICK TRADING DOCK (TOP-LEFT OVERLAY) */}
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

            {/* SELL BUTTON */}
            <button
              onClick={() => handleQuickTrade('SELL')}
              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-rose-600/25 active:scale-95 transition-all"
              title="Vào lệnh SELL thị trường"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>{t.sell}</span>
            </button>

            {/* LOT SIZE INPUT */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold">LOT:</span>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={quickLot}
                onChange={(e) => setQuickLot(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-12 bg-transparent text-slate-100 font-bold text-center focus:outline-hidden"
              />
            </div>

            {/* AUTO SL / TP TOGGLES */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
              <label className="flex items-center gap-1 cursor-pointer" title="Tự động gắn Stop Loss khi vào lệnh">
                <input
                  type="checkbox"
                  checked={useAutoSL}
                  onChange={(e) => setUseAutoSL(e.target.checked)}
                  className="accent-rose-500 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">SL</span>
                {useAutoSL && (
                  <input
                    type="number"
                    value={autoSLPips}
                    onChange={(e) => setAutoSLPips(parseInt(e.target.value) || 10)}
                    className="w-8 bg-slate-900 border border-slate-700 text-rose-400 font-bold text-[10px] px-1 rounded text-center"
                  />
                )}
              </label>

              <label className="flex items-center gap-1 cursor-pointer" title="Tự động gắn Take Profit khi vào lệnh">
                <input
                  type="checkbox"
                  checked={useAutoTP}
                  onChange={(e) => setUseAutoTP(e.target.checked)}
                  className="accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">TP</span>
                {useAutoTP && (
                  <input
                    type="number"
                    value={autoTPPips}
                    onChange={(e) => setAutoTPPips(parseInt(e.target.value) || 20)}
                    className="w-8 bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-[10px] px-1 rounded text-center"
                  />
                )}
              </label>
            </div>

            {/* COLLAPSE DOCK BUTTON */}
            <button
              onClick={() => setIsQuickDockOpen(false)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
              title="Thu nhỏ thanh Quick Trade"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsQuickDockOpen(true)}
            className="bg-[#111622]/95 border border-slate-700/90 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xl backdrop-blur-md hover:bg-slate-800 text-xs font-bold font-mono text-slate-300"
            title="Mở rộng thanh Quick Trade"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Quick Trade</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* 2. PROP FIRM CHALLENGE SHIELD (TOP-RIGHT OVERLAY) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 font-mono">
        {isPropFirmMode && (
          <div className="bg-[#111622]/95 border border-slate-700/90 backdrop-blur-md rounded-xl p-2.5 shadow-2xl text-xs space-y-2 min-w-[260px] animate-in fade-in">
            {/* Header / Badges */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Shield className={`w-4 h-4 ${isDailyBreached || isMaxDDBreached ? 'text-rose-500' : isPassed ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span>{t.propFirmShieldTitle}</span>
              </div>
              <div className="flex items-center gap-1">
                {isPassed && (
                  <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold">
                    {t.passChallengeBadge}
                  </span>
                )}
                {(isDailyBreached || isMaxDDBreached) && (
                  <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-500/40 rounded text-[9px] font-bold">
                    {t.violatedBadge}
                  </span>
                )}
                <button
                  onClick={() => setIsShieldExpanded(!isShieldExpanded)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded"
                >
                  {isShieldExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isShieldExpanded ? (
              <div className="space-y-2 pt-0.5">
                {/* Metric 1: Daily Loss Limit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{t.dailyLossLabel} ({propFirmDailyLossLimit}%):</span>
                    <span className={`font-bold ${dailyLossPercent >= 4.0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      ${currentDailyLoss.toFixed(1)} / ${dailyLossMax.toFixed(0)} ({dailyLossPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${dailyLossPercent >= 4.0 ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, (dailyLossPercent / propFirmDailyLossLimit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: Max Drawdown Limit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{t.maxDrawdownLabel} ({propFirmMaxDrawdownLimit}%):</span>
                    <span className={`font-bold ${maxDDPercent >= 8.0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      ${currentMaxDD.toFixed(1)} / ${maxDDMax.toFixed(0)} ({maxDDPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${maxDDPercent >= 8.0 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, (maxDDPercent / propFirmMaxDrawdownLimit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 3: Target Profit Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{t.profitTargetLabel} (+{propFirmProfitTarget}%):</span>
                    <span className="font-bold text-emerald-400">
                      +${currentProfit.toFixed(1)} / ${profitTargetMax.toFixed(0)} ({profitProgressPercent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${profitProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsShieldExpanded(true)}
                className="bg-[#111622]/95 border border-slate-700/90 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xl backdrop-blur-md hover:bg-slate-800 text-[11px] font-bold text-slate-300"
                title="Mở rộng Prop Firm Shield"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shield: {isDailyBreached || isMaxDDBreached ? '⛔' : `${dailyLossPercent.toFixed(1)}% / 5%`}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. SYMBOL WATERMARK BACKGROUND OVERLAY */}
      {showWatermark && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]">
          <div className="text-8xl sm:text-9xl font-black tracking-tighter text-slate-100 font-mono">
            {instrument.symbol}
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-widest text-indigo-400 font-mono mt-1">
            {timeframe} • QUANT BACKTEST PRO
          </div>
        </div>
      )}

      {/* 4. COUNTDOWN TIMER TO BAR CLOSE */}
      {countdownText && (
        <div className="absolute top-16 right-3 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono text-amber-300 shadow-md">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-bold">{countdownText}</span>
          <span className="text-[10px] text-slate-500">đóng nến</span>
        </div>
      )}

      {/* 5. TRADINGVIEW BOTTOM-RIGHT SCALE TOOLBAR */}
      <div className="absolute bottom-6 right-16 z-20 flex items-center gap-1 bg-[#111622]/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-[10px] font-mono shadow-xl">
        <button
          onClick={toggleLogScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isLogScale ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Bật/Tắt thang đo Logarithm (Log)"
        >
          LOG
        </button>
        <button
          onClick={togglePercentageScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isPercentageScale ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Bật/Tắt thang đo Phần trăm (%)"
        >
          %
        </button>
        <button
          onClick={toggleInvertedScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isInvertedScale ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Đảo ngược đồ thị (Invert Scale)"
        >
          INV
        </button>
        <button
          onClick={() => {
            chartRef.current?.timeScale().resetTimeScale();
            chartRef.current?.priceScale('right').applyOptions({ autoScale: true });
          }}
          className="px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Tự động căn chỉnh thang đo (Auto)"
        >
          AUTO
        </button>
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full h-full relative" />

      {/* Overlay Drawing Canvas */}
      <DrawingCanvas chart={chartRef.current} series={mainSeriesRef.current} />
    </div>
  );
};
