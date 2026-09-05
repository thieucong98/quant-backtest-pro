import { api } from './client';

export interface TunnelStatusResponse {
  active: boolean;
  publicUrl: string | null;
  provider: 'CLOUDFLARE' | 'LOCALTUNNEL' | null;
  port: number;
  startedAt: number | null;
  uptime: number;
  pin: string | null;
  error: string | null;
  logs?: string[];
}

export const tunnelApi = {
  /**
   * Get current tunnel status
   */
  getStatus: () => api.get<TunnelStatusResponse>('/tunnel/status'),

  /**
   * Start a public remote access tunnel
   */
  start: (provider: 'CLOUDFLARE' | 'LOCALTUNNEL' = 'CLOUDFLARE', port?: number, pin?: string) =>
    api.post<{ success: boolean; publicUrl: string; provider: string; port: number; message: string }>('/tunnel/start', {
      provider,
      port,
      pin
    }),

  /**
   * Stop the active tunnel
   */
  stop: () => api.post<{ success: boolean; message: string }>('/tunnel/stop', {}),

  /**
   * Set or update access protection PIN
   */
  setPin: (pin: string) => api.post<{ success: boolean; pin: string | null }>('/tunnel/set-pin', { pin })
};
