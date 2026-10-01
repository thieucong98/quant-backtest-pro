/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * ExecutionBridgeStore: Zustand Client Store for Local Execution Bridge Daemon
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import { create } from 'zustand';
import {
  BridgeDaemonStatus,
  BridgeExecutionReportPayload,
  BridgeWsMessage,
} from '../types/executionBridge';
import { BrokerType, UnifiedOrderRequest } from '../types/broker';

export type BridgeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface ExecutionBridgeState {
  status: BridgeStatus;
  gatewayUrl: string;
  authToken: string;
  daemonStatus: BridgeDaemonStatus | null;
  activeBroker: BrokerType;
  latencyMs: number;
  circuitBreakerActive: boolean;
  executionReports: BridgeExecutionReportPayload[];
  error: string | null;

  // Actions
  connect: (url?: string, token?: string) => Promise<boolean>;
  disconnect: () => void;
  fetchStatus: () => Promise<void>;
  submitOrder: (order: UnifiedOrderRequest) => Promise<void>;
  cancelOrder: (ticket: string | number) => Promise<void>;
  resetCircuitBreaker: () => Promise<boolean>;
}

let wsClient: WebSocket | null = null;

export const useExecutionBridgeStore = create<ExecutionBridgeState>((set, get) => ({
  status: 'DISCONNECTED',
  gatewayUrl: 'http://127.0.0.1:8766',
  authToken: 'qeb_token_default',
  daemonStatus: null,
  activeBroker: 'MT5_EXNESS',
  latencyMs: 15,
  circuitBreakerActive: false,
  executionReports: [],
  error: null,

  connect: async (url, token) => {
    const targetUrl = url || get().gatewayUrl;
    const targetToken = token || get().authToken;

    set({ status: 'CONNECTING', error: null, gatewayUrl: targetUrl, authToken: targetToken });

    try {
      // 1. Check HTTP Health
      const healthRes = await fetch(`${targetUrl}/health`).catch(() => null);
      if (!healthRes || !healthRes.ok) {
        set({ status: 'ERROR', error: 'Daemon HTTP endpoint not reachable' });
        return false;
      }
      const statusData: BridgeDaemonStatus = await healthRes.json();
      set({ daemonStatus: statusData, activeBroker: statusData.activeBroker });

      // 2. Open WebSocket Stream
      const wsUrl = targetUrl.replace(/^http/, 'ws') + '/stream';
      if (wsClient) {
        wsClient.close();
      }

      if (typeof WebSocket !== 'undefined') {
        const ws = new WebSocket(wsUrl);
        wsClient = ws;

        ws.onopen = () => {
          // Send Auth Request
          const authMsg: BridgeWsMessage = {
            id: String(Date.now()),
            type: 'AUTH_REQUEST',
            timestamp: Math.floor(Date.now() / 1000),
            payload: { token: targetToken, clientVersion: '2.0.0' },
          };
          ws.send(JSON.stringify(authMsg));
        };

        ws.onmessage = (event) => {
          try {
            const msg: BridgeWsMessage<any> = JSON.parse(event.data.toString());
            if (msg.type === 'AUTH_RESPONSE') {
              if (msg.payload?.authenticated) {
                set({ status: 'CONNECTED', error: null });
              } else {
                set({ status: 'ERROR', error: 'Authentication rejected by daemon' });
              }
            } else if (msg.type === 'ORDER_EXECUTION_REPORT') {
              set((state) => ({
                executionReports: [msg.payload, ...state.executionReports].slice(0, 50),
              }));
            } else if (msg.type === 'CIRCUIT_BREAKER_ALERT') {
              set({ circuitBreakerActive: true, error: msg.payload?.message });
            }
          } catch {}
        };

        ws.onclose = () => {
          if (get().status === 'CONNECTED') {
            set({ status: 'DISCONNECTED' });
          }
        };

        ws.onerror = () => {
          set({ status: 'ERROR', error: 'WebSocket connection failed' });
        };
      } else {
        set({ status: 'CONNECTED' });
      }

      return true;
    } catch (err: any) {
      set({ status: 'ERROR', error: err?.message || 'Connection failed' });
      return false;
    }
  },

  disconnect: () => {
    if (wsClient) {
      wsClient.close();
      wsClient = null;
    }
    set({ status: 'DISCONNECTED', error: null });
  },

  fetchStatus: async () => {
    try {
      const res = await fetch(`${get().gatewayUrl}/health`);
      if (res.ok) {
        const data: BridgeDaemonStatus = await res.json();
        set({
          daemonStatus: data,
          activeBroker: data.activeBroker,
          latencyMs: data.roundTripLatencyMs,
          circuitBreakerActive: data.circuitBreakerActive,
        });
      }
    } catch {}
  },

  submitOrder: async (order) => {
    if (wsClient && wsClient.readyState === (WebSocket as any).OPEN) {
      const clientOrderId = `cli_${Date.now()}`;
      wsClient.send(
        JSON.stringify({
          id: clientOrderId,
          type: 'ORDER_SUBMIT',
          timestamp: Math.floor(Date.now() / 1000),
          payload: {
            clientOrderId,
            order,
            broker: get().activeBroker,
          },
        })
      );
    }
  },

  cancelOrder: async (ticket) => {
    if (wsClient && wsClient.readyState === (WebSocket as any).OPEN) {
      wsClient.send(
        JSON.stringify({
          id: String(Date.now()),
          type: 'ORDER_CANCEL',
          timestamp: Math.floor(Date.now() / 1000),
          payload: {
            ticket,
            broker: get().activeBroker,
          },
        })
      );
    }
  },

  resetCircuitBreaker: async () => {
    try {
      const res = await fetch(`${get().gatewayUrl}/v1/circuit-breaker/reset`, { method: 'POST' });
      if (res.ok) {
        set({ circuitBreakerActive: false, error: null });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
