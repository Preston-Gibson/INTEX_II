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

export function getUser(): { email: string; firstName?: string; lastName?: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload['email'] ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? '';
    const firstName = payload['given_name'] ?? undefined;
    const lastName = payload['family_name'] ?? undefined;
    return { email, firstName, lastName };
  } catch { return null; }
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

const API_BASE = `${(import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? 'http://localhost:5229'}`;

export async function downloadExport(
  path: string,
  format: string,
  year?: string | number
): Promise<void> {
  const yearParam = year ? `&year=${year}` : '';
  const url = `${API_BASE}${path}?format=${format}${yearParam}`;
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      alert(`Export failed (${res.status}): ${msg}`);
      return;
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="(.+)"/);
    const fileName = match ? match[1] : `export.${format}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert(`Export failed: ${e instanceof Error ? e.message : 'Network error'}`);
  }
}
