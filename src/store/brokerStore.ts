import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BrokerAccount,
  BrokerConfig,
  BrokerConnectionStatus,
  BrokerDeal,
  BrokerOrder,
  BrokerPosition,
  BrokerType,
  PositionMode,
  UnifiedOrderRequest
} from '../types/broker';
import { brokerApi } from '../api/broker';
import { soundFx } from '../engine/audioEngine';

interface BrokerStore {
  // Mode & Connection State
  isLiveTradingMode: boolean;
  activeBroker: BrokerType;
  connectionStatus: BrokerConnectionStatus;
  statusMessage: string;
  pingLatency: number;
  isBrokerModalOpen: boolean;
  
  // Credentials & Config
  config: BrokerConfig;

  // Real-time Data
  account: BrokerAccount | null;
  positions: BrokerPosition[];
  orders: BrokerOrder[];
  deals: BrokerDeal[];

  // Sync Timer
  syncIntervalId: any;

  // Actions
  setLiveTradingMode: (enabled: boolean) => void;
  setBrokerModalOpen: (open: boolean) => void;
  updateConfig: (partial: Partial<BrokerConfig>) => void;
  
  connectBroker: (overrideConfig?: Partial<BrokerConfig>) => Promise<boolean>;
  disconnectBroker: () => Promise<void>;
  syncBrokerData: () => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;

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

export const useBrokerStore = create<BrokerStore>()(
  persist(
    (set, get) => ({
      isLiveTradingMode: false,
      activeBroker: 'MT5_EXNESS',
      connectionStatus: 'DISCONNECTED',
      statusMessage: '',
      pingLatency: -1,
      isBrokerModalOpen: false,

      config: DEFAULT_CONFIG,

      account: null,
      positions: [],
      orders: [],
      deals: [],
      syncIntervalId: null,

      setLiveTradingMode: (enabled: boolean) => {
        set({ isLiveTradingMode: enabled });
        if (enabled && get().connectionStatus !== 'CONNECTED') {
          // Auto connect if not connected
          get().connectBroker();
        }
      },

      setBrokerModalOpen: (open: boolean) => {
        set({ isBrokerModalOpen: open });
      },

      updateConfig: (partial: Partial<BrokerConfig>) => {
        set((state) => ({
          config: { ...state.config, ...partial }
        }));
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

            // Initial fetch and start auto-sync
            await get().syncBrokerData();
            get().startAutoSync();
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
        const id = setInterval(() => {
          get().syncBrokerData();
        }, 1000); // 1s sync rate
        set({ syncIntervalId: id });
      },

      stopAutoSync: () => {
        const { syncIntervalId } = get();
        if (syncIntervalId) {
          clearInterval(syncIntervalId);
          set({ syncIntervalId: null });
        }
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
      partialize: (state) => ({
        activeBroker: state.activeBroker,
        config: state.config,
        isLiveTradingMode: state.isLiveTradingMode
      })
    }
  )
);
