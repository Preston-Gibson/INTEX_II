const TOKEN_KEY = 'lucera_token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getRole(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
  } catch {
    return null;
  }
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  initials: string;
  fullName: string;
}

export function getUser(): UserInfo | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const firstName: string = payload['firstName'] ?? '';
    const lastName: string  = payload['lastName']  ?? '';
    const email: string     = payload['email']     ?? payload['sub'] ?? '';
    const role: string | null =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
    const nameParts = [firstName, lastName].filter(Boolean);
    const fullName  = nameParts.length > 0 ? nameParts.join(' ') : email.split('@')[0];
    const initials  = nameParts.length > 0
      ? nameParts.map(p => p.charAt(0)).join('').toUpperCase()
      : fullName.charAt(0).toUpperCase();
    return { id: payload['sub'] ?? '', email, firstName, lastName, role, initials, fullName };
  } catch {
    return null;
  }
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
