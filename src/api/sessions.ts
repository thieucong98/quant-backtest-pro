import { api } from './client';

export interface SessionListItem {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  initialBalance: number;
  finalBalance: number;
  finalEquity: number;
  currentIndex: number;
  status: string;
  strategyId?: string;
  createdAt: string;
  updatedAt: string;
  _count: { trades: number; drawings: number };
  analyticsSnapshot?: {
    totalTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
    maxDrawdownPercent: number;
  };
}

export interface SessionDetail {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  initialBalance: number;
  finalBalance: number;
  finalEquity: number;
  currentIndex: number;
  status: string;
  trades: any[];
  drawings: any[];
  equityPoints: any[];
  analyticsSnapshot?: any;
}

export const sessionsApi = {
  list: (status?: string) =>
    api.get<SessionListItem[]>(`/sessions${status ? `?status=${status}` : ''}`),

  get: (id: string) =>
    api.get<SessionDetail>(`/sessions/${id}`),

  create: (data: { name?: string; symbol: string; timeframe: string; initialBalance?: number }) =>
    api.post<{ id: string }>('/sessions', data),

  update: (id: string, data: Partial<{
    finalBalance: number;
    finalEquity: number;
    currentIndex: number;
    status: string;
    name: string;
    symbol: string;
    timeframe: string;
    strategyId: string;
  }>) =>
    api.put(`/sessions/${id}`, data),

  complete: (id: string, data: {
    finalBalance?: number;
    finalEquity?: number;
    analyticsSnapshot?: any;
  }) =>
    api.put(`/sessions/${id}/complete`, data),

  delete: (id: string) =>
    api.delete(`/sessions/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<{ success: boolean; count: number }>('/sessions/bulk-delete', { ids }),

  clearAll: () =>
    api.delete<{ success: boolean; count: number }>('/sessions/clear-all'),

  reset: (id: string) =>
    api.post<SessionDetail>(`/sessions/${id}/reset`, {})
};
