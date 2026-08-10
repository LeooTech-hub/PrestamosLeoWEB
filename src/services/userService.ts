const API_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('jwt')) : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error ${response.status}`);
  }
  return response.json();
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COBRADOR';
  created_at?: string;
}

export const userService = {
  listUsers: (): Promise<{ success: boolean; users: AppUser[] }> =>
    fetchAPI('/users'),

  createUser: (data: { name: string; email: string; password: string; role: 'ADMIN' | 'COBRADOR' }) =>
    fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),

  deleteUser: (id: string) =>
    fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};
