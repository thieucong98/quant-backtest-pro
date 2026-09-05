import { create } from 'zustand';
import { tunnelApi, TunnelStatusResponse } from '../api/tunnel';

interface TunnelStoreState {
  isTunnelModalOpen: boolean;
  setTunnelModalOpen: (open: boolean) => void;
  isActive: boolean;
  isLoading: boolean;
  publicUrl: string | null;
  provider: 'CLOUDFLARE' | 'LOCALTUNNEL';
  port: number;
  startedAt: number | null;
  pin: string | null;
  error: string | null;
  logs: string[];

  // Actions
  fetchStatus: () => Promise<void>;
  startTunnel: (provider?: 'CLOUDFLARE' | 'LOCALTUNNEL', customPort?: number) => Promise<{ success: boolean; url?: string; message?: string }>;
  stopTunnel: () => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
}

export const useTunnelStore = create<TunnelStoreState>((set, get) => ({
  isTunnelModalOpen: false,
  setTunnelModalOpen: (open) => set({ isTunnelModalOpen: open }),
  isActive: false,
  isLoading: false,
  publicUrl: null,
  provider: 'CLOUDFLARE',
  port: 5174,
  startedAt: null,
  pin: null,
  error: null,
  logs: [],

  fetchStatus: async () => {
    try {
      const status: TunnelStatusResponse = await tunnelApi.getStatus();
      set({
        isActive: !!status.active,
        publicUrl: status.publicUrl,
        provider: status.provider || 'CLOUDFLARE',
        port: status.port || 5174,
        startedAt: status.startedAt || null,
        pin: status.pin || null,
        error: status.error || null,
        logs: status.logs || []
      });
    } catch {
      // server offline or endpoint not reachable
    }
  },

  startTunnel: async (provider = 'CLOUDFLARE', customPort) => {
    set({ isLoading: true, error: null });
    try {
      const res = await tunnelApi.start(provider, customPort);
      if (res.success && res.publicUrl) {
        set({
          isActive: true,
          publicUrl: res.publicUrl,
          provider: (res.provider as any) || provider,
          port: res.port,
          startedAt: Date.now(),
          isLoading: false,
          error: null
        });
        return { success: true, url: res.publicUrl, message: res.message };
      } else {
        set({ isLoading: false, error: res.message || 'Failed to initialize tunnel' });
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const errMsg = err.message || 'Network error while starting tunnel';
      set({ isLoading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  stopTunnel: async () => {
    set({ isLoading: true });
    try {
      await tunnelApi.stop();
      set({
        isActive: false,
        publicUrl: null,
        startedAt: null,
        isLoading: false,
        error: null
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return false;
    }
  },

  setPin: async (pin: string) => {
    try {
      const res = await tunnelApi.setPin(pin);
      if (res.success) {
        set({ pin: res.pin });
      }
    } catch {}
  }
}));
