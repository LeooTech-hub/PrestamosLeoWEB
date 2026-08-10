// Authentication utility functions for PrestamosLeoWEB
export type UserRole = 'ADMIN' | 'COBRADOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('jwt');
}

export function isAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === 'ADMIN';
}

export function storeAuth(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
}
