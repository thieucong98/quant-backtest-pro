import { api } from './client';

export const tradesApi = {
  listBySession: (sessionId: string) =>
    api.get<any[]>(`/trades/session/${sessionId}`),

  history: (params?: { symbol?: string; status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.symbol) qs.set('symbol', params.symbol);
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return api.get<{ trades: any[]; total: number }>(`/trades/history${q ? `?${q}` : ''}`);
  },

  create: (trade: any) =>
    api.post('/trades', trade),

  bulkSync: (sessionId: string, trades: any[]) =>
    api.post<{ success: boolean; count: number }>('/trades/bulk', { sessionId, trades }),

  update: (id: string, data: any) =>
    api.put(`/trades/${id}`, data),

  delete: (id: string) =>
    api.delete(`/trades/${id}`)
};
