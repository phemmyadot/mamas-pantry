import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { RiderProfile } from '@/types';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  rider: RiderProfile | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    rider: null,
  });

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get<RiderProfile>('/users/me');
      setState({ isLoading: false, isAuthenticated: true, rider: data });
    } catch {
      await storage.clearTokens();
      setState({ isLoading: false, isAuthenticated: false, rider: null });
    }
  }, []);

  // On mount — restore session if tokens exist
  useEffect(() => {
    (async () => {
      const token = await storage.getAccessToken();
      if (token) {
        await loadProfile();
      } else {
        setState({ isLoading: false, isAuthenticated: false, rider: null });
      }
    })();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ access_token: string; refresh_token: string }>(
      '/auth/login',
      { email, password },
    );
    await storage.saveTokens(data.access_token, data.refresh_token);
    await loadProfile();
  }, [loadProfile]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // best-effort
    } finally {
      await storage.clearTokens();
      setState({ isLoading: false, isAuthenticated: false, rider: null });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
