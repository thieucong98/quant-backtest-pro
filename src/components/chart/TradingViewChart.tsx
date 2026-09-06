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
  Clock,
  Minus,
  Plus,
  Scale
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { useBrokerStore } from '../../store/brokerStore';
import { getTranslation, formatText } from '../../i18n';
import { Candle, ChartType, InstrumentSpec, Timeframe } from '../../types/market';
import { MultiAssetMathEngine } from '../../engine/quantMath';
import { snapEventToBarTime, getCurrenciesForSymbol } from '../../config/newsEvents';
import { DrawingCanvas } from './DrawingCanvas';
import { AIBotHUD } from '../panels/AIBotHUD';
import { VisualChartTradingOverlay } from './VisualChartTradingOverlay';

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

  // Quick Trade Dock State (Mặc định mở trên desktop, thu gọn trên mobile)
  const [quickLot, setQuickLot] = useState<number>(0.1);
  const [useAutoSL, setUseAutoSL] = useState<boolean>(true);
  const [autoSLPips, setAutoSLPips] = useState<number>(20);
  const [useAutoTP, setUseAutoTP] = useState<boolean>(true);
  const [autoTPPips, setAutoTPPips] = useState<number>(40);
  const [isQuickDockOpen, setIsQuickDockOpen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 640 : true
  );

  // Prop Firm Shield State (Mặc định thu gọn dạng Micro-Pill để không che nến)
  const [isShieldExpanded, setIsShieldExpanded] = useState<boolean>(false);

  const {
    candles,
    currentIndex,
    instrument,
    timeframe,
    openPositions,
    markers,
    economicNews,
    showEconomicNews,
    economicNewsFilter,
    economicNewsDisplayMode,
    economicNewsOnlyCurrentPair,
    selectedCalendarCurrency,
    executeMarketOrder,
    addStrategyLog,
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

  const {
    isLiveTradingMode,
    activeBroker,
    liveTicks,
    positions: livePositions,
    executeLiveMarketOrder,
    connectionStatus: brokerStatus
  } = useBrokerStore();

  const isLiveActive = isLiveTradingMode && brokerStatus === 'CONNECTED';
  const t = getTranslation(language);

  // Real-time second clock for live candle countdown
  const [nowSec, setNowSec] = useState<number>(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!isLiveActive) return;
    const id = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isLiveActive]);

  // Track last rendered index and candles array reference
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastCandlesRef = useRef<any[] | null>(null);
  const lastChartTypeRef = useRef<ChartType>(chartType);

  // Tự động thu gọn Quick Trade dock khi chuyển sang màn hình nhỏ
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsQuickDockOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    // ResizeObserver: Instantly adapts chart width/height when bottom dock is dragged
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === chartContainerRef.current && chartRef.current) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            chartRef.current.applyOptions({ width, height });
          }
        }
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Auto-calibration event listener when user clicks "Reset Default Height & Aspect Ratio"
    const handleResetLayout = () => {
      if (chartRef.current && chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        chartRef.current.applyOptions({ width, height });
        try {
          chartRef.current.priceScale('right').applyOptions({ autoScale: true });
          chartRef.current.timeScale().fitContent();
        } catch (e) {}
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('quant:reset-chart-layout', handleResetLayout);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('quant:reset-chart-layout', handleResetLayout);
      resizeObserver.disconnect();
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

    try {
      const isSameCandlesArray = lastCandlesRef.current === effectiveCandles;
      const isSequentialStep = isSameCandlesArray && currentIndex === lastRenderedIndexRef.current + 1;
      const isLineOrArea = chartType === 'line' || chartType === 'area' || chartType === 'baseline';

      const toTimeSec = (ts: number): Time => (ts > 1e11 ? Math.floor(ts / 1000) : Math.floor(ts)) as Time;

      if (isSequentialStep) {
        // ⚡ FAST PATH: O(1) Incremental Update (0.05ms)
        const c = effectiveCandles[currentIndex];
        if (c) {
          const tSec = toTimeSec(c.timestamp);
          if (isLineOrArea) {
            mainSeriesRef.current.update({
              time: tSec,
              value: c.close
            });
          } else {
            mainSeriesRef.current.update({
              time: tSec,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close
            });
          }

          volumeSeriesRef.current.update({
            time: tSec,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)'
          });

          lastRenderedIndexRef.current = currentIndex;
        }
      } else {
        // 🔄 FULL PATH: Chạy khi Load dữ liệu mới, Đổi Type, Đổi TF, hoặc Kéo thanh Scrubber
        const visibleCandles = effectiveCandles.slice(0, currentIndex + 1);

        // Sanitize & strictly deduplicate timestamps
        const cleanCandles: Candle[] = [];
        let lastTs = -1;
        for (const c of visibleCandles) {
          const sec = c.timestamp > 1e11 ? Math.floor(c.timestamp / 1000) : Math.floor(c.timestamp);
          if (sec > lastTs) {
            cleanCandles.push({ ...c, timestamp: sec });
            lastTs = sec;
          }
        }

        if (cleanCandles.length === 0) return;

        if (isLineOrArea) {
          const lineData: LineData<Time>[] = cleanCandles.map(c => ({
            time: c.timestamp as Time,
            value: c.close
          }));
          mainSeriesRef.current.setData(lineData);
        } else {
          const candleData: CandlestickData<Time>[] = cleanCandles.map(c => ({
            time: c.timestamp as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          }));
          mainSeriesRef.current.setData(candleData);
        }

        const volumeData = cleanCandles.map(c => ({
          time: c.timestamp as Time,
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
      const maxSec = currentMaxTime > 1e11 ? Math.floor(currentMaxTime / 1000) : Math.floor(currentMaxTime);
      const activeMarkers = markers
        .filter(m => (m.time > 1e11 ? Math.floor(m.time / 1000) : m.time) <= maxSec)
        .map(m => ({
          time: (m.time > 1e11 ? Math.floor(m.time / 1000) : m.time) as Time,
          position: m.position as any,
          color: m.color,
          shape: m.shape as any,
          text: m.text,
          size: 1.2
        }));

      // Thêm Economic News Markers với Smart Bar Snapping & Adaptive Decluttering
      let newsMarkers: any[] = [];
      if (showEconomicNews && economicNews.length > 0) {
        const visibleBarSecs = effectiveCandles
          .slice(0, currentIndex + 1)
          .map((c: Candle) => (c.timestamp > 1e11 ? Math.floor(c.timestamp / 1000) : Math.floor(c.timestamp)));

        // 1. Xác định chế độ hiển thị hiệu dụng (Effective Display Mode)
        const isHighTimeframe = timeframe === 'D1' || (timeframe as any) === 'W1' || (timeframe as any) === 'MN' || effectiveCandles.length > 600;
        const effectiveMode = economicNewsDisplayMode === 'AUTO'
          ? (isHighTimeframe ? 'CLUSTERED' : 'FULL')
          : economicNewsDisplayMode;

        // 2. Danh sách tiền tệ liên quan tới cặp đang xem (ví dụ XAUUSD -> USD, XAU, GLOBAL)
        const relevantCurrencies = getCurrenciesForSymbol(instrument.symbol);

        // 3. Lọc sự kiện theo cặp tiền và mức tác động
        const filteredNews = economicNews.filter(n => {
          if (economicNewsOnlyCurrentPair) {
            if (!relevantCurrencies.includes(n.currency) && n.currency !== 'GLOBAL') {
              return false;
            }
          }
          if (selectedCalendarCurrency !== 'ALL') {
            if (n.currency !== selectedCalendarCurrency && n.currency !== 'GLOBAL') return false;
          }
          if (economicNewsFilter === 'HIGH') {
            return n.impact === 'HIGH';
          } else if (economicNewsFilter === 'HIGH_MEDIUM') {
            return n.impact === 'HIGH' || n.impact === 'MEDIUM';
          }
          return true;
        });

        // 4. Gom nhóm các tin tức theo từng thanh nến (Bar Snapping + Bucket Grouping)
        const barEventMap = new Map<number, typeof economicNews>();
        for (const n of filteredNews) {
          const rawSec = n.timestamp > 1e11 ? Math.floor(n.timestamp / 1000) : n.timestamp;
          if (rawSec > maxSec) continue;
          const snappedBarSec = snapEventToBarTime(rawSec, visibleBarSecs);
          if (!snappedBarSec) continue;

          const existing = barEventMap.get(snappedBarSec);
          if (existing) {
            existing.push(n);
          } else {
            barEventMap.set(snappedBarSec, [n]);
          }
        }

        // 5. Tạo Markers theo chế độ hiển thị (COMPACT vs CLUSTERED vs FULL)
        barEventMap.forEach((eventsOnBar, snappedBarSec) => {
          // Ưu tiên tin có tác động cao nhất lên đầu
          eventsOnBar.sort((a, b) => {
            const impactScore = (imp: string) => imp === 'HIGH' ? 3 : imp === 'MEDIUM' ? 2 : 1;
            return impactScore(b.impact) - impactScore(a.impact);
          });

          const primaryEvent = eventsOnBar[0];
          const hasHigh = eventsOnBar.some(e => e.impact === 'HIGH');
          const hasMedium = eventsOnBar.some(e => e.impact === 'MEDIUM');
          const color = hasHigh ? '#f43f5e' : hasMedium ? '#f59e0b' : '#0ea5e9';
          const emoji = hasHigh ? '🔴' : hasMedium ? '🟡' : '🔵';

          let markerText: string | undefined;

          if (effectiveMode === 'COMPACT') {
            // Tối giản tuyệt đối: Chỉ hiển thị icon chấm tròn thanh thoát, không chữ che nến
            markerText = undefined;
          } else if (effectiveMode === 'CLUSTERED') {
            // Gộp cụm thông minh: Tối đa 1 badge ngắn gọn cho mỗi cây nến
            if (eventsOnBar.length === 1) {
              const shortTitle = primaryEvent.title.length > 20 ? primaryEvent.title.slice(0, 18) + '…' : primaryEvent.title;
              markerText = `${emoji} ${primaryEvent.currency} ${shortTitle}`;
            } else {
              const shortTitle = primaryEvent.title.length > 14 ? primaryEvent.title.slice(0, 12) + '…' : primaryEvent.title;
              markerText = `${emoji} [${eventsOnBar.length}] ${primaryEvent.currency} ${shortTitle}`;
            }
          } else {
            // FULL MODE: Hiển thị đầy đủ tiêu đề và giá trị công bố
            if (eventsOnBar.length === 1) {
              markerText = `${emoji} ${primaryEvent.currency} ${primaryEvent.title}${primaryEvent.actual ? ` [${primaryEvent.actual}]` : ''}`;
            } else {
              markerText = `${emoji} ${primaryEvent.currency} ${primaryEvent.title} (+${eventsOnBar.length - 1})`;
            }
          }

          newsMarkers.push({
            time: snappedBarSec as Time,
            position: 'aboveBar' as any,
            color,
            shape: 'circle' as any,
            text: markerText,
            size: hasHigh ? (effectiveMode === 'COMPACT' ? 1.3 : 1.5) : (effectiveMode === 'COMPACT' ? 1.0 : 1.2)
          });
        });
      }

      const allMarkers = [...activeMarkers, ...newsMarkers].sort((a, b) => (a.time as number) - (b.time as number));
      mainSeriesRef.current.setMarkers(allMarkers);
    } catch (err) {
      console.error('Error rendering chart candles:', err);
    }
  }, [
    effectiveCandles,
    currentIndex,
    markers,
    economicNews,
    showEconomicNews,
    economicNewsFilter,
    economicNewsDisplayMode,
    economicNewsOnlyCurrentPair,
    selectedCalendarCurrency,
    instrument.digits,
    instrument.symbol,
    timeframe,
    chartType
  ]);

  // Cập nhật đường giá hiển thị cho Open Positions (Hỗ trợ cả Sandbox & Live Broker Positions)
  useEffect(() => {
    if (!mainSeriesRef.current) return;

    try {
      priceLinesRef.current.forEach(line => {
        try {
          mainSeriesRef.current?.removePriceLine(line);
        } catch (e) {}
      });
      priceLinesRef.current = [];

      const activePositionsToDraw = isLiveActive
        ? (livePositions || [])
            .filter((p) => p.symbol === instrument.symbol)
            .map((p) => ({
              symbol: p.symbol,
              side: p.side || (p.type === 0 ? 'BUY' : 'SELL'),
              lotSize: Number(p.lotSize || (p as any).volume || 0.1),
              entryPrice: Number(p.openPrice || (p as any).price_open || 0),
              stopLoss: p.sl && p.sl > 0 ? Number(p.sl) : undefined,
              takeProfit: p.tp && p.tp > 0 ? Number(p.tp) : undefined,
              ticket: p.ticket
            }))
        : openPositions.map((p) => ({
            symbol: p.symbol,
            side: p.side,
            lotSize: Number(p.lotSize || 0.1),
            entryPrice: Number(p.entryPrice || 0),
            stopLoss: p.stopLoss && p.stopLoss > 0 ? Number(p.stopLoss) : undefined,
            takeProfit: p.takeProfit && p.takeProfit > 0 ? Number(p.takeProfit) : undefined,
            ticket: undefined
          }));

      activePositionsToDraw.forEach(pos => {
        if (!pos.entryPrice || isNaN(pos.entryPrice) || pos.entryPrice <= 0) return;

        // 1. Entry Line
        const title = pos.ticket
          ? `${pos.side} ${pos.lotSize}L @ ${pos.entryPrice.toFixed(instrument.digits)} (#${pos.ticket})`
          : `${pos.side} ${pos.lotSize}L @ ${pos.entryPrice.toFixed(instrument.digits)}`;

        const entryLine = mainSeriesRef.current?.createPriceLine({
          price: pos.entryPrice,
          color: pos.side === 'BUY' ? '#26a69a' : '#ef5350',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title
        });
        if (entryLine) priceLinesRef.current.push(entryLine);

        // 2. Stop Loss Line with Dollar Risk & Percent
        if (pos.stopLoss && !isNaN(pos.stopLoss) && pos.stopLoss > 0) {
          const slDiff = pos.side === 'BUY' ? pos.stopLoss - pos.entryPrice : pos.entryPrice - pos.stopLoss;
          const slDollar = Math.abs(slDiff * instrument.contractSize * pos.lotSize);
          const slPercent = account.initialBalance > 0 ? (slDollar / account.initialBalance) * 100 : 0;

          const slLine = mainSeriesRef.current?.createPriceLine({
            price: pos.stopLoss,
            color: '#ef5350',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `SL: -$${slDollar.toFixed(2)} (${slPercent < 0.01 ? slPercent.toFixed(3) : slPercent.toFixed(2)}%)`
          });
          if (slLine) priceLinesRef.current.push(slLine);
        }

        // 3. Take Profit Line with Dollar Gain
        if (pos.takeProfit && !isNaN(pos.takeProfit) && pos.takeProfit > 0) {
          const tpDiff = pos.side === 'BUY' ? pos.takeProfit - pos.entryPrice : pos.entryPrice - pos.takeProfit;
          const tpDollar = Math.abs(tpDiff * instrument.contractSize * pos.lotSize);
          const tpPercent = account.initialBalance > 0 ? (tpDollar / account.initialBalance) * 100 : 0;

          const tpLine = mainSeriesRef.current?.createPriceLine({
            price: pos.takeProfit,
            color: '#26a69a',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `TP: +$${tpDollar.toFixed(2)} (+${tpPercent < 0.01 ? tpPercent.toFixed(3) : tpPercent.toFixed(2)}%)`
          });
          if (tpLine) priceLinesRef.current.push(tpLine);
        }
      });
    } catch (err) {
      console.error('Error updating position price lines:', err);
    }
  }, [openPositions, livePositions, isLiveActive, instrument, account.initialBalance, chartType]);

  // Handle Quick Market Entry
  const handleQuickTrade = async (side: 'BUY' | 'SELL') => {
    const currentCandle = candles[currentIndex];
    if (!currentCandle) return;

    let slPrice: number | undefined = undefined;
    let tpPrice: number | undefined = undefined;
    const spread = (liveTicks[instrument.symbol]?.spread ? (liveTicks[instrument.symbol].spread * (instrument.pipSize / 10)) : instrument.defaultSpreadPips * instrument.pipSize);
    const execPrice = side === 'BUY' ? (liveTicks[instrument.symbol]?.ask || currentCandle.close + spread) : (liveTicks[instrument.symbol]?.bid || currentCandle.close);

    if (useAutoSL) {
      const slDist = autoSLPips * instrument.pipSize;
      const rawSL = side === 'BUY' ? execPrice - slDist : execPrice + slDist;
      slPrice = Number(rawSL.toFixed(instrument.digits));
    }

    if (useAutoTP) {
      const tpDist = autoTPPips * instrument.pipSize;
      const rawTP = side === 'BUY' ? execPrice + tpDist : execPrice - tpDist;
      tpPrice = Number(rawTP.toFixed(instrument.digits));
    }

    if (isLiveActive && brokerStatus === 'CONNECTED') {
      const res = await executeLiveMarketOrder(instrument.symbol, side, quickLot, slPrice, tpPrice);
      if (res.success) {
        addStrategyLog('INFO', formatText(t.quickTradeLiveFilled, { side, lot: quickLot, symbol: instrument.symbol, ticket: res.ticket || 'OK' }));
      } else {
        alert(formatText(t.quickTradeLiveFailed, { side, message: res.message || 'Error' }));
      }
      return;
    } else {
      executeMarketOrder(side, quickLot, slPrice, tpPrice);
      addStrategyLog('INFO', formatText(t.quickTradeSandboxFilled, { side, lot: quickLot, symbol: instrument.symbol }));
    }
  };

  // Tính toán Live Bid, Ask & Pip Value ước tính
  const currentCandle = candles[currentIndex];
  const currentLiveTick = liveTicks[instrument.symbol];
  const currentBid = isLiveActive && currentLiveTick ? currentLiveTick.bid : (currentCandle?.close || 0);
  const spreadValue = isLiveActive && currentLiveTick ? (currentLiveTick.ask - currentLiveTick.bid) : (instrument.defaultSpreadPips * instrument.pipSize);
  const currentAsk = isLiveActive && currentLiveTick ? currentLiveTick.ask : (currentBid + spreadValue);

  const pipDollarValue = currentCandle
    ? MultiAssetMathEngine.calculatePipValue(instrument, quickLot, currentBid)
    : 10 * quickLot;

  const slRiskDollar = autoSLPips * pipDollarValue;
  const slRiskPercent = account.initialBalance > 0 ? (slRiskDollar / account.initialBalance) * 100 : 0;

  const tpGainDollar = autoTPPips * pipDollarValue;
  const tpGainPercent = account.initialBalance > 0 ? (tpGainDollar / account.initialBalance) * 100 : 0;

  // Format phần trăm thông minh (không bị 0.0% khi tài khoản lớn)
  const formatRiskPercent = (pct: number) => {
    if (pct === 0) return '0.00%';
    if (pct < 0.01) return pct.toFixed(3) + '%';
    return pct.toFixed(2) + '%';
  };

  // Tính toán Tỷ lệ R:R
  const rrRatio = autoSLPips > 0 ? +(autoTPPips / autoSLPips).toFixed(2) : 0;

  // Tính toán Countdown to Bar Close
  const countdownText = useMemo(() => {
    if (!showCountdown || candles.length === 0 || currentIndex < 0) return null;
    if (!currentCandle) return null;

    const tfSec = TIMEFRAME_SECONDS[timeframe] || 300;
    if (isLiveActive) {
      const remainingSec = Math.max(0, tfSec - (nowSec % tfSec));
      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    const candleSec = Math.floor(currentCandle.timestamp / 1000);
    const nextCloseSec = (Math.floor(candleSec / tfSec) + 1) * tfSec;
    const remainingSec = Math.max(0, nextCloseSec - candleSec);

    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [showCountdown, candles, currentIndex, timeframe, currentCandle, isLiveActive, nowSec]);

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
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
        {/* LIVE STREAM STATUS RIBBON */}
        {isLiveActive && (
          <div className="bg-rose-950/90 border border-rose-500/50 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-2 text-[11px] font-mono text-rose-200 shadow-xl max-w-fit animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold">🔴 LIVE STREAM • {activeBroker === 'MT5_EXNESS' ? 'EXNESS MT5' : activeBroker}</span>
            <span className="text-[10px] text-rose-300 border-l border-rose-800/80 pl-1.5 font-bold">
              SPREAD: {currentLiveTick ? (currentLiveTick.spread / 10).toFixed(1) : instrument.defaultSpreadPips}p
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
        {isQuickDockOpen ? (
          <div className="bg-[#111622]/95 border border-slate-700/90 backdrop-blur-md p-2.5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 font-mono text-xs max-w-[95vw] overflow-x-auto">
            <div className="flex items-center gap-3">
              {/* BUY / SELL BUTTONS */}
              <div className="flex items-center gap-1.5">
                {/* BUY BUTTON */}
                <button
                  onClick={() => handleQuickTrade('BUY')}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex flex-col items-center justify-center shadow-lg shadow-emerald-600/25 active:scale-95 transition-all min-w-[76px]"
                  title={t.buyAtAskTooltip.replace('{price}', currentAsk.toFixed(instrument.digits))}
                >
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="font-bold text-xs">{t.buy}</span>
                  </div>
                  <span className="text-[10px] text-emerald-200 font-mono font-medium">
                    {currentAsk.toFixed(instrument.digits)}
                  </span>
                </button>

                {/* SELL BUTTON */}
                <button
                  onClick={() => handleQuickTrade('SELL')}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl flex flex-col items-center justify-center shadow-lg shadow-rose-600/25 active:scale-95 transition-all min-w-[76px]"
                  title={t.sellAtBidTooltip.replace('{price}', currentBid.toFixed(instrument.digits))}
                >
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />
                    <span className="font-bold text-xs">{t.sell}</span>
                  </div>
                  <span className="text-[10px] text-rose-200 font-mono font-medium">
                    {currentBid.toFixed(instrument.digits)}
                  </span>
                </button>
              </div>

              {/* LOT SIZE STEPPER & PRESETS */}
              <div className="flex flex-col gap-1 border-l border-slate-800/90 pl-3">
                <div className="flex items-center gap-1 bg-slate-900/95 px-1.5 py-0.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold px-0.5">LOT:</span>
                  <button
                    onClick={() => setQuickLot(Math.max(0.01, +(quickLot - 0.01).toFixed(2)))}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title={t.decreaseLotTooltip}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={quickLot}
                    onChange={(e) => setQuickLot(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-14 bg-transparent text-slate-100 font-bold text-center text-xs focus:outline-hidden"
                  />
                  <button
                    onClick={() => setQuickLot(+(quickLot + 0.01).toFixed(2))}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title={t.increaseLotTooltip}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1">
                  {[0.01, 0.05, 0.1, 1.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQuickLot(preset)}
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all ${
                        quickLot === preset
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* AUTO SL / TP TOGGLES WITH LIVE DOLLAR RISK */}
              <div className="flex items-center gap-3 border-l border-slate-800/90 pl-3">
                {/* SL Control */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoSL}
                        onChange={(e) => setUseAutoSL(e.target.checked)}
                        className="accent-rose-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-rose-400">SL</span>
                    </label>

                    {useAutoSL && (
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                        <button
                          onClick={() => setAutoSLPips(Math.max(1, autoSLPips - 5))}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          value={autoSLPips}
                          onChange={(e) => setAutoSLPips(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-transparent text-rose-400 font-bold text-[11px] text-center focus:outline-hidden"
                        />
                        <button
                          onClick={() => setAutoSLPips(autoSLPips + 5)}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] text-slate-500 pr-1">pips</span>
                      </div>
                    )}
                  </div>
                  {useAutoSL && (
                    <span className="text-[9px] font-mono text-rose-400/90 pl-5">
                      -${slRiskDollar.toFixed(1)} ({formatRiskPercent(slRiskPercent)})
                    </span>
                  )}
                </div>

                {/* TP Control */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoTP}
                        onChange={(e) => setUseAutoTP(e.target.checked)}
                        className="accent-emerald-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-emerald-400">TP</span>
                    </label>

                    {useAutoTP && (
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
                        <button
                          onClick={() => setAutoTPPips(Math.max(1, autoTPPips - 5))}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          value={autoTPPips}
                          onChange={(e) => setAutoTPPips(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-transparent text-emerald-400 font-bold text-[11px] text-center focus:outline-hidden"
                        />
                        <button
                          onClick={() => setAutoTPPips(autoTPPips + 5)}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[9px] text-slate-500 pr-1">pips</span>
                      </div>
                    )}
                  </div>
                  {useAutoTP && (
                    <span className="text-[9px] font-mono text-emerald-400/90 pl-5">
                      +${tpGainDollar.toFixed(1)} (+{formatRiskPercent(tpGainPercent)})
                    </span>
                  )}
                </div>
              </div>

              {/* R:R RATIO BADGE & 1-CLICK PRESETS */}
              {useAutoSL && useAutoTP && (
                <div className="flex flex-col gap-1 border-l border-slate-800/90 pl-3">
                  {/* Dynamic R:R Badge */}
                  <div
                    className={`px-2 py-0.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 shadow-xs ${
                      rrRatio >= 2.0
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : rrRatio >= 1.0
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40 animate-pulse'
                    }`}
                    title={t.riskRewardRatioTooltip.replace('{ratio}', rrRatio.toString())}
                  >
                    <Scale className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] text-slate-400">R:R</span>
                    <span className="font-bold">1 : {rrRatio}</span>
                  </div>

                  {/* 1-Click R:R Target Presets */}
                  <div className="flex items-center gap-1">
                    {[1.5, 2.0, 3.0, 5.0].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => setAutoTPPips(Math.round(autoSLPips * mult))}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all ${
                          rrRatio === mult
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-emerald-300'
                        }`}
                        title={t.autoSetTPRRTooltip.replace('{mult}', mult.toString()).replace('{pips}', Math.round(autoSLPips * mult).toString())}
                      >
                        1:{mult}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COLLAPSE DOCK BUTTON */}
              <button
                onClick={() => setIsQuickDockOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
                title={t.collapseQuickTradeTooltip}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsQuickDockOpen(true)}
            className="bg-[#111622]/95 border border-slate-700/90 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md hover:bg-slate-800 text-xs font-bold font-mono text-slate-200 transition-all hover:scale-105"
            title={t.expandQuickTradeTooltip}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Quick Trade</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
        </div>
      </div>

      {/* 2. TOP-RIGHT SMART STACKING CONTAINER (ZERO OVERLAPPING & CLEAR OF PRICE SCALE) */}
      <div className="absolute top-12 sm:top-14 xl:top-3 right-2 sm:right-20 md:right-22 z-20 flex flex-col items-end gap-2 font-mono max-w-[calc(100vw-1rem)] sm:max-w-[320px] pointer-events-none">
        <div className="pointer-events-auto w-full flex flex-col items-end gap-2">
          {/* AI BOT FLOATING HUD */}
          <AIBotHUD />

          {/* PROP FIRM CHALLENGE SHIELD */}
          {isPropFirmMode && (
            <div className="bg-[#111622]/95 border border-slate-700/90 backdrop-blur-md rounded-xl p-2 shadow-2xl text-xs space-y-2 w-full transition-all duration-200">
              {/* Header / Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Shield className={`w-4 h-4 ${isDailyBreached || isMaxDDBreached ? 'text-rose-500' : isPassed ? 'text-emerald-400' : 'text-indigo-400'}`} />
                  <span className="text-xs">{t.propFirmShieldTitle}</span>
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
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors"
                    title={t.toggleShieldTooltip}
                  >
                    {isShieldExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {isShieldExpanded && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
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
              )}
            </div>
          )}

          {/* COUNTDOWN TIMER TO BAR CLOSE */}
          {countdownText && (
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono text-amber-300 shadow-md">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold">{countdownText}</span>
              <span className="text-[10px] text-slate-400">{t.candleCloseCountdown}</span>
            </div>
          )}
        </div>
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

      {/* 4. TRADINGVIEW BOTTOM-RIGHT SCALE TOOLBAR */}
      <div className="absolute bottom-6 right-16 z-20 flex items-center gap-1 bg-[#111622]/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-[10px] font-mono shadow-xl">
        <button
          onClick={toggleLogScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isLogScale ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={t.logScaleTooltip}
        >
          LOG
        </button>
        <button
          onClick={togglePercentageScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isPercentageScale ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={t.percentScaleTooltip}
        >
          %
        </button>
        <button
          onClick={toggleInvertedScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isInvertedScale ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={t.invertScaleTooltip}
        >
          INV
        </button>
        <button
          onClick={() => {
            chartRef.current?.timeScale().resetTimeScale();
            chartRef.current?.priceScale('right').applyOptions({ autoScale: true });
          }}
          className="px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={t.autoScaleTooltip}
        >
          AUTO
        </button>
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full h-full relative" />

      {/* Visual Chart Trading (Interactive Drag & Drop SL/TP) */}
      <VisualChartTradingOverlay
        chartApi={chartRef.current}
        seriesApi={mainSeriesRef.current}
        containerRef={chartContainerRef}
        instrument={instrument}
      />

      {/* Overlay Drawing Canvas */}
      <DrawingCanvas chart={chartRef.current} series={mainSeriesRef.current} />
    </div>
  );
};
