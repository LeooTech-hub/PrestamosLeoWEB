const API_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('jwt')) : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const method = (options?.method || 'GET').toUpperCase();
  let url = `${API_URL}${endpoint}`;
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_t=${Date.now()}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error ${response.status}`);
  }
  return response.json();
}

export interface CollectorStat {
  id: string;
  name: string;
  email: string;
  role: string;
  collectedToday: number;
  collectedTotal: number;
  assignedClients: number;
}

export interface ActivityLog {
  id: number;
  userId: string;
  userName: string;
  actionType: string;
  description: string;
  amount: number;
  createdAt: string;
}

export const collectorService = {
  getCollectorStats: (): Promise<{ success: boolean; stats: CollectorStat[] }> =>
    fetchAPI('/admin/collectors/stats'),

  getCollectorActivity: (id: string, limit = 50): Promise<{ success: boolean; activities: ActivityLog[] }> =>
    fetchAPI(`/admin/collectors/${id}/activity?limit=${limit}`),

  assignClients: (clientIds: string[], collectorId: string | null) =>
    fetchAPI('/clients/assign', {
      method: 'PUT',
      body: JSON.stringify({ clientIds, collectorId }),
    }),

  getUsers: (): Promise<{ success: boolean; users: Array<{ id: string; name: string; email: string; role: string }> }> =>
    fetchAPI('/users'),
};
