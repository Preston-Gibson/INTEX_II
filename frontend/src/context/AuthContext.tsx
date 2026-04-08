import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { getToken, setToken as storeToken, clearToken } from '../utils/auth';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());

  function login(newToken: string) {
    storeToken(newToken);
    setToken(newToken);
  }

  function logout() {
    clearToken();
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
