import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BrokerAccount,
  BrokerCandle,
  BrokerConfig,
  BrokerConnectionStatus,
  BrokerDeal,
  BrokerOrder,
  BrokerPosition,
  BrokerSymbolDetail,
  BrokerType,
  LiveTickUpdate,
  PositionMode,
  UnifiedOrderRequest
} from '../types/broker';
import { brokerApi } from '../api/broker';
import { soundFx } from '../engine/audioEngine';
import { useBacktestStore } from './backtestStore';
import { INSTRUMENTS } from '../config/instruments';
import { Timeframe } from '../types/market';

interface BrokerStore {
  // Mode & Connection State
  isLiveTradingMode: boolean;
  activeBroker: BrokerType;
  connectionStatus: BrokerConnectionStatus;
  statusMessage: string;
  pingLatency: number;
  isBrokerModalOpen: boolean;
  isMarketWatchOpen: boolean;
  
  // Credentials & Config
  config: BrokerConfig;

  // Real-time Data
  account: BrokerAccount | null;
  positions: BrokerPosition[];
  orders: BrokerOrder[];
  deals: BrokerDeal[];
  brokerSymbols: BrokerSymbolDetail[];
  liveTicks: Record<string, LiveTickUpdate>;

  // Sync Timer & WebSocket
  syncIntervalId: any;
  socket: WebSocket | null;

  // Actions
  setLiveTradingMode: (enabled: boolean) => void;
  setBrokerModalOpen: (open: boolean) => void;
  setMarketWatchOpen: (open: boolean) => void;
  updateConfig: (partial: Partial<BrokerConfig>) => void;
  
  connectBroker: (overrideConfig?: Partial<BrokerConfig>) => Promise<boolean>;
  disconnectBroker: () => Promise<void>;
  syncBrokerData: () => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;

  fetchBrokerSymbols: () => Promise<BrokerSymbolDetail[]>;
  fetchAndApplyBrokerCandles: (symbol: string, timeframe: Timeframe) => Promise<void>;

  // Order Execution Actions
  executeLiveMarketOrder: (
    symbol: string,
    side: 'BUY' | 'SELL',
    lotSize: number,
    sl?: number,
    tp?: number,
    comment?: string,
    deviation?: number
  ) => Promise<{ success: boolean; ticket?: number | string; message?: string }>;

  placeLivePendingOrder: (
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'LIMIT' | 'STOP',
    lotSize: number,
    price: number,
    sl?: number,
    tp?: number,
    comment?: string
  ) => Promise<{ success: boolean; ticket?: number | string; message?: string }>;

  modifyLiveSLTP: (
    ticket: string | number,
    sl?: number,
    tp?: number,
    price?: number
  ) => Promise<{ success: boolean; message?: string }>;

  closeLivePosition: (
    ticket: string | number,
    lotSize?: number
  ) => Promise<{ success: boolean; message?: string }>;

  closeAllLivePositions: (symbolFilter?: string) => Promise<{ success: boolean; count: number }>;

  setLiveBreakeven: (
    ticket: string | number,
    spreadPips?: number
  ) => Promise<{ success: boolean; message?: string }>;

  partialCloseLive: (
    ticket: string | number,
    percent: number
  ) => Promise<{ success: boolean; message?: string }>;

  cancelLiveOrder: (ticket: string | number) => Promise<{ success: boolean; message?: string }>;
}

const DEFAULT_CONFIG: BrokerConfig = {
  brokerType: 'MT5_EXNESS',
  gatewayUrl: 'http://127.0.0.1:8765',
  account: '84920184',
  password: '',
  server: 'Exness-MT5Real',
  autoReconnect: true,
  positionMode: 'HEDGING',
  maxSlippagePips: 20
};

function normalizeBrokerPosition(p: any): BrokerPosition {
  const sideStr = p.side || (p.type === 0 || p.type === 'BUY' ? 'BUY' : 'SELL');
  return {
    ticket: p.ticket,
    symbol: p.symbol,
    side: sideStr,
    type: typeof p.type === 'number' ? p.type : (sideStr === 'BUY' ? 0 : 1),
    lotSize: p.volume ?? p.lotSize ?? 0.1,
    openPrice: p.price_open ?? p.openPrice ?? 0,
    currentPrice: p.price_current ?? p.currentPrice ?? p.price_open ?? 0,
    sl: p.sl && p.sl > 0 ? p.sl : undefined,
    tp: p.tp && p.tp > 0 ? p.tp : undefined,
    floatingPnL: p.profit ?? p.floatingPnL ?? 0,
    swap: p.swap ?? 0,
    commission: p.commission ?? 0,
    openTime: p.time ?? p.openTime ?? Math.floor(Date.now() / 1000),
    magic: p.magic,
    comment: p.comment
  };
}

function normalizeBrokerOrder(o: any): BrokerOrder {
  let typeStr: BrokerOrder['type'] = 'BUY_LIMIT';
  if (typeof o.type === 'string') {
    typeStr = o.type as any;
  } else {
    if (o.type === 2) typeStr = 'BUY_LIMIT';
    else if (o.type === 3) typeStr = 'SELL_LIMIT';
    else if (o.type === 4) typeStr = 'BUY_STOP';
    else if (o.type === 5) typeStr = 'SELL_STOP';
    else if (o.type === 0) typeStr = 'BUY_LIMIT';
    else if (o.type === 1) typeStr = 'SELL_LIMIT';
  }
  const sideStr = o.side || (typeStr.startsWith('BUY') ? 'BUY' : 'SELL');
  return {
    ticket: o.ticket,
    symbol: o.symbol,
    side: sideStr,
    type: typeStr,
    lotSize: o.volume_initial ?? o.volume ?? o.lotSize ?? 0.1,
    triggerPrice: o.price_open ?? o.triggerPrice ?? 0,
    currentPrice: o.price_current ?? o.currentPrice ?? o.price_open ?? 0,
    sl: o.sl && o.sl > 0 ? o.sl : undefined,
    tp: o.tp && o.tp > 0 ? o.tp : undefined,
    openTime: o.time_setup ?? o.openTime ?? Math.floor(Date.now() / 1000),
    comment: o.comment,
    magic: o.magic
  };
}

export function sanitizeBrokerStorageConfig(state: BrokerStore) {
  return {
    activeBroker: state.activeBroker,
    config: {
      ...state.config,
      password: '' // SECURITY: Never persist plain master password in browser localStorage
    }
  };
}

export const useBrokerStore = create<BrokerStore>()(
  persist(
    (set, get) => ({
      isLiveTradingMode: false,
      activeBroker: 'MT5_EXNESS',
      connectionStatus: 'DISCONNECTED',
      statusMessage: '',
      pingLatency: -1,
      isBrokerModalOpen: false,
      isMarketWatchOpen: false,

      config: DEFAULT_CONFIG,

      account: null,
      positions: [],
      orders: [],
      deals: [],
      brokerSymbols: [],
      liveTicks: {},
      syncIntervalId: null,
      socket: null,

      setLiveTradingMode: async (enabled: boolean) => {
        set({ isLiveTradingMode: enabled });
        if (enabled) {
          if (get().connectionStatus !== 'CONNECTED') {
            await get().connectBroker();
          }
          // Automatically load live candles for current active symbol
          const curSym = useBacktestStore.getState().instrument.symbol;
          const curTf = useBacktestStore.getState().timeframe;
          await get().fetchAndApplyBrokerCandles(curSym, curTf);
        }
      },

      setBrokerModalOpen: (open: boolean) => {
        set({ isBrokerModalOpen: open });
      },

      setMarketWatchOpen: (open: boolean) => {
        set({ isMarketWatchOpen: open });
      },

      updateConfig: (partial: Partial<BrokerConfig>) => {
        set((state) => ({
          config: { ...state.config, ...partial }
        }));
      },

      fetchBrokerSymbols: async () => {
        const { config } = get();
        const symbols = await brokerApi.getAllSymbols(config.gatewayUrl);
        if (symbols && symbols.length > 0) {
          set({ brokerSymbols: symbols });
        }
        return symbols;
      },

      fetchAndApplyBrokerCandles: async (symbol: string, timeframe: Timeframe) => {
        const { config, isLiveTradingMode } = get();
        try {
          const candles = await brokerApi.getCandles(symbol, timeframe, 500, config.gatewayUrl);
          if (candles && candles.length > 0) {
            useBacktestStore.getState().loadCandles(candles, candles.length - 1, symbol, timeframe);
          }
        } catch (e) {
          console.error('Failed to fetch broker candles:', e);
        }
      },

      connectBroker: async (overrideConfig) => {
        const currentConfig = { ...get().config, ...overrideConfig };
        set({
          connectionStatus: 'CONNECTING',
          statusMessage: `Connecting to ${currentConfig.brokerType} (${currentConfig.gatewayUrl})...`,
          config: currentConfig
        });

        try {
          const health = await brokerApi.checkHealth(currentConfig.gatewayUrl);
          if (health.status !== 'online') {
            set({
              connectionStatus: 'ERROR',
              statusMessage: 'Gateway offline. Please run start_gateway.bat in mt5_gateway folder.',
              pingLatency: -1
            });
            return false;
          }

          const res = await brokerApi.connect(currentConfig);
          if (res.success && res.account) {
            set({
              connectionStatus: 'CONNECTED',
              statusMessage: `Connected to ${res.account.server} #${res.account.login}`,
              account: res.account,
              activeBroker: currentConfig.brokerType,
              pingLatency: health.pingMs
            });

            // Play connect sound
            try { soundFx.playOrderFilled(); } catch {}

            // Initial fetch symbols, candles and start auto-sync
            await get().fetchBrokerSymbols();
            await get().syncBrokerData();
            get().startAutoSync();

            if (get().isLiveTradingMode) {
              const curSym = useBacktestStore.getState().instrument.symbol;
              const curTf = useBacktestStore.getState().timeframe;
              await get().fetchAndApplyBrokerCandles(curSym, curTf);
            }

            return true;
          } else {
            set({
              connectionStatus: 'ERROR',
              statusMessage: res.message || 'Connection failed'
            });
            return false;
          }
        } catch (err: any) {
          set({
            connectionStatus: 'ERROR',
            statusMessage: err.message || 'Connection error'
          });
          return false;
        }
      },

      disconnectBroker: async () => {
        get().stopAutoSync();
        await brokerApi.disconnect(get().config.gatewayUrl);
        set({
          isLiveTradingMode: false,
          connectionStatus: 'DISCONNECTED',
          statusMessage: 'Disconnected',
          account: null,
          positions: [],
          orders: [],
          pingLatency: -1
        });
      },

      syncBrokerData: async () => {
        const { config, connectionStatus } = get();
        if (connectionStatus !== 'CONNECTED') return;

        const url = config.gatewayUrl;
        const [acc, pos, ord, deals] = await Promise.all([
          brokerApi.getAccount(url),
          brokerApi.getPositions(url),
          brokerApi.getOrders(url),
          brokerApi.getHistory(url)
        ]);

        if (acc) {
          set({
            account: acc,
            positions: pos,
            orders: ord,
            deals: deals
          });
        }
      },

      startAutoSync: () => {
        get().stopAutoSync();
        
        // 1. Polling fallback (1000ms)
        const id = setInterval(() => {
          get().syncBrokerData();
        }, 1000);
        set({ syncIntervalId: id });

        // 2. WebSocket Real-time Tick & Snapshot Stream
        try {
          const { config } = get();
          const wsUrl = config.gatewayUrl.replace(/^http/, 'ws') + '/ws';
          const ws = new WebSocket(wsUrl);

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'SNAPSHOT') {
                if (data.account) set({ account: data.account });
                if (data.positions && Array.isArray(data.positions)) {
                  set({ positions: data.positions.map(normalizeBrokerPosition) });
                }
                if (data.orders && Array.isArray(data.orders)) {
                  set({ orders: data.orders.map(normalizeBrokerOrder) });
                }
                if (data.ticks) {
                  set((state) => ({ liveTicks: { ...state.liveTicks, ...data.ticks } }));
                  
                  // If live trading is active, stream the tick to update the current candle
                  if (get().isLiveTradingMode) {
                    const activeSym = useBacktestStore.getState().instrument.symbol;
                    const activeTick = data.ticks[activeSym];
                    if (activeTick) {
                      useBacktestStore.getState().updateLiveCandle(activeTick);
                    }
                  }
                }
              }
            } catch (e) {}
          };

          ws.onerror = () => {
            // silent fallback to polling
          };

          set({ socket: ws });
        } catch {}
      },

      stopAutoSync: () => {
        const { syncIntervalId, socket } = get();
        if (syncIntervalId) {
          clearInterval(syncIntervalId);
        }
        if (socket) {
          try { socket.close(); } catch {}
        }
        set({ syncIntervalId: null, socket: null });
      },

      // Execution methods
      executeLiveMarketOrder: async (symbol, side, lotSize, sl, tp, comment, deviation) => {
        const { config, syncBrokerData } = get();
        const req: UnifiedOrderRequest = {
          symbol,
          side,
          type: 'MARKET',
          lotSize,
          sl,
          tp,
          comment: comment || 'QuantPro Live',
          deviation: deviation || config.maxSlippagePips || 20
        };

        const res = await brokerApi.sendOrder(req, config.gatewayUrl);
        if (res.success) {
          try { soundFx.playOrderFilled(); } catch {}
          await syncBrokerData();
        }
        return res;
      },

      placeLivePendingOrder: async (symbol, side, type, lotSize, price, sl, tp, comment) => {
        const { config, syncBrokerData } = get();
        const req: UnifiedOrderRequest = {
          symbol,
          side,
          type,
          lotSize,
          price,
          sl,
          tp,
          comment: comment || 'QuantPro Pending'
        };

        const res = await brokerApi.sendOrder(req, config.gatewayUrl);
        if (res.success) {
          try { soundFx.playOrderFilled(); } catch {}
          await syncBrokerData();
        }
        return res;
      },

      modifyLiveSLTP: async (ticket, sl, tp, price) => {
        const { config, syncBrokerData } = get();
        const res = await brokerApi.modifyOrder({ ticket, sl, tp, price }, config.gatewayUrl);
        if (res.success) {
          try { soundFx.playOrderFilled(); } catch {}
          await syncBrokerData();
        }
        return res;
      },

      closeLivePosition: async (ticket, lotSize) => {
        const { config, syncBrokerData } = get();
        const res = await brokerApi.closePosition({ ticket, lotSize }, config.gatewayUrl);
        if (res.success) {
          try { soundFx.playOrderFilled(); } catch {}
          await syncBrokerData();
        }
        return res;
      },

      closeAllLivePositions: async (symbolFilter) => {
        const { config, positions, syncBrokerData } = get();
        const targets = symbolFilter
          ? positions.filter((p) => p.symbol === symbolFilter)
          : positions;

        const res = await brokerApi.closeAllPositions(targets, config.gatewayUrl);
        if (res.count > 0) {
          try { soundFx.playOrderFilled(); } catch {}
          await syncBrokerData();
        }
        return res;
      },

      setLiveBreakeven: async (ticket, spreadPips = 2) => {
        const { positions, modifyLiveSLTP } = get();
        const pos = positions.find((p) => String(p.ticket) === String(ticket));
        if (!pos) return { success: false, message: 'Position not found' };

        // For Forex 5-digits, 1 pip = 0.0001; for Gold 2-digits, 1 pip = 0.1
        const digits = pos.symbol.includes('JPY') ? 3 : pos.symbol.includes('XAU') ? 2 : 5;
        const pipSize = Math.pow(10, -digits) * (digits === 5 || digits === 3 ? 10 : 1);
        
        const offset = (spreadPips || 2) * pipSize;
        const beSL = pos.side === 'BUY' ? pos.openPrice + offset : pos.openPrice - offset;

        return await modifyLiveSLTP(ticket, Number(beSL.toFixed(digits)), pos.tp);
      },

      partialCloseLive: async (ticket, percent) => {
        const { positions, closeLivePosition } = get();
        const pos = positions.find((p) => String(p.ticket) === String(ticket));
        if (!pos) return { success: false, message: 'Position not found' };

        const closeLot = Math.max(0.01, Number((pos.lotSize * (percent / 100)).toFixed(2)));
        return await closeLivePosition(ticket, closeLot);
      },

      cancelLiveOrder: async (ticket) => {
        const { config, syncBrokerData } = get();
        const res = await brokerApi.cancelOrder(ticket, config.gatewayUrl);
        if (res.success) {
          await syncBrokerData();
        }
        return res;
      }
    }),
    {
      name: 'quantpro-broker-storage',
      partialize: sanitizeBrokerStorageConfig
    }
  )
);
