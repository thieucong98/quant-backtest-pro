/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * Web Worker Multi-Chart Synchronization Data Contracts & IPC Protocols
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Daedalus (CTO / Principal System Architect)
 */

import { Candle, Timeframe, ChartType } from './market';
import { BrokerOrder, BrokerPosition, UnifiedOrderRequest } from './broker';

// =============================================================================
// 1. Worker Inbound Message Protocol (Main UI Thread -> Web Worker)
// =============================================================================

export type WorkerInboundAction =
  | {
      type: 'LOAD_DATASET';
      payload: {
        symbol: string;
        candles: Candle[];
        baseTimeframe: Timeframe;
        linkedTimeframes: Timeframe[];
        spreadPips?: number;
      };
    }
  | {
      type: 'REPLAY_PLAY';
      payload: {
        speed: number; // Playback speed multiplier (e.g. 1, 5, 10, 50, 100)
      };
    }
  | {
      type: 'REPLAY_PAUSE';
    }
  | {
      type: 'REPLAY_STEP';
      payload: {
        direction: 'FORWARD' | 'BACKWARD';
        stepCount: number;
      };
    }
  | {
      type: 'STEP';
      payload: {
        direction: 'FORWARD' | 'BACKWARD';
        count?: number;
        stepCount?: number;
      };
    }
  | {
      type: 'REPLAY_SEEK';
      payload: {
        targetTimestamp: number; // Unix timestamp in seconds
      };
    }
  | {
      type: 'REPLAY_SET_SPEED';
      payload: {
        speed: number;
      };
    }
  | {
      type: 'ORDER_SUBMIT';
      payload: UnifiedOrderRequest & { clientOrderId: string };
    }
  | {
      type: 'ORDER_CANCEL';
      payload: {
        orderId: string | number;
      };
    }
  | {
      type: 'UPDATE_CONFIG';
      payload: {
        layout: 'SINGLE' | 'DUAL_HORIZONTAL' | 'DUAL_VERTICAL';
        spreadPips?: number;
        slippagePips?: number;
      };
    }
  | {
      type: 'TERMINATE';
    };

// =============================================================================
// 2. Worker Outbound Message Protocol (Web Worker -> Main UI Thread)
// =============================================================================

export interface ReplayAccountSnapshot {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface ReplayFrameBatch {
  masterTimestamp: number;
  primaryCandle: Candle;            // Lower Timeframe Candle (e.g. M5)
  secondaryCandle?: Candle;         // Higher Timeframe Developing Candle (e.g. H1)
  developingSecondary?: Candle;     // Synthesized developing candle alias
  developingCandles?: Record<string, Candle>; // Map of timeframe to developing candle
  isSecondaryNewBar: boolean;       // True when secondary TF crossed a period boundary
  accountState: ReplayAccountSnapshot;
  recentFills?: BrokerOrder[];
}

export type WorkerOutboundEvent =
  | {
      type: 'DATASET_LOADED';
      payload: {
        totalCandles: number;
        startTimestamp: number;
        endTimestamp: number;
        timeframe: Timeframe;
        indexedSlots: number;
      };
    }
  | {
      type: 'FRAME_BATCH';
      payload: ReplayFrameBatch;
    }
  | {
      type: 'SEEK_COMPLETE';
      payload: {
        currentTimestamp: number;
        primaryCandle: Candle;
        secondaryCandle?: Candle;
        primarySlice: Candle[];
        secondarySlice?: Candle[];
      };
    }
  | {
      type: 'ORDER_EVENT';
      payload: {
        event: 'FILLED' | 'CLOSED' | 'CANCELLED' | 'REJECTED';
        order: BrokerOrder | BrokerPosition;
        message?: string;
      };
    }
  | {
      type: 'PROP_SHIELD_VIOLATION';
      payload: {
        rule: string;
        message: string;
        breachValue: number;
        timestamp: number;
      };
    }
  | {
      type: 'HEARTBEAT_PULSE';
      payload: {
        workerTime: number;
        processedTicks: number;
        fps: number;
      };
    }
  | {
      type: 'WORKER_ERROR';
      payload: {
        code: string;
        message: string;
        stack?: string;
      };
    };

// =============================================================================
// 3. Multi-Chart Layout & UI Synchronization Contracts
// =============================================================================

export interface SyncedIndicatorConfig {
  id: string;
  type: 'SMA' | 'EMA' | 'RSI' | 'ATR' | 'BOLLINGER' | 'MACD';
  period: number;
  source: 'close' | 'open' | 'high' | 'low';
  color: string;
  visible: boolean;
}

export interface SyncedPaneConfig {
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  indicators: SyncedIndicatorConfig[];
  isLockedToMaster: boolean;
}

export interface MultiChartLayoutConfig {
  mode: 'SINGLE' | 'DUAL_HORIZONTAL' | 'DUAL_VERTICAL';
  chartA: SyncedPaneConfig;
  chartB: SyncedPaneConfig;
  isCrosshairSynced: boolean;
  isTimeScrubberSynced: boolean;
  isDrawingOverlaySynced: boolean;
}

export interface DevelopingCandleState {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isComplete: boolean;
}

// =============================================================================
// 4. Type Guards
// =============================================================================

export function isWorkerInboundAction(msg: unknown): msg is WorkerInboundAction {
  if (typeof msg !== 'object' || msg === null) return false;
  return 'type' in msg && typeof (msg as { type: string }).type === 'string';
}

export function isWorkerOutboundEvent(msg: unknown): msg is WorkerOutboundEvent {
  if (typeof msg !== 'object' || msg === null) return false;
  return 'type' in msg && typeof (msg as { type: string }).type === 'string';
}
