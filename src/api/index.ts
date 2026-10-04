import { api } from './client';
export * from './sessions';
export * from './trades';
export * from './tunnel';
export * from './calendar';
export * from './copilot';

const OFFLINE_STRATEGIES_KEY = 'quant_offline_strategies';

function getOfflineStrategies(): any[] {
  try {
    const raw = localStorage.getItem(OFFLINE_STRATEGIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineStrategies(list: any[]): void {
  try {
    localStorage.setItem(OFFLINE_STRATEGIES_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save strategies to localStorage', err);
  }
}

export const strategiesApi = {
  list: async () => {
    try {
      const data = await api.get<any[]>('/strategies');
      if (Array.isArray(data)) {
        saveOfflineStrategies(data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    return getOfflineStrategies();
  },
  get: async (id: string) => {
    try {
      return await api.get<any>(`/strategies/${id}`);
    } catch {
      const list = getOfflineStrategies();
      const found = list.find((s: any) => s.id === id);
      if (found) return found;
      throw new Error(`Strategy ${id} not found in offline storage`);
    }
  },
  create: async (data: { name: string; description?: string; code: string; parameters?: any; enabled?: boolean }) => {
    try {
      return await api.post<any>('/strategies', data);
    } catch {
      // Offline resilient save
      const list = getOfflineStrategies();
      const newStrategy = {
        id: 'strat_local_' + Date.now(),
        name: data.name,
        description: data.description || '',
        code: data.code,
        parameters: data.parameters || {},
        enabled: data.enabled ?? true,
        createdAt: new Date().toISOString()
      };
      const updated = [newStrategy, ...list];
      saveOfflineStrategies(updated);
      return newStrategy;
    }
  },
  update: async (id: string, data: any) => {
    try {
      return await api.put<any>(`/strategies/${id}`, data);
    } catch {
      const list = getOfflineStrategies();
      const idx = list.findIndex((s: any) => s.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
        saveOfflineStrategies(list);
        return list[idx];
      }
      throw new Error(`Strategy ${id} not found in offline storage`);
    }
  },
  delete: async (id: string) => {
    try {
      return await api.delete(`/strategies/${id}`);
    } catch {
      const list = getOfflineStrategies();
      const filtered = list.filter((s: any) => s.id !== id);
      saveOfflineStrategies(filtered);
      return { success: true };
    }
  }
};

export const datasetsApi = {
  list: () => api.get<any[]>('/datasets'),
  get: (id: string) => api.get<any>(`/datasets/${id}`),
  findBySymbolTimeframe: (symbol: string, timeframe: string) =>
    api.get<any>(`/datasets/find/${symbol}/${timeframe}`),
  save: (data: { symbol: string; timeframe: string; candles: any[]; source?: string }) =>
    api.post<any>('/datasets', data),
  delete: (id: string) =>
    api.delete(`/datasets/${id}`),
  kagglePresets: () =>
    api.get<any>('/datasets/kaggle/presets'),
  kaggleDownloadSingle: (data: { datasetSlug: string; fileName: string; maxCandles?: number; username?: string; key?: string }) =>
    api.post<any>('/datasets/kaggle/download-single', data),
  kaggleDownload: (data: { datasetSlug?: string; username?: string; key?: string; maxCandles?: number; selectedTimeframes?: string[] }) =>
    api.post<any>('/datasets/kaggle/download', data),
  kaggleScanLocal: (data?: { maxCandles?: number; selectedTimeframes?: string[] }) =>
    api.post<any>('/datasets/kaggle/scan-local', data || {}),
  kaggleImportZip: (data: { base64Zip: string; maxCandles?: number; selectedTimeframes?: string[] }) =>
    api.post<any>('/datasets/kaggle/import-zip', data),
  kaggleSeedCurated: () =>
    api.post<any>('/datasets/kaggle/seed-curated', {})
};


export const analyticsApi = {
  dashboard: () => api.get<any>('/analytics/dashboard'),
  getSession: (sessionId: string) => api.get<any>(`/analytics/sessions/${sessionId}`),
  saveSession: (sessionId: string, data: any) =>
    api.post<any>(`/analytics/sessions/${sessionId}`, data)
};

export const drawingsApi = {
  sync: (sessionId: string, drawings: any[]) =>
    api.post<{ success: boolean }>('/drawings/sync', { sessionId, drawings }),
  listBySession: (sessionId: string) =>
    api.get<any[]>(`/drawings/session/${sessionId}`),
  syncEquity: (sessionId: string, equityPoints: any[]) =>
    api.post<{ success: boolean }>('/drawings/equity/sync', { sessionId, equityPoints })
};

export const usersApi = {
  me: () => api.get<{ user: any; token?: string; settings?: any }>('/users/me'),
  updateSettings: (data: any) => api.put<any>('/users/settings', data),
  login: (email: string, password: string) =>
    api.post<{ user: any; token: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ user: any; token: string }>('/auth/register', { name, email, password }),
  sso: (provider: string, email: string, name: string, avatarUrl?: string) =>
    api.post<{ user: any; token: string }>('/auth/sso', { provider, email, name, avatarUrl }),
  getProviders: () =>
    api.get<{ providers: { google: boolean; github: boolean; apple: boolean } }>('/auth/providers')
};
