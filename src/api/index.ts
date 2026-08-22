import { api } from './client';

export const strategiesApi = {
  list: () => api.get<any[]>('/strategies'),
  get: (id: string) => api.get<any>(`/strategies/${id}`),
  create: (data: { name: string; description?: string; code: string; parameters?: any; enabled?: boolean }) =>
    api.post<any>('/strategies', data),
  update: (id: string, data: any) =>
    api.put<any>(`/strategies/${id}`, data),
  delete: (id: string) =>
    api.delete(`/strategies/${id}`)
};

export const datasetsApi = {
  list: () => api.get<any[]>('/datasets'),
  get: (id: string) => api.get<any>(`/datasets/${id}`),
  findBySymbolTimeframe: (symbol: string, timeframe: string) =>
    api.get<any>(`/datasets/find/${symbol}/${timeframe}`),
  save: (data: { symbol: string; timeframe: string; candles: any[]; source?: string }) =>
    api.post<any>('/datasets', data),
  delete: (id: string) =>
    api.delete(`/datasets/${id}`)
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
    api.post<{ user: any; token: string }>('/auth/sso', { provider, email, name, avatarUrl })
};
