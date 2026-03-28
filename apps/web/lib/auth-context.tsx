"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  auth,
  ApiError,
  setCookie,
  deleteCookie,
  type UserResponse,
  type TokenResponse,
} from "./api";

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    const hasToken = typeof document !== "undefined" && /(?:^|; )mp_access=/.test(document.cookie);
    if (!hasToken) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await auth.me();
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const data = await auth.login(email, password);
        const tokens = data as TokenResponse;
        setCookie("mp_access", tokens.access_token, 15 * 60);
        setCookie("mp_refresh", tokens.refresh_token, 7 * 24 * 60 * 60);
        const user = await auth.me();
        setState({ user, isAuthenticated: true, isLoading: false });
        return { ok: true };
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.detail : "Login failed. Try again.";
        return { ok: false, error: msg };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = document.cookie.match(/mp_refresh=([^;]*)/)?.[1];
    if (refreshToken) {
      try {
        await auth.logout(decodeURIComponent(refreshToken));
      } catch {
        // best-effort
      }
    }
    deleteCookie("mp_access");
    deleteCookie("mp_refresh");
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
