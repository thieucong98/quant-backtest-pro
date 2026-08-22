/**
 * Quant Backtest Pro — HTTP API Client
 * Base client with auth token, error handling, and BigInt serialization
 */

const API_BASE = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('quant_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('quant_auth_token', token);
  } else {
    localStorage.removeItem('quant_auth_token');
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const text = await response.text();
  // Handle BigInt serialization from Prisma
  return JSON.parse(text, (_key, value) => {
    if (typeof value === 'string' && /^\d{10,}$/.test(value)) {
      const num = Number(value);
      if (Number.isSafeInteger(num)) return num;
    }
    return value;
  });
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })
};

// Health check
export async function checkServerHealth(): Promise<boolean> {
  try {
    const result = await api.get<{ status: string }>('/health');
    return result.status === 'ok';
  } catch {
    return false;
  }
}
