export interface RiderProfile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  is_active: boolean;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
  unit_price_ngn: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_ref: string | null;
  subtotal_ngn: string;
  delivery_fee_ngn: string;
  total_ngn: string;
  delivery_address: {
    name: string;
    phone: string;
    address: string;
    area?: string;
    city: string;
  };
  rider_id: string | null;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
