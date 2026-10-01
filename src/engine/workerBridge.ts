/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * WorkerBridge: Main-Thread Controller & IPC Broker for Replay Web Worker
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import { Candle, Timeframe } from '../types/market';
import { BrokerOrder, BrokerPosition, UnifiedOrderRequest } from '../types/broker';
import {
  WorkerInboundAction,
  WorkerOutboundEvent,
  ReplayFrameBatch,
  isWorkerOutboundEvent,
} from '../types/workerSync';
import { ReplaySyncEngine } from '../workers/replaySyncWorker';

export type FrameBatchListener = (batch: ReplayFrameBatch) => void;
export type SeekCompleteListener = (result: {
  currentTimestamp: number;
  primaryCandle: Candle;
  secondaryCandle?: Candle;
  primarySlice: Candle[];
  secondarySlice?: Candle[];
}) => void;
export type OrderEventListener = (event: {
  event: 'FILLED' | 'CLOSED' | 'CANCELLED' | 'REJECTED';
  order: BrokerOrder | BrokerPosition;
  message?: string;
}) => void;
export type PropShieldViolationListener = (violation: {
  rule: string;
  message: string;
  breachValue: number;
  timestamp: number;
}) => void;
export type ErrorListener = (error: { code: string; message: string; stack?: string }) => void;
export type DatasetLoadedListener = (payload: {
  totalCandles: number;
  startTimestamp: number;
  endTimestamp: number;
  timeframe: Timeframe;
  indexedSlots: number;
}) => void;

export interface MinimalWorker {
  postMessage(message: any, transfer?: any[]): void;
  addEventListener?(type: string, listener: (ev: any) => void): void;
  removeEventListener?(type: string, listener: (ev: any) => void): void;
  terminate?(): void;
  onmessage?: ((ev: any) => void) | null;
}

export class WorkerBridge {
  private worker: MinimalWorker | null = null;
  private inProcessEngine: ReplaySyncEngine | null = null;

  public isPlaying: boolean = false;
  public speed: number = 1;
  public currentTimestamp: number = 0;
  public isLoaded: boolean = false;

  private frameBatchListeners: Set<FrameBatchListener> = new Set();
  private seekCompleteListeners: Set<SeekCompleteListener> = new Set();
  private orderEventListeners: Set<OrderEventListener> = new Set();
  private propShieldListeners: Set<PropShieldViolationListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private datasetLoadedListeners: Set<DatasetLoadedListener> = new Set();

  constructor(customWorker?: MinimalWorker) {
    if (customWorker) {
      this.worker = customWorker;
      this.bindWorkerEvents();
    } else if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../workers/replaySyncWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.bindWorkerEvents();
      } catch {
        this.initInProcessFallback();
      }
    } else {
      this.initInProcessFallback();
    }
  }

  private initInProcessFallback(): void {
    this.inProcessEngine = new ReplaySyncEngine((event: WorkerOutboundEvent) => {
      this.handleOutboundMessage(event);
    });
  }

  private bindWorkerEvents(): void {
    if (!this.worker) return;

    const onMsg = (event: MessageEvent) => {
      this.handleOutboundMessage(event.data);
    };

    if (this.worker.addEventListener) {
      this.worker.addEventListener('message', onMsg);
    } else {
      this.worker.onmessage = onMsg;
    }
  }

  private handleOutboundMessage(msg: unknown): void {
    if (!isWorkerOutboundEvent(msg)) return;

    switch (msg.type) {
      case 'DATASET_LOADED':
        this.isLoaded = true;
        this.datasetLoadedListeners.forEach((l) => l(msg.payload));
        break;

      case 'FRAME_BATCH':
        this.currentTimestamp = msg.payload.masterTimestamp;
        this.frameBatchListeners.forEach((l) => l(msg.payload));
        break;

      case 'SEEK_COMPLETE':
        this.currentTimestamp = msg.payload.currentTimestamp;
        this.seekCompleteListeners.forEach((l) => l(msg.payload));
        break;

      case 'ORDER_EVENT':
        this.orderEventListeners.forEach((l) => l(msg.payload));
        break;

      case 'PROP_SHIELD_VIOLATION':
        this.propShieldListeners.forEach((l) => l(msg.payload));
        break;

      case 'WORKER_ERROR':
        this.errorListeners.forEach((l) => l(msg.payload));
        break;
    }
  }

  public postAction(action: WorkerInboundAction): void {
    if (this.worker) {
      this.worker.postMessage(action);
    } else if (this.inProcessEngine) {
      this.inProcessEngine.handleAction(action);
    }
  }

  // --- Public Control APIs ---

  public loadDataset(params: {
    symbol: string;
    candles: Candle[];
    baseTimeframe: Timeframe;
    linkedTimeframes: Timeframe[];
    spreadPips?: number;
  }): void {
    this.isPlaying = false;
    this.postAction({
      type: 'LOAD_DATASET',
      payload: params,
    });
  }

  public play(speed?: number): void {
    if (speed !== undefined) this.speed = speed;
    this.isPlaying = true;
    this.postAction({
      type: 'REPLAY_PLAY',
      payload: { speed: this.speed },
    });
  }

  public pause(): void {
    this.isPlaying = false;
    this.postAction({
      type: 'REPLAY_PAUSE',
    });
  }

  public step(direction: 'FORWARD' | 'BACKWARD', stepCount: number = 1): void {
    this.isPlaying = false;
    this.postAction({
      type: 'REPLAY_STEP',
      payload: { direction, stepCount },
    });
  }

  public seek(targetTimestamp: number): void {
    this.isPlaying = false;
    this.postAction({
      type: 'REPLAY_SEEK',
      payload: { targetTimestamp },
    });
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
    this.postAction({
      type: 'REPLAY_SET_SPEED',
      payload: { speed },
    });
  }

  public submitOrder(order: UnifiedOrderRequest & { clientOrderId: string }): void {
    this.postAction({
      type: 'ORDER_SUBMIT',
      payload: order,
    });
  }

  public cancelOrder(orderId: string | number): void {
    this.postAction({
      type: 'ORDER_CANCEL',
      payload: { orderId },
    });
  }

  public updateConfig(config: {
    layout: 'SINGLE' | 'DUAL_HORIZONTAL' | 'DUAL_VERTICAL';
    spreadPips?: number;
    slippagePips?: number;
  }): void {
    this.postAction({
      type: 'UPDATE_CONFIG',
      payload: config,
    });
  }

  public terminate(): void {
    this.isPlaying = false;
    this.postAction({ type: 'TERMINATE' });
    if (this.worker && this.worker.terminate) {
      this.worker.terminate();
    }
    this.frameBatchListeners.clear();
    this.seekCompleteListeners.clear();
    this.orderEventListeners.clear();
    this.propShieldListeners.clear();
    this.errorListeners.clear();
    this.datasetLoadedListeners.clear();
  }

  // --- Subscription Listeners ---

  public onFrameBatch(listener: FrameBatchListener): () => void {
    this.frameBatchListeners.add(listener);
    return () => this.frameBatchListeners.delete(listener);
  }

  public onSeekComplete(listener: SeekCompleteListener): () => void {
    this.seekCompleteListeners.add(listener);
    return () => this.seekCompleteListeners.delete(listener);
  }

  public onOrderEvent(listener: OrderEventListener): () => void {
    this.orderEventListeners.add(listener);
    return () => this.orderEventListeners.delete(listener);
  }

  public onPropShieldViolation(listener: PropShieldViolationListener): () => void {
    this.propShieldListeners.add(listener);
    return () => this.propShieldListeners.delete(listener);
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public onDatasetLoaded(listener: DatasetLoadedListener): () => void {
    this.datasetLoadedListeners.add(listener);
    return () => this.datasetLoadedListeners.delete(listener);
  }
}
