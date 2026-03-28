import type {
  TokenResponse,
  UserResponse,
  Product,
  ProductCategory,
  ProductCreate,
  Order,
  OrderStatus,
  DeliveryAddress,
  Shipment,
  PreOrder,
} from "@mamas-pantry/types";

export type {
  TokenResponse,
  UserResponse,
  Product,
  ProductCategory,
  ProductCreate,
  Order,
  OrderItem,
  OrderStatus,
  DeliveryAddress,
  Shipment,
  PreOrder,
} from "@mamas-pantry/types";

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

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const products = {
  list: (params?: {
    category?: ProductCategory;
    mums_pick?: boolean;
    search?: string;
    offset?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.mums_pick) qs.set("mums_pick", "true");
    if (params?.search) qs.set("search", params.search);
    if (params?.offset != null) qs.set("offset", String(params.offset));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    return apiFetch<Product[]>(`/api/v1/products?${qs}`);
  },

  featured: () => apiFetch<Product[]>("/api/v1/products/featured"),

  getBySlug: (slug: string) => apiFetch<Product>(`/api/v1/products/${slug}`),

  create: (data: ProductCreate) =>
    apiFetch<Product>("/api/v1/admin/products", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<ProductCreate>) =>
    apiFetch<Product>(`/api/v1/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch<void>(`/api/v1/admin/products/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orders = {
  create: (items: { product_id: string; qty: number }[], delivery_address: DeliveryAddress, promo_code?: string) =>
    apiFetch<Order>("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify({ items, delivery_address, promo_code }),
    }),

  myOrders: (offset = 0, limit = 20) =>
    apiFetch<Order[]>(`/api/v1/orders/me?offset=${offset}&limit=${limit}`),

  myOrder: (id: string) => apiFetch<Order>(`/api/v1/orders/me/${id}`),

  adminList: (status?: OrderStatus, offset = 0, limit = 50) => {
    const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    if (status) qs.set("status", status);
    return apiFetch<Order[]>(`/api/v1/admin/orders?${qs}`);
  },

  adminGet: (id: string) => apiFetch<Order>(`/api/v1/admin/orders/${id}`),

  adminUpdateStatus: (id: string, status: OrderStatus) =>
    apiFetch<Order>(`/api/v1/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ---------------------------------------------------------------------------
// Shipments & Pre-Orders
// ---------------------------------------------------------------------------

export const shipments = {
  list: () => apiFetch<Shipment[]>("/api/v1/shipments"),
  get: (id: string) => apiFetch<Shipment>(`/api/v1/shipments/${id}`),
  products: (id: string) => apiFetch<Product[]>(`/api/v1/shipments/${id}/products`),
  adminCreate: (data: Omit<Shipment, "id">) =>
    apiFetch<Shipment>("/api/v1/admin/shipments", { method: "POST", body: JSON.stringify(data) }),
  adminUpdate: (id: string, data: Partial<Shipment>) =>
    apiFetch<Shipment>(`/api/v1/admin/shipments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const preOrders = {
  create: (product_id: string, shipment_id: string, quantity: number) =>
    apiFetch<PreOrder>("/api/v1/pre-orders", {
      method: "POST",
      body: JSON.stringify({ product_id, shipment_id, quantity }),
    }),
  mine: () => apiFetch<PreOrder[]>("/api/v1/pre-orders/mine"),
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface CategoryStat {
  category: ProductCategory;
  product_count: number;
}

export const categories = {
  list: () => apiFetch<CategoryStat[]>("/api/v1/categories"),
};

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  area: string;
  city: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreate {
  label: string;
  street: string;
  area: string;
  city: string;
  is_default?: boolean;
}

export const addresses = {
  list: () => apiFetch<Address[]>("/api/v1/addresses"),
  create: (data: AddressCreate) =>
    apiFetch<Address>("/api/v1/addresses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AddressCreate>) =>
    apiFetch<Address>(`/api/v1/addresses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/v1/addresses/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

export interface LoyaltyTransaction {
  id: string;
  order_id: string | null;
  points: number;
  type: "EARN" | "REDEEM" | "EXPIRE";
  description: string;
  created_at: string;
}

export interface LoyaltyBalance {
  points: number;
  ngn_value: number;
  transactions: LoyaltyTransaction[];
}

export const loyalty = {
  me: () => apiFetch<LoyaltyBalance>("/api/v1/loyalty/me"),
};

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

export const notifications = {
  subscribe: (token: string) =>
    apiFetch<void>("/api/v1/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

