import { create } from 'zustand';
import { INSTRUMENTS, DEFAULT_INSTRUMENT } from '../config/instruments';
import { EconomicNewsEvent, generateNewsForCandles } from '../config/newsEvents';
import { generateRealisticCandles } from '../config/sampleData';
import { IndicatorCalculator } from '../engine/indicators';
import { OrderMatchingEngine } from '../engine/orderMatchingEngine';
import { TimeframeResampler } from '../engine/resampler';
import { PREBUILT_STRATEGIES, StrategyRunner } from '../engine/strategySandbox';
import { Candle, ChartMarker, DrawingObject, DrawingToolType, InstrumentSpec, Timeframe } from '../types/market';
import { AccountState, EquityPoint, Order, OrderSide, OrderType, Position } from '../types/order';
import { AIStrategyDefinition, StrategyLogMessage } from '../types/strategy';
import { sessionsApi } from '../api/sessions';
import { tradesApi } from '../api/trades';
import { checkServerHealth } from '../api/client';
import { AnalyticsEngine } from '../engine/analytics';
import { soundFx } from '../engine/audioEngine';

interface BacktestStore {
  // Session Persistence
  activeSessionId: string | null;
  isServerOnline: boolean;
  isSessionManagerOpen: boolean;

  // Prop Firm Simulator Mode
  isPropFirmMode: boolean;
  propFirmDailyLossLimit: number;
  propFirmMaxDrawdownLimit: number;
  propFirmProfitTarget: number;
  propFirmStartingDayBalance: number;
  togglePropFirmMode: (enabled?: boolean) => void;
  setPropFirmLimits: (dailyLoss: number, maxDD: number, target: number) => void;

  // Instrument & Data
  instrument: InstrumentSpec;
  timeframe: Timeframe;
  rawM1Candles: Candle[];
  candles: Candle[];
  currentIndex: number;
  economicNews: EconomicNewsEvent[];

  // Replay Controller
  isPlaying: boolean;
  speed: number; // 1 to 100
  replayIntervalId: any;

  // Account & OMS
  account: AccountState;
  pendingOrders: Order[];
  openPositions: Position[];
  closedPositions: Position[];
  equityCurve: EquityPoint[];

  // Drawing Tools
  activeTool: DrawingToolType;
  drawings: DrawingObject[];
  markers: ChartMarker[];

  // AI Strategy
  activeStrategy: AIStrategyDefinition | null;
  autoTradingEnabled: boolean;
  strategyLogs: StrategyLogMessage[];
  llmApiKey: string;
  llmProvider: 'openai' | 'claude' | 'gemini' | 'ollama';

  // Modals & Language
  language: 'vi' | 'en' | 'ja' | 'zh';
  isOrderModalOpen: boolean;
  isAnalyticsModalOpen: boolean;
  isAIModalOpen: boolean;
  isDataModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isProfileModalOpen: boolean;

  // Engine references
  matchingEngine: OrderMatchingEngine;
  strategyRunner: StrategyRunner;
  indicatorCalculator: IndicatorCalculator;

  // Actions
  setInstrument: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  loadCandles: (candles: Candle[]) => void;
  
  // Replay Actions
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (speed: number) => void;
  jumpToIndex: (index: number) => void;
  jumpToDate: (timestamp: number) => void;
  resetSimulation: () => void;

  // Trading Actions
  executeMarketOrder: (side: OrderSide, lotSize: number, sl?: number, tp?: number, trailingStop?: number) => boolean;
  placePendingOrder: (side: OrderSide, type: OrderType, lotSize: number, price: number, sl?: number, tp?: number, trailingStop?: number) => boolean;
  cancelPendingOrder: (orderId: string) => boolean;
  closePosition: (positionId: string) => boolean;
  setBreakeven: (positionId: string) => boolean;
  partialClose: (positionId: string, percent: number) => boolean;
  modifyPositionSLTP: (positionId: string, newSL?: number, newTP?: number) => void;
  updatePositionTags: (positionId: string, tags: string[], note?: string) => void;

  // Drawing Actions
  setActiveTool: (tool: DrawingToolType) => void;
  addDrawing: (drawing: DrawingObject) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;

  // AI Strategy Actions
  setActiveStrategy: (strategy: AIStrategyDefinition | null) => void;
  toggleAutoTrading: (enabled?: boolean) => void;
  addStrategyLog: (type: 'INFO' | 'SIGNAL' | 'ERROR', message: string) => void;
  setLLMSettings: (provider: 'openai' | 'claude' | 'gemini' | 'ollama', apiKey: string) => void;

  // Session Persistence Actions
  initSession: () => Promise<void>;
  loadSessionById: (sessionId: string) => Promise<boolean>;
  createNewSession: (name?: string, symbol?: string, timeframe?: Timeframe, initialBalance?: number) => Promise<string>;
  completeCurrentSession: () => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<boolean>;
  setSessionManagerOpen: (open: boolean) => void;

  // Modal & Lang Toggles
  setLanguage: (lang: 'vi' | 'en' | 'ja' | 'zh') => void;
  setOrderModalOpen: (open: boolean) => void;
  setAnalyticsModalOpen: (open: boolean) => void;
  setAIModalOpen: (open: boolean) => void;
  setDataModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
}

// Helper: Sync current session state to both Local Cache (0ms) and Database API
const syncCurrentSessionToStorage = (get: () => BacktestStore) => {
  const { activeSessionId, isServerOnline, account, currentIndex, openPositions, closedPositions, drawings, equityCurve, instrument, timeframe } = get();

  // 1. Instant local persistence (0ms latency, survives F5 reload immediately)
  try {
    const localSnapshot = {
      activeSessionId,
      symbol: instrument.symbol,
      timeframe,
      currentIndex,
      balance: account.balance,
      equity: account.equity,
      openPositions,
      closedPositions,
      drawings,
      equityCurve,
      savedAt: Date.now()
    };
    localStorage.setItem('quant_active_session_cache', JSON.stringify(localSnapshot));
  } catch (e) {}

  // 2. Instant async database persistence (if online)
  if (activeSessionId && isServerOnline) {
    const allTrades = [
      ...openPositions.map(p => ({ ...p, status: 'OPEN' })),
      ...closedPositions.map(p => ({ ...p, status: 'CLOSED' }))
    ];
    sessionsApi.update(activeSessionId, {
      finalBalance: account.balance,
      finalEquity: account.equity,
      currentIndex,
      symbol: instrument.symbol,
      timeframe
    }).catch(() => {});

    tradesApi.bulkSync(activeSessionId, allTrades).catch(() => {});
  }
};

// Helper: Load cached snapshot on startup
const loadInitialCachedSession = () => {
  try {
    const raw = localStorage.getItem('quant_active_session_cache');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
};

const cachedInit = loadInitialCachedSession();

// Khởi tạo dữ liệu mẫu ban đầu
const initialInstrument = cachedInit?.symbol ? (INSTRUMENTS[cachedInit.symbol] || DEFAULT_INSTRUMENT) : DEFAULT_INSTRUMENT;
const initialM1 = generateRealisticCandles(initialInstrument.symbol, initialInstrument.symbol === 'BTCUSD' ? 68500 : initialInstrument.symbol === 'XAUUSD' ? 2650 : 1.0850, 2500, 5);
const initialNews = generateNewsForCandles(initialM1);
const initialMatchingEngine = new OrderMatchingEngine(cachedInit?.balance || 10000, initialInstrument);
const initialStrategyRunner = new StrategyRunner();
const initialIndicatorCalculator = new IndicatorCalculator();

if (cachedInit) {
  if (cachedInit.openPositions) initialMatchingEngine.openPositions = [...cachedInit.openPositions];
  if (cachedInit.closedPositions) initialMatchingEngine.closedPositions = [...cachedInit.closedPositions];
  if (cachedInit.balance) initialMatchingEngine.balance = cachedInit.balance;
  if (cachedInit.equity) initialMatchingEngine.equity = cachedInit.equity;
}

export const useBacktestStore = create<BacktestStore>((set, get) => {
  // Đăng ký callback cho Matching Engine
  initialMatchingEngine.events = {
    onOrderFilled: (order, pos) => {
      soundFx.playOrderFilled();
      get().addStrategyLog('SIGNAL', `Khớp lệnh ${pos.side} ${pos.lotSize}L @ ${pos.entryPrice}`);
      syncCurrentSessionToStorage(get);
    },
    onPositionClosed: (pos, reason) => {
      if (pos.realizedPnL >= 0) {
        soundFx.playTakeProfit();
      } else {
        soundFx.playStopLoss();
      }
      const pnlStr = pos.realizedPnL >= 0 ? `+$${pos.realizedPnL}` : `-$${Math.abs(pos.realizedPnL)}`;
      get().addStrategyLog('INFO', `Đóng lệnh ${pos.side} (${reason}) @ ${pos.closePrice} | PnL: ${pnlStr}`);
      syncCurrentSessionToStorage(get);
    },
    onLog: (msg) => {
      get().addStrategyLog('INFO', msg);
    }
  };

  // Compile chiến lược mẫu
  initialStrategyRunner.compile(PREBUILT_STRATEGIES[0].code, PREBUILT_STRATEGIES[0].parameters);

  return {
    // Session Persistence
    activeSessionId: cachedInit?.activeSessionId || null,
    isServerOnline: false,
    isSessionManagerOpen: false,

    // Prop Firm Simulator Mode
    isPropFirmMode: true,
    propFirmDailyLossLimit: 5,
    propFirmMaxDrawdownLimit: 10,
    propFirmProfitTarget: 10,
    propFirmStartingDayBalance: cachedInit?.balance || 10000,
    togglePropFirmMode: (enabled) => set(s => ({ isPropFirmMode: enabled !== undefined ? enabled : !s.isPropFirmMode })),
    setPropFirmLimits: (dailyLoss, maxDD, target) => set({ propFirmDailyLossLimit: dailyLoss, propFirmMaxDrawdownLimit: maxDD, propFirmProfitTarget: target }),

    instrument: initialInstrument,
    timeframe: cachedInit?.timeframe || 'M5',
    rawM1Candles: initialM1,
    candles: initialM1,
    currentIndex: cachedInit?.currentIndex || Math.min(200, initialM1.length - 1),
    economicNews: initialNews,

    isPlaying: false,
    speed: 5,
    replayIntervalId: null,

    account: initialMatchingEngine.getAccountState(),
    pendingOrders: [],
    openPositions: cachedInit?.openPositions || [],
    closedPositions: cachedInit?.closedPositions || [],
    equityCurve: cachedInit?.equityCurve || [{ timestamp: initialM1[0]?.timestamp || 0, balance: 10000, equity: 10000 }],

    activeTool: 'cursor',
    drawings: cachedInit?.drawings || [],
    markers: [],

    activeStrategy: PREBUILT_STRATEGIES[0],
    autoTradingEnabled: false,
    strategyLogs: [{ id: 'init', timestamp: Date.now(), type: 'INFO', message: 'Hệ thống Quant Backtest Pro khởi tạo thành công.' }],
    llmApiKey: '',
    llmProvider: 'gemini',

    language: (localStorage.getItem('quant_lang') as any) || 'vi',
    isOrderModalOpen: false,
    isAnalyticsModalOpen: false,
    isAIModalOpen: false,
    isDataModalOpen: false,
    isShortcutsModalOpen: false,
    isProfileModalOpen: false,

    matchingEngine: initialMatchingEngine,
    strategyRunner: initialStrategyRunner,
    indicatorCalculator: initialIndicatorCalculator,

    setInstrument: (symbol) => {
      const spec = INSTRUMENTS[symbol] || DEFAULT_INSTRUMENT;
      get().pause();
      
      let startPrice = 1.0850;
      if (symbol === 'XAUUSD') startPrice = 2650.0;
      if (symbol === 'BTCUSD') startPrice = 68500.0;
      if (symbol === 'USDJPY') startPrice = 155.0;
      if (symbol === 'DXY') startPrice = 104.5;

      const newM1 = generateRealisticCandles(symbol, startPrice, 2500, 5);
      const news = generateNewsForCandles(newM1);
      const resampled = TimeframeResampler.resample(newM1, get().timeframe);
      const engine = get().matchingEngine;
      engine.setConfig(spec);
      engine.reset();

      set({
        instrument: spec,
        rawM1Candles: newM1,
        candles: resampled,
        currentIndex: Math.min(200, resampled.length - 1),
        economicNews: news,
        account: engine.getAccountState(),
        pendingOrders: [],
        openPositions: [],
        closedPositions: [],
        markers: [],
        equityCurve: [{ timestamp: resampled[0]?.timestamp || 0, balance: engine.initialBalance, equity: engine.initialBalance }]
      });
    },

    setTimeframe: (tf) => {
      const { rawM1Candles, currentIndex, candles } = get();
      const currentTimestamp = candles[currentIndex]?.timestamp || 0;
      const resampled = TimeframeResampler.resample(rawM1Candles, tf);
      
      let newIdx = resampled.findIndex(c => c.timestamp >= currentTimestamp);
      if (newIdx === -1) newIdx = Math.min(100, resampled.length - 1);

      set({
        timeframe: tf,
        candles: resampled,
        currentIndex: newIdx
      });
    },

    loadCandles: (newCandles) => {
      get().pause();
      const { timeframe, matchingEngine } = get();
      const resampled = TimeframeResampler.resample(newCandles, timeframe);
      const news = generateNewsForCandles(newCandles);
      matchingEngine.reset();

      set({
        rawM1Candles: newCandles,
        candles: resampled,
        currentIndex: Math.min(150, resampled.length - 1),
        economicNews: news,
        account: matchingEngine.getAccountState(),
        pendingOrders: [],
        openPositions: [],
        closedPositions: [],
        markers: [],
        equityCurve: [{ timestamp: resampled[0]?.timestamp || 0, balance: matchingEngine.initialBalance, equity: matchingEngine.initialBalance }]
      });
    },

    // --- REPLAY CONTROLS ---
    play: () => {
      if (get().isPlaying) return;
      set({ isPlaying: true });

      const intervalMs = Math.max(20, Math.floor(1000 / get().speed));
      const intervalId = setInterval(() => {
        get().stepForward();
      }, intervalMs);

      set({ replayIntervalId: intervalId });
    },

    pause: () => {
      const { replayIntervalId } = get();
      if (replayIntervalId) {
        clearInterval(replayIntervalId);
      }
      set({ isPlaying: false, replayIntervalId: null });
    },

    stepForward: () => {
      const { currentIndex, candles, matchingEngine, strategyRunner, indicatorCalculator, activeStrategy, autoTradingEnabled, instrument } = get();
      
      if (currentIndex >= candles.length - 1) {
        get().pause();
        return;
      }

      const nextIndex = currentIndex + 1;
      const currentCandle = candles[nextIndex];
      const sliceCandles = candles.slice(0, nextIndex + 1);

      // 1. Process Candle in Matching Engine
      matchingEngine.processCandle(currentCandle);

      // 2. Process AI Strategy if auto trading is on
      if (autoTradingEnabled && activeStrategy) {
        indicatorCalculator.setCandles(sliceCandles);
        const lib = indicatorCalculator.createLibrary();
        
        const accountInfo = {
          balance: matchingEngine.balance,
          equity: matchingEngine.equity,
          freeMargin: matchingEngine.freeMargin,
          openPositionsCount: matchingEngine.openPositions.length,
          openPositions: matchingEngine.openPositions
        };

        const api = {
          buy: (params: any) => {
            const spread = instrument.defaultSpreadPips * instrument.pipSize;
            let slPrice = params.stopLossPrice;
            let tpPrice = params.takeProfitPrice;
            if (params.stopLossPips && !slPrice) slPrice = currentCandle.close - (params.stopLossPips * instrument.pipSize);
            if (params.takeProfitPips && !tpPrice) tpPrice = currentCandle.close + (params.takeProfitPips * instrument.pipSize);

            const pos = matchingEngine.executeMarketOrder({
              side: 'BUY',
              lotSize: params.lotSize || 0.1,
              candle: currentCandle,
              stopLoss: slPrice,
              takeProfit: tpPrice,
              trailingStopPips: params.trailingStopPips,
              comment: params.comment || 'AI Buy'
            });

            if (pos) {
              const newMarker: ChartMarker = {
                id: 'marker_' + Date.now(),
                time: currentCandle.timestamp,
                position: 'belowBar',
                color: '#26a69a',
                shape: 'arrowUp',
                text: 'BUY',
                tooltip: params.comment || 'AI Signal Buy'
              };
              set(s => ({ markers: [...s.markers, newMarker] }));
            }
          },
          sell: (params: any) => {
            let slPrice = params.stopLossPrice;
            let tpPrice = params.takeProfitPrice;
            if (params.stopLossPips && !slPrice) slPrice = currentCandle.close + (params.stopLossPips * instrument.pipSize);
            if (params.takeProfitPips && !tpPrice) tpPrice = currentCandle.close - (params.takeProfitPips * instrument.pipSize);

            const pos = matchingEngine.executeMarketOrder({
              side: 'SELL',
              lotSize: params.lotSize || 0.1,
              candle: currentCandle,
              stopLoss: slPrice,
              takeProfit: tpPrice,
              trailingStopPips: params.trailingStopPips,
              comment: params.comment || 'AI Sell'
            });

            if (pos) {
              const newMarker: ChartMarker = {
                id: 'marker_' + Date.now(),
                time: currentCandle.timestamp,
                position: 'aboveBar',
                color: '#ef5350',
                shape: 'arrowDown',
                text: 'SELL',
                tooltip: params.comment || 'AI Signal Sell'
              };
              set(s => ({ markers: [...s.markers, newMarker] }));
            }
          },
          closeAll: () => {
            for (const p of [...matchingEngine.openPositions]) {
              matchingEngine.closePositionManual(p.id, currentCandle);
            }
          },
          closePosition: (id: string) => {
            matchingEngine.closePositionManual(id, currentCandle);
          },
          modifySLTP: (id: string, sl?: number, tp?: number) => {
            const p = matchingEngine.openPositions.find(pos => pos.id === id);
            if (p) {
              if (sl !== undefined) p.stopLoss = sl;
              if (tp !== undefined) p.takeProfit = tp;
            }
          },
          log: (msg: string) => {
            get().addStrategyLog('INFO', msg);
          }
        };

        strategyRunner.executeCandle(currentCandle, lib, accountInfo, api);
      }

      // 3. Update Store State
      const currentAccount = matchingEngine.getAccountState();
      const equityPoint: EquityPoint = {
        timestamp: currentCandle.timestamp,
        balance: currentAccount.balance,
        equity: currentAccount.equity
      };

      set(state => ({
        currentIndex: nextIndex,
        account: currentAccount,
        pendingOrders: [...matchingEngine.pendingOrders],
        openPositions: [...matchingEngine.openPositions],
        closedPositions: [...matchingEngine.closedPositions],
        equityCurve: [...state.equityCurve, equityPoint]
      }));

      // Sync state on position changes or periodically
      if (matchingEngine.openPositions.length > 0 || nextIndex % 25 === 0) {
        syncCurrentSessionToStorage(get);
      }
    },

    stepBackward: () => {
      const { currentIndex } = get();
      if (currentIndex <= 0) return;
      get().jumpToIndex(currentIndex - 1);
    },

    setSpeed: (newSpeed) => {
      const isRunning = get().isPlaying;
      if (isRunning) {
        get().pause();
      }
      set({ speed: newSpeed });
      if (isRunning) {
        get().play();
      }
    },

    jumpToIndex: (targetIndex) => {
      const { candles, matchingEngine } = get();
      if (targetIndex < 0 || targetIndex >= candles.length) return;

      get().pause();
      matchingEngine.reset();

      // Fast forward matching engine up to targetIndex
      for (let i = 0; i <= targetIndex; i++) {
        matchingEngine.processCandle(candles[i]);
      }

      const acc = matchingEngine.getAccountState();
      set({
        currentIndex: targetIndex,
        account: acc,
        pendingOrders: [...matchingEngine.pendingOrders],
        openPositions: [...matchingEngine.openPositions],
        closedPositions: [...matchingEngine.closedPositions],
        equityCurve: [{ timestamp: candles[0]?.timestamp || 0, balance: acc.initialBalance, equity: acc.equity }]
      });
    },

    jumpToDate: (targetTimestamp) => {
      const { candles } = get();
      const idx = candles.findIndex(c => c.timestamp >= targetTimestamp);
      if (idx !== -1) {
        get().jumpToIndex(idx);
      }
    },

    resetSimulation: () => {
      get().pause();
      const { matchingEngine, candles } = get();
      matchingEngine.reset();
      const acc = matchingEngine.getAccountState();

      set({
        currentIndex: Math.min(100, candles.length - 1),
        account: acc,
        pendingOrders: [],
        openPositions: [],
        closedPositions: [],
        markers: [],
        equityCurve: [{ timestamp: candles[0]?.timestamp || 0, balance: acc.initialBalance, equity: acc.initialBalance }]
      });
    },

    // --- TRADING ACTIONS ---
    executeMarketOrder: (side, lotSize, sl, tp, trailingStop) => {
      const { matchingEngine, candles, currentIndex } = get();
      const currentCandle = candles[currentIndex];
      if (!currentCandle) return false;

      const pos = matchingEngine.executeMarketOrder({
        side,
        lotSize,
        candle: currentCandle,
        stopLoss: sl,
        takeProfit: tp,
        trailingStopPips: trailingStop,
        comment: 'Manual Entry'
      });

      if (pos) {
        const marker: ChartMarker = {
          id: 'manual_' + Date.now(),
          time: currentCandle.timestamp,
          position: side === 'BUY' ? 'belowBar' : 'aboveBar',
          color: side === 'BUY' ? '#26a69a' : '#ef5350',
          shape: side === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: side,
          tooltip: `Manual ${side} ${lotSize}L @ ${pos.entryPrice}`
        };

        set({
          account: matchingEngine.getAccountState(),
          openPositions: [...matchingEngine.openPositions],
          markers: [...get().markers, marker]
        });
        syncCurrentSessionToStorage(get);
        return true;
      }
      return false;
    },

    placePendingOrder: (side, type, lotSize, price, sl, tp, trailingStop) => {
      const { matchingEngine } = get();
      matchingEngine.placePendingOrder({
        side,
        type,
        lotSize,
        price,
        stopLoss: sl,
        takeProfit: tp,
        trailingStopPips: trailingStop,
        comment: 'Manual Pending'
      });

      set({
        pendingOrders: [...matchingEngine.pendingOrders]
      });
      syncCurrentSessionToStorage(get);
      return true;
    },

    cancelPendingOrder: (orderId) => {
      const { matchingEngine } = get();
      const res = matchingEngine.cancelPendingOrder(orderId);
      if (res) {
        set({ pendingOrders: [...matchingEngine.pendingOrders] });
        syncCurrentSessionToStorage(get);
      }
      return res;
    },

    closePosition: (positionId) => {
      const { matchingEngine, candles, currentIndex } = get();
      const currentCandle = candles[currentIndex];
      if (!currentCandle) return false;

      const res = matchingEngine.closePositionManual(positionId, currentCandle);
      if (res) {
        set({
          account: matchingEngine.getAccountState(),
          openPositions: [...matchingEngine.openPositions],
          closedPositions: [...matchingEngine.closedPositions]
        });
        syncCurrentSessionToStorage(get);
      }
      return res;
    },

    setBreakeven: (positionId) => {
      const { matchingEngine } = get();
      const res = matchingEngine.setBreakeven(positionId);
      if (res) {
        set({ openPositions: [...matchingEngine.openPositions] });
        syncCurrentSessionToStorage(get);
      }
      return res;
    },

    partialClose: (positionId, percent) => {
      const { matchingEngine, candles, currentIndex } = get();
      const currentCandle = candles[currentIndex];
      if (!currentCandle) return false;

      const res = matchingEngine.partialClosePosition(positionId, percent, currentCandle);
      if (res) {
        set({
          account: matchingEngine.getAccountState(),
          openPositions: [...matchingEngine.openPositions],
          closedPositions: [...matchingEngine.closedPositions]
        });
        syncCurrentSessionToStorage(get);
      }
      return res;
    },

    modifyPositionSLTP: (positionId, newSL, newTP) => {
      const { matchingEngine } = get();
      const pos = matchingEngine.openPositions.find(p => p.id === positionId);
      if (pos) {
        if (newSL !== undefined) pos.stopLoss = newSL;
        if (newTP !== undefined) pos.takeProfit = newTP;
        set({ openPositions: [...matchingEngine.openPositions] });
        syncCurrentSessionToStorage(get);
      }
    },

    updatePositionTags: (positionId, tags, note) => {
      const { matchingEngine, closedPositions } = get();
      // Update in openPositions if present
      const pos = matchingEngine.openPositions.find(p => p.id === positionId);
      if (pos) {
        pos.tags = tags;
        if (note !== undefined) pos.note = note;
      }
      // Update in closedPositions
      const closed = closedPositions.find(p => p.id === positionId);
      if (closed) {
        closed.tags = tags;
        if (note !== undefined) closed.note = note;
      }
      set({
        openPositions: [...matchingEngine.openPositions],
        closedPositions: [...closedPositions]
      });
      syncCurrentSessionToStorage(get);
    },

    // --- DRAWING ACTIONS ---
    setActiveTool: (tool) => set({ activeTool: tool }),
    addDrawing: (drawing) => {
      set(s => ({ drawings: [...s.drawings, drawing] }));
      syncCurrentSessionToStorage(get);
    },
    removeDrawing: (id) => {
      set(s => ({ drawings: s.drawings.filter(d => d.id !== id) }));
      syncCurrentSessionToStorage(get);
    },
    clearDrawings: () => {
      set({ drawings: [] });
      syncCurrentSessionToStorage(get);
    },

    // --- AI STRATEGY ACTIONS ---
    setActiveStrategy: (strat) => {
      if (strat) {
        const res = get().strategyRunner.compile(strat.code, strat.parameters);
        if (res.success) {
          get().addStrategyLog('INFO', `Đã nạp & biên dịch thành công: "${strat.name}"`);
        } else {
          get().addStrategyLog('ERROR', `Lỗi biên dịch chiến lược: ${res.error}`);
        }
      }
      set({ activeStrategy: strat });
    },

    toggleAutoTrading: (enabled) => {
      const next = enabled !== undefined ? enabled : !get().autoTradingEnabled;
      set({ autoTradingEnabled: next });
      get().addStrategyLog('INFO', `Tự động giao dịch AI: ${next ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}`);
    },

    addStrategyLog: (type, message) => {
      const newLog: StrategyLogMessage = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type,
        message
      };
      set(s => ({ strategyLogs: [newLog, ...s.strategyLogs.slice(0, 150)] }));
    },

    setLLMSettings: (provider, apiKey) => {
      set({ llmProvider: provider, llmApiKey: apiKey });
    },

    // --- SESSION PERSISTENCE ---
    initSession: async () => {
      try {
        const online = await checkServerHealth();
        set({ isServerOnline: online });
        if (!online) {
          get().addStrategyLog('INFO', 'Server offline — chế độ cục bộ, dữ liệu không được lưu tự động');
          return;
        }

        // Check for active session
        const sessions = await sessionsApi.list('ACTIVE');
        if (sessions.length > 0) {
          // Resume last active session with full trade/state restoration
          const lastSession = sessions[0];
          await get().loadSessionById(lastSession.id);
          get().addStrategyLog('INFO', `Đã kết nối server — Đã khôi phục phiên: "${lastSession.name}"`);
        } else {
          // Create a new session
          const { instrument, timeframe, account } = get();
          const newSession = await sessionsApi.create({
            symbol: instrument.symbol,
            timeframe,
            initialBalance: account.initialBalance
          });
          set({ activeSessionId: newSession.id });
          get().addStrategyLog('INFO', `Đã tạo phiên mới — ID: ${newSession.id}`);
        }
      } catch (err: any) {
        console.warn('[Session Init Error]', err);
        set({ isServerOnline: false });
      }
    },

    loadSessionById: async (sessionId: string) => {
      try {
        get().pause();
        const session = await sessionsApi.get(sessionId);
        if (!session) return false;

        const spec = INSTRUMENTS[session.symbol] || DEFAULT_INSTRUMENT;
        const tf = (session.timeframe as Timeframe) || 'M5';

        // Load candles for the symbol
        let rawM1 = get().rawM1Candles;
        if (get().instrument.symbol !== session.symbol || rawM1.length === 0) {
          let startPrice = 1.0850;
          if (session.symbol === 'XAUUSD') startPrice = 2650.0;
          if (session.symbol === 'BTCUSD') startPrice = 68500.0;
          if (session.symbol === 'USDJPY') startPrice = 155.0;
          if (session.symbol === 'DXY') startPrice = 104.5;
          rawM1 = generateRealisticCandles(session.symbol, startPrice, 2500, 5);
        }

        const resampled = TimeframeResampler.resample(rawM1, tf);
        const news = generateNewsForCandles(rawM1);

        // Parse open positions
        const openPositions: Position[] = (session.trades || [])
          .filter((t: any) => t.status === 'OPEN')
          .map((t: any) => ({
            id: t.id,
            orderId: t.orderId || t.id,
            symbol: t.symbol,
            side: t.side,
            lotSize: t.lotSize,
            entryPrice: t.entryPrice,
            stopLoss: t.stopLoss,
            takeProfit: t.takeProfit,
            trailingStopPips: t.trailingStopPips,
            highestPriceSinceOpen: t.entryPrice,
            lowestPriceSinceOpen: t.entryPrice,
            commission: t.commission || 0,
            swap: t.swap || 0,
            openTime: Number(t.openTime),
            floatingPnL: t.floatingPnL || 0,
            realizedPnL: 0,
            status: 'OPEN',
            comment: t.comment,
            tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
            note: t.note
          }));

        // Parse closed positions
        const closedPositions: Position[] = (session.trades || [])
          .filter((t: any) => t.status === 'CLOSED')
          .map((t: any) => ({
            id: t.id,
            orderId: t.orderId || t.id,
            symbol: t.symbol,
            side: t.side,
            lotSize: t.lotSize,
            entryPrice: t.entryPrice,
            closePrice: t.closePrice,
            stopLoss: t.stopLoss,
            takeProfit: t.takeProfit,
            trailingStopPips: t.trailingStopPips,
            highestPriceSinceOpen: t.entryPrice,
            lowestPriceSinceOpen: t.entryPrice,
            commission: t.commission || 0,
            swap: t.swap || 0,
            openTime: Number(t.openTime),
            closeTime: t.closeTime ? Number(t.closeTime) : undefined,
            floatingPnL: 0,
            realizedPnL: t.realizedPnL || 0,
            status: 'CLOSED',
            closeReason: t.closeReason,
            comment: t.comment,
            tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
            note: t.note
          }));

        // Drawings
        const drawings: DrawingObject[] = (session.drawings || []).map((d: any) => ({
          id: d.id,
          type: d.type,
          points: typeof d.points === 'string' ? JSON.parse(d.points) : d.points,
          color: d.color,
          lineWidth: d.lineWidth,
          text: d.text
        }));

        // Equity Curve
        const equityCurve: EquityPoint[] = (session.equityPoints && session.equityPoints.length > 0)
          ? session.equityPoints.map((ep: any) => ({
              timestamp: Number(ep.timestamp),
              balance: ep.balance,
              equity: ep.equity
            }))
          : [{ timestamp: resampled[0]?.timestamp || 0, balance: session.initialBalance, equity: session.initialBalance }];

        // Rebuild chart markers from trades
        const markers: ChartMarker[] = [
          ...openPositions.map(p => ({
            id: 'marker_' + p.id,
            time: p.openTime,
            position: (p.side === 'BUY' ? 'belowBar' : 'aboveBar') as 'belowBar' | 'aboveBar',
            color: p.side === 'BUY' ? '#26a69a' : '#ef5350',
            shape: (p.side === 'BUY' ? 'arrowUp' : 'arrowDown') as 'arrowUp' | 'arrowDown',
            text: p.side,
            tooltip: `${p.side} ${p.lotSize}L @ ${p.entryPrice}`
          })),
          ...closedPositions.map(p => ({
            id: 'marker_' + p.id,
            time: p.openTime,
            position: (p.side === 'BUY' ? 'belowBar' : 'aboveBar') as 'belowBar' | 'aboveBar',
            color: p.side === 'BUY' ? '#26a69a' : '#ef5350',
            shape: (p.side === 'BUY' ? 'arrowUp' : 'arrowDown') as 'arrowUp' | 'arrowDown',
            text: p.side,
            tooltip: `${p.side} ${p.lotSize}L (Đã đóng PnL: $${p.realizedPnL})`
          }))
        ];

        // Setup matching engine state
        const engine = get().matchingEngine;
        engine.setConfig(spec);
        engine.reset(session.initialBalance);
        engine.balance = session.finalBalance;
        engine.equity = session.finalEquity;
        engine.openPositions = [...openPositions];
        engine.closedPositions = [...closedPositions];

        set({
          activeSessionId: session.id,
          instrument: spec,
          timeframe: tf,
          rawM1Candles: rawM1,
          candles: resampled,
          currentIndex: Math.min(session.currentIndex ?? 100, resampled.length - 1),
          economicNews: news,
          account: engine.getAccountState(),
          pendingOrders: [],
          openPositions,
          closedPositions,
          drawings,
          markers,
          equityCurve
        });

        get().addStrategyLog('INFO', `Đã tải phiên "${session.name}" — ${openPositions.length} vị thế mở, ${closedPositions.length} vị thế đã đóng`);
        return true;
      } catch (err: any) {
        console.error('[Load Session Error]', err);
        return false;
      }
    },

    createNewSession: async (name, symbol, timeframe, initialBalance) => {
      try {
        const targetSymbol = symbol || get().instrument.symbol;
        const targetTf = timeframe || get().timeframe;
        const targetBalance = initialBalance || 10000;
        const spec = INSTRUMENTS[targetSymbol] || DEFAULT_INSTRUMENT;

        const sessionName = name || `${targetSymbol} ${targetTf} - ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

        const newSession = await sessionsApi.create({
          name: sessionName,
          symbol: targetSymbol,
          timeframe: targetTf,
          initialBalance: targetBalance
        });

        // Initialize simulation for the new session
        let startPrice = 1.0850;
        if (targetSymbol === 'XAUUSD') startPrice = 2650.0;
        if (targetSymbol === 'BTCUSD') startPrice = 68500.0;
        if (targetSymbol === 'USDJPY') startPrice = 155.0;
        if (targetSymbol === 'DXY') startPrice = 104.5;

        const newM1 = generateRealisticCandles(targetSymbol, startPrice, 2500, 5);
        const resampled = TimeframeResampler.resample(newM1, targetTf);
        const news = generateNewsForCandles(newM1);

        const engine = get().matchingEngine;
        engine.setConfig(spec);
        engine.reset(targetBalance);

        set({
          activeSessionId: newSession.id,
          instrument: spec,
          timeframe: targetTf,
          rawM1Candles: newM1,
          candles: resampled,
          currentIndex: Math.min(100, resampled.length - 1),
          economicNews: news,
          account: engine.getAccountState(),
          pendingOrders: [],
          openPositions: [],
          closedPositions: [],
          drawings: [],
          markers: [],
          equityCurve: [{ timestamp: resampled[0]?.timestamp || 0, balance: targetBalance, equity: targetBalance }]
        });

        get().addStrategyLog('INFO', `Đã tạo phiên mới: "${sessionName}" với vốn ban đầu $${targetBalance.toLocaleString()}`);
        return newSession.id;
      } catch (err: any) {
        console.error('[Create Session Error]', err);
        throw err;
      }
    },

    completeCurrentSession: async () => {
      const { activeSessionId, account, closedPositions } = get();
      if (!activeSessionId) return;

      try {
        const report = AnalyticsEngine.calculateReport(account.initialBalance, closedPositions);
        const heatmap = AnalyticsEngine.calculateHeatmap(closedPositions);
        const monteCarlo = AnalyticsEngine.runMonteCarlo(account.initialBalance, closedPositions, 500);

        await sessionsApi.complete(activeSessionId, {
          finalBalance: account.balance,
          finalEquity: account.equity,
          analyticsSnapshot: {
            totalTrades: report.totalTrades,
            winTrades: report.winTrades,
            lossTrades: report.lossTrades,
            winRate: report.winRate,
            grossProfit: report.grossProfit,
            grossLoss: report.grossLoss,
            netProfit: report.netProfit,
            profitFactor: report.profitFactor,
            expectedPayoff: report.expectedPayoff,
            maxDrawdownAmount: report.maxDrawdownAmount,
            maxDrawdownPercent: report.maxDrawdownPercent,
            avgWin: report.avgWin,
            avgLoss: report.avgLoss,
            riskRewardRatio: report.riskRewardRatio,
            consecutiveWins: report.consecutiveWins,
            consecutiveLosses: report.consecutiveLosses,
            sharpeRatio: report.sharpeRatio,
            sortinoRatio: report.sortinoRatio,
            heatmapData: JSON.stringify(heatmap),
            monteCarloData: JSON.stringify(monteCarlo)
          }
        });

        get().addStrategyLog('INFO', `Phiên #${activeSessionId.substring(0, 8)} đã được lưu trữ hoàn thành (Net PnL: $${report.netProfit})`);
      } catch (err: any) {
        console.error('[Complete Session Error]', err);
      }
    },

    deleteSessionById: async (sessionId: string) => {
      try {
        await sessionsApi.delete(sessionId);
        get().addStrategyLog('INFO', `Đã xóa phiên #${sessionId.substring(0, 8)} khỏi cơ sở dữ liệu`);

        // If active session was deleted, create a new one
        if (get().activeSessionId === sessionId) {
          await get().createNewSession();
        }
        return true;
      } catch (err: any) {
        console.error('[Delete Session Error]', err);
        return false;
      }
    },

    setSessionManagerOpen: (open) => set({ isSessionManagerOpen: open }),

    // --- MODAL & LANG TOGGLES ---
    setLanguage: (lang) => {
      localStorage.setItem('quant_lang', lang);
      set({ language: lang });
    },
    setOrderModalOpen: (open) => set({ isOrderModalOpen: open }),
    setAnalyticsModalOpen: (open) => set({ isAnalyticsModalOpen: open }),
    setAIModalOpen: (open) => set({ isAIModalOpen: open }),
    setDataModalOpen: (open) => set({ isDataModalOpen: open }),
    setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),
    setProfileModalOpen: (open) => set({ isProfileModalOpen: open })
  };
});
