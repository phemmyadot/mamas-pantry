// ---------------------------------------------------------------------------
// Auth
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

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** The 4 browseable categories. is_mums_pick is a separate boolean, not a category. */
export type ProductCategory = "imported" | "local" | "chilled" | "household";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_ngn: number;
  compare_price_ngn: number | null;
  category: ProductCategory;
  is_mums_pick: boolean;
  badge: string | null;
  origin: string | null;
  image_url: string | null;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  slug?: string;
  description?: string;
  price_ngn: number;
  compare_price_ngn?: number;
  category: ProductCategory;
  is_mums_pick?: boolean;
  badge?: string;
  origin?: string;
  image_url?: string;
  stock_qty?: number;
  is_active?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_count: number;
  display_order: number;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "failed";

export interface DeliveryAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
  unit_price_ngn: number;
}

export interface RiderInfo {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  current_lat: number | null;
  current_lng: number | null;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  subtotal_ngn: number;
  delivery_fee_ngn: number;
  total_ngn: number;
  delivery_address: DeliveryAddress;
  items: OrderItem[];
  rider_id: string | null;
  rider: RiderInfo | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Shipments & Pre-Orders
// ---------------------------------------------------------------------------

export type ShipmentStatus = "upcoming" | "in_transit" | "arrived" | "cancelled";

export interface Shipment {
  id: string;
  name: string;
  origin_country: string;
  departure_date: string;
  arrival_date: string;
  status: ShipmentStatus;
  notes: string | null;
}

export interface PreOrder {
  id: string;
  user_id: string;
  product_id: string;
  shipment_id: string;
  quantity: number;
  status: "pending" | "confirmed" | "cancelled";
}

// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------

export type DiscountType = "percentage" | "fixed";

export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_ngn: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
}
