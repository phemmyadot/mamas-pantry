import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, tokens, type UserResponse } from "@/lib/api";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens.access) { setLoading(false); return; }
    auth.me()
      .then(setUser)
      .catch(() => { tokens.clear(); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await auth.login(email, password);
    tokens.set(data.access_token, data.refresh_token);
    const me = await auth.me();
    setUser(me);
  }

  async function logout() {
    await auth.logout();
    tokens.clear();
    setUser(null);
  }

  const roles = user?.roles?.map((r) => r.name) ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isStaff = isAdmin || roles.includes("staff");

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAuthenticated: !!user,
      isAdmin, isStaff,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
