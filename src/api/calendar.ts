import { api } from './client';
import { EconomicNewsEvent } from '../config/newsEvents';

export interface CalendarQueryOptions {
  from?: number;
  to?: number;
  symbol?: string;
  currencies?: string[];
  impact?: 'ALL' | 'HIGH' | 'HIGH_MEDIUM';
}

export interface CalendarApiResponse {
  success: boolean;
  count: number;
  from: number;
  to: number;
  currencies?: string[];
  events: EconomicNewsEvent[];
}

export const calendarApi = {
  getEvents: async (options?: CalendarQueryOptions): Promise<EconomicNewsEvent[]> => {
    const params = new URLSearchParams();
    if (options?.from) params.set('from', String(options.from));
    if (options?.to) params.set('to', String(options.to));
    if (options?.symbol) params.set('symbol', options.symbol);
    if (options?.currencies && options.currencies.length > 0) {
      params.set('currencies', options.currencies.join(','));
    }
    if (options?.impact && options.impact !== 'ALL') {
      params.set('impact', options.impact);
    }

    const res = await api.get<CalendarApiResponse>(`/calendar?${params.toString()}`);
    return res.events || [];
  },

  sync: async (events: EconomicNewsEvent[]): Promise<{ success: boolean; count: number }> => {
    return api.post('/calendar/sync', { events });
  },

  importData: async (data: { csvContent?: string; jsonEvents?: EconomicNewsEvent[] }): Promise<{ success: boolean; count: number; message: string }> => {
    return api.post('/calendar/import', data);
  }
};
