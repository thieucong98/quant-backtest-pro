import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  PriceScaleMode,
  MouseEventParams
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
import { PriceScaleContextMenu } from './PriceScaleContextMenu';
import { QuickTradeDock } from './QuickTradeDock';
import { PropFirmHUD } from './PropFirmHUD';

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

  // Bid/Ask and High/Low lines references
  const bidLineRef = useRef<any>(null);
  const askLineRef = useRef<any>(null);
  const highLineRef = useRef<any>(null);
  const lowLineRef = useRef<any>(null);

  // Price-to-bar ratio and Crosshair [+] button states
  const lockedRatioRef = useRef<number | null>(null);
  const [currentRatio, setCurrentRatio] = useState<number | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ y: number; price: number } | null>(null);

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
    isAutoScale,
    isPriceRatioLocked,
    priceScalePosition,
    scaleChartOnly,
    isIndexedScale,
    showScalePlusButton,
    scaleLabels,
    scaleLines,
    resetPriceScaleTrigger,
    showCountdown,
    showWatermark,
    showGrid,
    toggleLogScale,
    togglePercentageScale,
    toggleInvertedScale,
    setAutoScale,
    toggleAutoScale,
    togglePriceRatioLocked,
    setPriceScalePosition,
    togglePriceScalePosition,
    toggleScaleChartOnly,
    setScaleMode,
    triggerResetPriceScale,
    openOrderModalWithPrice,
    setShortcutsModalOpen
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


  // Tạo Main Series theo Chart Type đã chọn
  const createMainSeriesForType = (
    chart: IChartApi,
    type: ChartType,
    spec: InstrumentSpec,
    basePrice?: number,
    priceScale: 'right' | 'left' = 'right'
  ) => {
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
          priceFormat,
          priceScaleId: priceScale
        });

      case 'heikin-ashi':
      case 'candlestick':
        return chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat,
          priceScaleId: priceScale
        });

      case 'bar':
        return chart.addBarSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          thinBars: false,
          priceFormat,
          priceScaleId: priceScale
        });

      case 'line':
        return chart.addLineSeries({
          color: '#6366f1',
          lineWidth: 2,
          priceFormat,
          priceScaleId: priceScale
        });

      case 'area':
        return chart.addAreaSeries({
          topColor: 'rgba(99, 102, 241, 0.45)',
          bottomColor: 'rgba(99, 102, 241, 0.02)',
          lineColor: '#6366f1',
          lineWidth: 2,
          priceFormat,
          priceScaleId: priceScale
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
          priceFormat,
          priceScaleId: priceScale
        });

      default:
        return chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat,
          priceScaleId: priceScale
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
        visible: priceScalePosition === 'right',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      },
      leftPriceScale: {
        visible: priceScalePosition === 'left',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      }
    });

    const mainSeries = createMainSeriesForType(chart, chartType, instrument, candles[0]?.close, priceScalePosition);

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
          chartRef.current.priceScale(priceScalePosition).applyOptions({
            autoScale: true,
            scaleMargins: { top: 0.1, bottom: 0.2 }
          });
          chartRef.current.timeScale().resetTimeScale();
        } catch (e) {}
        setAutoScale(true);
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

    const newSeries = createMainSeriesForType(chartRef.current, chartType, instrument, candles[0]?.close, priceScalePosition);
    mainSeriesRef.current = newSeries;
    lastChartTypeRef.current = chartType;

    // Reset render flags to force full data update
    lastRenderedIndexRef.current = -1;
    lastCandlesRef.current = null;
  }, [chartType, instrument, priceScalePosition]);

  // Cập nhật vị trí Price Scale ('right' | 'left')
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      rightPriceScale: { visible: priceScalePosition === 'right' },
      leftPriceScale: { visible: priceScalePosition === 'left' }
    });
    if (mainSeriesRef.current) {
      mainSeriesRef.current.applyOptions({
        priceScaleId: priceScalePosition
      });
    }
  }, [priceScalePosition]);

  // Dữ liệu nến Heikin-Ashi tính toán trước
  const effectiveCandles = useMemo(() => {
    if (chartType === 'heikin-ashi') {
      return calculateHeikinAshi(candles);
    }
    return candles;
  }, [candles, chartType]);

  // Cập nhật Price Scale Modes (Logarithmic, Percentage, Indexed to 100, Invert Scale, Auto Scale, Scale Chart Only)
  useEffect(() => {
    if (!chartRef.current) return;
    const currentScale = chartRef.current.priceScale(priceScalePosition);

    let mode = PriceScaleMode.Normal;
    if (isLogScale) mode = PriceScaleMode.Logarithmic;
    else if (isPercentageScale) mode = PriceScaleMode.Percentage;
    else if (isIndexedScale) mode = PriceScaleMode.IndexedTo100;

    currentScale.applyOptions({
      mode,
      invertScale: isInvertedScale,
      autoScale: isAutoScale,
      scaleMargins: {
        top: scaleChartOnly ? 0.12 : 0.05,
        bottom: scaleChartOnly ? 0.20 : 0.05
      }
    });
  }, [isLogScale, isPercentageScale, isIndexedScale, isInvertedScale, isAutoScale, priceScalePosition, scaleChartOnly]);

  // Đồng bộ trạng thái AutoScale khi người dùng kéo dãn thước giá bằng chuột
  useEffect(() => {
    const handleMouseUp = () => {
      if (!chartRef.current) return;
      try {
        const currentOptions = chartRef.current.priceScale(priceScalePosition).options();
        if (currentOptions.autoScale !== isAutoScale) {
          setAutoScale(currentOptions.autoScale);
        }
      } catch (err) {}
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [priceScalePosition, isAutoScale, setAutoScale]);

  // Xử lý Reset Price Scale & Tỷ lệ khung hình chuẩn TradingView (Alt + R / Double click)
  const handleResetPriceScale = useCallback(() => {
    if (!chartRef.current) return;
    const pScale = chartRef.current.priceScale(priceScalePosition);
    pScale.applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.12,
        bottom: 0.20
      }
    });

    if (isPriceRatioLocked) {
      togglePriceRatioLocked();
    }

    setAutoScale(true);
  }, [priceScalePosition, setAutoScale, isPriceRatioLocked, togglePriceRatioLocked]);

  // Tính toán tỷ lệ Price-to-Bar thực tế
  const computePriceToBarRatio = useCallback(() => {
    if (!chartRef.current || !mainSeriesRef.current || !chartContainerRef.current) return null;
    const logicalRange = chartRef.current.timeScale().getVisibleLogicalRange();
    if (!logicalRange) return null;
    const barsCount = Math.max(1, logicalRange.to - logicalRange.from);

    const containerHeight = chartContainerRef.current.clientHeight;
    const topPrice = mainSeriesRef.current.coordinateToPrice(0);
    const bottomPrice = mainSeriesRef.current.coordinateToPrice(containerHeight);
    if (topPrice === null || bottomPrice === null) return null;

    const priceDiff = Math.abs(topPrice - bottomPrice);
    if (priceDiff <= 0 || isNaN(priceDiff)) return null;
    return priceDiff / barsCount;
  }, []);

  // Lắng nghe thay đổi vùng nến hiển thị để cập nhật tỷ lệ khung hình
  useEffect(() => {
    if (!chartRef.current) return;
    const handleRangeChange = () => {
      const r = computePriceToBarRatio();
      if (r !== null) setCurrentRatio(r);
    };

    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  }, [computePriceToBarRatio]);

  // Khóa / Mở khóa tỷ lệ giá trên nến (Lock price to bar ratio)
  useEffect(() => {
    if (!mainSeriesRef.current || !chartRef.current) return;

    if (isPriceRatioLocked) {
      const r = computePriceToBarRatio();
      if (r !== null && r > 0) {
        lockedRatioRef.current = r;
        setCurrentRatio(r);
      }

      mainSeriesRef.current.applyOptions({
        autoscaleInfoProvider: (original: () => any) => {
          const base = original();
          if (!base || !base.priceRange || !lockedRatioRef.current || !chartRef.current) return base;

          const logicalRange = chartRef.current.timeScale().getVisibleLogicalRange();
          const barsCount = logicalRange ? Math.max(1, logicalRange.to - logicalRange.from) : 50;
          const targetSpan = barsCount * lockedRatioRef.current;
          const midPrice = (base.priceRange.maxValue + base.priceRange.minValue) / 2;

          return {
            priceRange: {
              minValue: midPrice - targetSpan / 2,
              maxValue: midPrice + targetSpan / 2
            },
            margins: base.margins
          };
        }
      });
    } else {
      lockedRatioRef.current = null;
      mainSeriesRef.current.applyOptions({
        autoscaleInfoProvider: undefined
      });
    }
  }, [isPriceRatioLocked, computePriceToBarRatio]);

  // Tính toán Live Bid, Ask & Pip Value ước tính
  const currentCandle = candles[currentIndex];
  const currentLiveTick = liveTicks[instrument.symbol];
  const currentBid = isLiveActive && currentLiveTick ? currentLiveTick.bid : (currentCandle?.close || 0);
  const spreadValue = isLiveActive && currentLiveTick ? (currentLiveTick.ask - currentLiveTick.bid) : (instrument.defaultSpreadPips * instrument.pipSize);
  const currentAsk = isLiveActive && currentLiveTick ? currentLiveTick.ask : (currentBid + spreadValue);

  // Đồng bộ Series Options (Labels & Lines)
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    mainSeriesRef.current.applyOptions({
      lastValueVisible: scaleLabels.lastPrice,
      priceLineVisible: scaleLines.lastPrice,
      title: scaleLabels.symbolName ? instrument.symbol : ''
    });
  }, [scaleLabels.lastPrice, scaleLabels.symbolName, scaleLines.lastPrice, instrument.symbol]);

  // Đồng bộ Đường giá & Nhãn Bid / Ask
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    const shouldShowBidAsk = scaleLabels.bidAsk || scaleLines.bidAsk;

    if (shouldShowBidAsk && currentBid > 0 && currentAsk > 0) {
      if (!bidLineRef.current) {
        bidLineRef.current = mainSeriesRef.current.createPriceLine({
          price: currentBid,
          color: '#38bdf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: scaleLabels.bidAsk,
          lineVisible: scaleLines.bidAsk,
          title: 'Bid'
        });
      } else {
        bidLineRef.current.applyOptions({
          price: currentBid,
          axisLabelVisible: scaleLabels.bidAsk,
          lineVisible: scaleLines.bidAsk
        });
      }

      if (!askLineRef.current) {
        askLineRef.current = mainSeriesRef.current.createPriceLine({
          price: currentAsk,
          color: '#f97316',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: scaleLabels.bidAsk,
          lineVisible: scaleLines.bidAsk,
          title: 'Ask'
        });
      } else {
        askLineRef.current.applyOptions({
          price: currentAsk,
          axisLabelVisible: scaleLabels.bidAsk,
          lineVisible: scaleLines.bidAsk
        });
      }
    } else {
      if (bidLineRef.current) {
        try { mainSeriesRef.current.removePriceLine(bidLineRef.current); } catch (e) {}
        bidLineRef.current = null;
      }
      if (askLineRef.current) {
        try { mainSeriesRef.current.removePriceLine(askLineRef.current); } catch (e) {}
        askLineRef.current = null;
      }
    }
  }, [scaleLabels.bidAsk, scaleLines.bidAsk, currentBid, currentAsk]);

  // Đồng bộ Đường giá & Nhãn High / Low
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    const shouldShowHighLow = scaleLabels.highLow || scaleLines.highLow;

    if (shouldShowHighLow && effectiveCandles.length > 0 && currentIndex >= 0) {
      const visibleCandles = effectiveCandles.slice(0, currentIndex + 1);
      let sessionHigh = -Infinity;
      let sessionLow = Infinity;
      const startLookback = Math.max(0, visibleCandles.length - 150);
      for (let i = startLookback; i < visibleCandles.length; i++) {
        if (visibleCandles[i].high > sessionHigh) sessionHigh = visibleCandles[i].high;
        if (visibleCandles[i].low < sessionLow) sessionLow = visibleCandles[i].low;
      }

      if (sessionHigh !== -Infinity && sessionLow !== Infinity) {
        if (!highLineRef.current) {
          highLineRef.current = mainSeriesRef.current.createPriceLine({
            price: sessionHigh,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: scaleLabels.highLow,
            lineVisible: scaleLines.highLow,
            title: 'High'
          });
        } else {
          highLineRef.current.applyOptions({
            price: sessionHigh,
            axisLabelVisible: scaleLabels.highLow,
            lineVisible: scaleLines.highLow
          });
        }

        if (!lowLineRef.current) {
          lowLineRef.current = mainSeriesRef.current.createPriceLine({
            price: sessionLow,
            color: '#f43f5e',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: scaleLabels.highLow,
            lineVisible: scaleLines.highLow,
            title: 'Low'
          });
        } else {
          lowLineRef.current.applyOptions({
            price: sessionLow,
            axisLabelVisible: scaleLabels.highLow,
            lineVisible: scaleLines.highLow
          });
        }
      }
    } else {
      if (highLineRef.current) {
        try { mainSeriesRef.current.removePriceLine(highLineRef.current); } catch (e) {}
        highLineRef.current = null;
      }
      if (lowLineRef.current) {
        try { mainSeriesRef.current.removePriceLine(lowLineRef.current); } catch (e) {}
        lowLineRef.current = null;
      }
    }
  }, [scaleLabels.highLow, scaleLines.highLow, effectiveCandles, currentIndex]);

  // Lắng nghe Crosshair & Mousemove để hiển thị nút [+] đặt lệnh nhanh trên thước giá
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const updateCrosshairPrice = (yCoord: number) => {
      if (!mainSeriesRef.current || !chartRef.current) return;
      const price = mainSeriesRef.current.coordinateToPrice(yCoord);
      if (price !== null && !isNaN(price)) {
        setCrosshairPos({
          y: yCoord,
          price: Number(price.toFixed(instrument.digits))
        });
      } else {
        setCrosshairPos(null);
      }
    };

    const handleNativeMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      if (mouseY < 20 || mouseY > rect.height - 35) {
        setCrosshairPos(null);
        return;
      }
      updateCrosshairPrice(mouseY);
    };

    const handleNativeLeave = () => {
      setCrosshairPos(null);
    };

    container.addEventListener('mousemove', handleNativeMove);
    container.addEventListener('mouseleave', handleNativeLeave);

    const handleCrosshairMove = (param: MouseEventParams) => {
      if (param.point) {
        updateCrosshairPrice(param.point.y);
      }
    };

    if (chartRef.current) {
      chartRef.current.subscribeCrosshairMove(handleCrosshairMove);
    }

    return () => {
      container.removeEventListener('mousemove', handleNativeMove);
      container.removeEventListener('mouseleave', handleNativeLeave);
      chartRef.current?.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [instrument.digits]);

  // Lắng nghe trigger Reset Price Scale từ Store
  useEffect(() => {
    if (resetPriceScaleTrigger > 0) {
      handleResetPriceScale();
    }
  }, [resetPriceScaleTrigger, handleResetPriceScale]);

  // Phím tắt toàn cục TradingView (Alt+R, Alt+I, Alt+P, Alt+L, Alt+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleResetPriceScale();
      } else if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        toggleInvertedScale();
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        togglePercentageScale();
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        toggleLogScale();
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        toggleAutoScale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetPriceScale, toggleInvertedScale, togglePercentageScale, toggleLogScale, toggleAutoScale]);

  // Trạng thái hiển thị menu chuột phải trên thước giá
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!chartContainerRef.current || !chartRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) return;

    const pScale = chartRef.current.priceScale(priceScalePosition);
    const scaleWidth = Math.max(50, pScale.width());

    const isOverPriceScale =
      priceScalePosition === 'right'
        ? mouseX >= rect.width - scaleWidth
        : mouseX <= scaleWidth;

    if (isOverPriceScale) {
      e.preventDefault();
      e.stopPropagation();
      const r = computePriceToBarRatio();
      if (r !== null) setCurrentRatio(r);
      setContextMenuPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!chartContainerRef.current || !chartRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) return;

    const pScale = chartRef.current.priceScale(priceScalePosition);
    const scaleWidth = Math.max(50, pScale.width());

    const isOverPriceScale =
      priceScalePosition === 'right'
        ? mouseX >= rect.width - scaleWidth
        : mouseX <= scaleWidth;

    const timeScaleHeight = 28;
    const isOverTimeScale = mouseY >= rect.height - timeScaleHeight;

    if (isOverPriceScale) {
      handleResetPriceScale();
    } else if (isOverTimeScale) {
      try {
        chartRef.current.timeScale().resetTimeScale();
      } catch (err) {}
    }
  };

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

  return (
    <div
      className="relative w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden select-none"
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      {/* 1. ONE-CLICK QUICK TRADING DOCK (TOP-LEFT OVERLAY) */}
      <QuickTradeDock
        currentCandle={currentCandle}
        currentBid={currentBid}
        currentAsk={currentAsk}
        instrument={instrument}
        isLiveActive={isLiveActive}
        activeBroker={activeBroker}
        currentLiveTick={currentLiveTick}
        account={account}
      />

      {/* 2. TOP-RIGHT SMART STACKING CONTAINER (ZERO OVERLAPPING & CLEAR OF PRICE SCALE) */}
      <div className="absolute top-12 sm:top-14 xl:top-3 right-2 sm:right-20 md:right-22 z-20 flex flex-col items-end gap-2 font-mono max-w-[calc(100vw-1rem)] sm:max-w-[320px] pointer-events-none">
        <div className="pointer-events-auto w-full flex flex-col items-end gap-2">
          {/* AI BOT FLOATING HUD */}
          <AIBotHUD />

          {/* PROP FIRM CHALLENGE SHIELD */}
          {isPropFirmMode && (
            <PropFirmHUD
              account={account}
              propFirmDailyLossLimit={propFirmDailyLossLimit}
              propFirmMaxDrawdownLimit={propFirmMaxDrawdownLimit}
              propFirmProfitTarget={propFirmProfitTarget}
              propFirmStartingDayBalance={propFirmStartingDayBalance}
            />
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
      <div
        className={`absolute bottom-6 ${
          priceScalePosition === 'right' ? 'right-16' : 'right-4'
        } z-20 flex items-center gap-1 bg-[#111622]/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-[10px] font-mono shadow-xl`}
      >
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
          onClick={handleResetPriceScale}
          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
            isAutoScale ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={t.resetChartRatioTooltip}
        >
          AUTO
        </button>
      </div>

      {/* Chart Canvas */}
      <div
        ref={chartContainerRef}
        className="w-full h-full relative"
      >
        {/* INTERACTIVE PLUS BUTTON ON PRICE SCALE */}
        {showScalePlusButton && crosshairPos && crosshairPos.y > 25 && (
          <div
            style={{
              top: `${crosshairPos.y}px`,
              [priceScalePosition === 'right' ? 'right' : 'left']: '4px',
              transform: 'translateY(-50%)'
            }}
            className="absolute z-30 pointer-events-auto"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openOrderModalWithPrice(crosshairPos.price);
              }}
              title={`${t.plusButtonScale} @ ${crosshairPos.price}`}
              className="w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg border border-indigo-400/50 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        )}
      </div>

      {/* Visual Chart Trading (Interactive Drag & Drop SL/TP) */}
      <VisualChartTradingOverlay
        chartApi={chartRef.current}
        seriesApi={mainSeriesRef.current}
        containerRef={chartContainerRef}
        instrument={instrument}
      />

      {/* Overlay Drawing Canvas */}
      <DrawingCanvas chart={chartRef.current} series={mainSeriesRef.current} />

      {/* TradingView Price Scale Context Menu */}
      {contextMenuPos && (
        <PriceScaleContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          currentRatio={currentRatio}
          onClose={() => setContextMenuPos(null)}
          onResetPriceScale={handleResetPriceScale}
          onOpenSettings={() => setShortcutsModalOpen(true)}
        />
      )}
    </div>
  );
};
