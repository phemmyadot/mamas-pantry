const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

/** Cookie helpers (client-side only) */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAgeSecs: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSecs}; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

/** Attempt one silent token refresh. Returns the new access token or null. */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = getCookie("mp_refresh");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setCookie("mp_access", data.access_token, 15 * 60);
    setCookie("mp_refresh", data.refresh_token, 7 * 24 * 60 * 60);
    return data.access_token as string;
  } catch {
    return null;
  }
}

/** Core fetch wrapper with automatic token refresh on 401. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = getCookie("mp_access");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await tryRefresh();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    // Refresh failed — clear tokens and let the caller handle
    deleteCookie("mp_access");
    deleteCookie("mp_refresh");
  }

  if (!res.ok) {
    let title = "Request failed";
    let detail = res.statusText;
    try {
      const body = await res.json();
      title = body.title ?? title;
      detail = body.detail ?? detail;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, title, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at: string | null;
  phone_number: string | null;
  phone_verified_at: string | null;
  created_at: string;
}

export const auth = {
  register: (email: string, password: string) =>
    apiFetch<UserResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<TokenResponse & { requires_totp?: boolean; session_token?: string }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  logout: (refreshToken: string) =>
    apiFetch<void>("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: () => apiFetch<UserResponse>("/api/v1/users/me"),

  sendPhoneOtp: (phoneNumber: string) =>
    apiFetch<void>("/api/v1/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),

  verifyPhoneOtp: (otpCode: string) =>
    apiFetch<{ detail: string }>("/api/v1/auth/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify({ otp_code: otpCode }),
    }),

  requestPasswordReset: (email: string) =>
    apiFetch<void>("/api/v1/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  confirmPasswordReset: (token: string, newPassword: string) =>
    apiFetch<void>("/api/v1/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
};
