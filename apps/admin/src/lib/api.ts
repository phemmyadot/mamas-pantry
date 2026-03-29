import type {
  Product,
  ProductCategory,
  Order,
  OrderStatus,
  Shipment,
  ShipmentStatus,
  PreOrder,
  PromoCode,
} from "@mamas-pantry/types";

export type { Product, ProductCategory, Order, OrderStatus, Shipment, ShipmentStatus, PreOrder, PromoCode };

// ── token storage ──────────────────────────────────────────────────────────────

const ACCESS_KEY = "admin_access_token";
const REFRESH_KEY = "admin_refresh_token";

export const tokens = {
  get access() { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── error ──────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
  }
}

// ── fetch wrapper ──────────────────────────────────────────────────────────────

let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const rt = tokens.refresh;
  if (!rt) throw new ApiError(401, "No refresh token");
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rt }),
  });
  if (!res.ok) { tokens.clear(); throw new ApiError(401, "Session expired"); }
  const data = await res.json();
  tokens.set(data.access_token, data.refresh_token ?? rt);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  const res = await fetch(`/api/v1${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    await refreshPromise;
    return apiFetch<T>(path, options, false);
  }

  if (res.status === 204) return undefined as unknown as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = body?.detail ?? res.statusText;
    const detail = Array.isArray(raw)
      ? raw.map((e: { msg?: string; loc?: string[] }) => `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`).join("; ")
      : String(raw);
    throw new ApiError(res.status, detail);
  }
  return body as T;
}

// ── auth ───────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  is_active: boolean;
  is_verified: boolean;
  roles?: { name: string }[];
}

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; refresh_token: string; token_type: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    ),
  me: () => apiFetch<UserResponse>("/users/me"),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }).catch(() => {}),
};

export interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  roles?: { name: string }[];
}

export interface AccessUserCreate {
  email: string;
  password: string;
  username?: string | null;
  role: "staff" | "rider";
}

export const adminUsers = {
  list: () => apiFetch<AdminUser[]>("/admin/users"),
  listStaffUsers: (role?: "staff" | "rider") =>
    apiFetch<AdminUser[]>(`/admin/staff-users${role ? `?role=${role}` : ""}`),
  createStaffUser: (data: AccessUserCreate) =>
    apiFetch<AdminUser>("/admin/staff-users", { method: "POST", body: JSON.stringify(data) }),
  assignAccessRole: (userId: string, role: "staff" | "rider") =>
    apiFetch<void>(`/admin/users/${userId}/access-role?role=${role}`, { method: "POST" }),
  removeAccessRole: (userId: string, role: "staff" | "rider") =>
    apiFetch<void>(`/admin/users/${userId}/access-role?role=${role}`, { method: "DELETE" }),
};

// ── dashboard ──────────────────────────────────────────────────────────────────

export interface DailyRevenue { date: string; revenue_ngn: number; }
export interface DashboardData {
  today_revenue_ngn: number;
  active_orders_count: number;
  low_stock_count: number;
  new_customers_today: number;
  weekly_revenue: DailyRevenue[];
  recent_orders: RecentOrder[];
}
export interface RecentOrder {
  id: string; user_id: string; status: string;
  payment_status: string; total_ngn: number; created_at: string;
}

export const dashboard = {
  get: () => apiFetch<DashboardData>("/admin/dashboard"),
};

// ── products ───────────────────────────────────────────────────────────────────

export interface ProductCreate {
  name: string; slug: string; description?: string | null;
  price_ngn: number; compare_price_ngn?: number | null;
  category: ProductCategory; is_mums_pick: boolean;
  badge?: string | null; origin?: string | null;
  image_url?: string | null; images: string[];
  stock_qty: number; is_active: boolean;
}

export const products = {
  list: (params?: { category?: string; search?: string; offset?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    if (params?.offset != null) qs.set("offset", String(params.offset));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    return apiFetch<Product[]>(`/admin/products?${qs}`);
  },
  get: (id: string) => apiFetch<Product>(`/products/${id}`),
  create: (data: ProductCreate) =>
    apiFetch<Product>("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ProductCreate>) =>
    apiFetch<Product>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/admin/products/${id}`, { method: "DELETE" }),
  lowStock: (threshold = 5) => apiFetch<Product[]>(`/admin/inventory/low-stock?threshold=${threshold}`),
};

// ── orders ─────────────────────────────────────────────────────────────────────

export const orders = {
  list: (params?: { status?: string; offset?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.offset != null) qs.set("offset", String(params.offset));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    return apiFetch<Order[]>(`/admin/orders?${qs}`);
  },
  get: (id: string) => apiFetch<Order>(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    apiFetch<Order>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  assignRider: (id: string, riderId: string) =>
    apiFetch<Order>(`/admin/orders/${id}/assign-rider`, { method: "POST", body: JSON.stringify({ rider_id: riderId }) }),
};

// ── shipments ──────────────────────────────────────────────────────────────────

export interface ShipmentCreate {
  name: string; origin_country: string;
  departure_date: string; arrival_date: string;
  status: ShipmentStatus; notes?: string | null;
}

export const shipments = {
  list: () => apiFetch<Shipment[]>("/shipments"),
  create: (data: ShipmentCreate) =>
    apiFetch<Shipment>("/admin/shipments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ShipmentCreate>) =>
    apiFetch<Shipment>(`/admin/shipments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ── customers ─────────────────────────────────────────────────────────────────

export interface CustomerSummary {
  id: string; email: string; full_name: string | null;
  order_count: number; total_spend_ngn: number; created_at: string;
}

export const customers = {
  list: (params?: { offset?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.offset != null) qs.set("offset", String(params.offset));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    return apiFetch<CustomerSummary[]>(`/admin/customers?${qs}`);
  },
};

// ── analytics ─────────────────────────────────────────────────────────────────

export interface TopProduct {
  product_id: string; product_name: string;
  total_qty: number; total_revenue_ngn: number;
}
export interface AnalyticsData {
  revenue_by_date: DailyRevenue[];
  top_products: TopProduct[];
  category_breakdown: { category: string; revenue_ngn: number }[];
}

export const analytics = {
  get: (fromDate?: string, toDate?: string) => {
    const qs = new URLSearchParams();
    if (fromDate) qs.set("from_date", fromDate);
    if (toDate) qs.set("to_date", toDate);
    return apiFetch<AnalyticsData>(`/admin/analytics?${qs}`);
  },
};

// ── riders ─────────────────────────────────────────────────────────────────────

export interface Rider {
  id: string; name: string; phone: string;
  is_active: boolean; current_lat: number | null; current_lng: number | null;
  created_at: string; updated_at: string;
}

export const riders = {
  list: () => apiFetch<Rider[]>("/admin/riders"),
  create: (data: { name: string; phone: string }) =>
    apiFetch<Rider>("/admin/riders", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; phone: string; is_active: boolean }>) =>
    apiFetch<Rider>(`/admin/riders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ── promo codes ────────────────────────────────────────────────────────────────

export interface PromoCodeCreate {
  code: string; discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number; min_order_ngn?: number | null;
  max_uses?: number | null; expires_at?: string | null;
}

export const promoCodes = {
  list: () => apiFetch<PromoCode[]>("/admin/promo-codes"),
  create: (data: PromoCodeCreate) =>
    apiFetch<PromoCode>("/admin/promo-codes", { method: "POST", body: JSON.stringify(data) }),
};

// ── delivery fees ─────────────────────────────────────────────────────────────

export interface DeliveryFee {
  id: string;
  area: string;
  fee_ngn: number;
}

export const deliveryFees = {
  list: () => apiFetch<DeliveryFee[]>("/admin/delivery-fees"),
  save: (rows: { area: string; fee_ngn: number }[]) =>
    apiFetch<DeliveryFee[]>("/admin/delivery-fees", { method: "PUT", body: JSON.stringify(rows) }),
};
