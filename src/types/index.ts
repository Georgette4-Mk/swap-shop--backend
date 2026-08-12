// ============================================================
// TYPE DEFINITIONS - All interfaces for the application
// ============================================================

// ─── CLIENT (Buyer) ──────────────────────────

export interface Client {
  client_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  whatsapp_contact: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientRegistration {
  full_name: string;
  email: string;
  password: string;
  whatsapp_contact?: string;
  location?: string;
}

export interface ClientLogin {
  email: string;
  password: string;
}

export interface ClientUpdate {
  full_name?: string;
  whatsapp_contact?: string;
  location?: string;
}

export interface ClientResponse {
  client_id: number;
  full_name: string;
  email: string;
  whatsapp_contact: string | null;
  location: string | null;
  created_at: string;
}

// ─── VENDOR (Seller) ──────────────────────────

export interface Vendor {
  vendor_id: number;
  store_name: string;
  email: string;
  password_hash: string;
  whatsapp_contact: string | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorRegistration {
  store_name: string;
  email: string;
  password: string;
  whatsapp_contact?: string;
  location?: string;
}

export interface VendorLogin {
  email: string;
  password: string;
}

export interface VendorUpdate {
  store_name?: string;
  whatsapp_contact?: string;
  location?: string;
}

export interface VendorResponse {
  vendor_id: number;
  store_name: string;
  email: string;
  whatsapp_contact: string | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
}

// ─── CATALOG (Listings) ──────────────────────────

export interface CatalogItem {
  catalog_id: number;
  vendor_id: number;
  category_id: number;
  title: string;
  description: string | null;
  price: string;
  image_url: string | null;
  status: 'active' | 'pending' | 'sold';
  date_posted: string;
  updated_at: string;
}

export interface CatalogCreate {
  title: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
}

export interface CatalogUpdate {
  title?: string;
  description?: string;
  price?: number;
  category_id?: number;
  image_url?: string;
  status?: 'active' | 'pending' | 'sold';
}

export interface CatalogResponse {
  catalog_id: number;
  vendor_id: number;
  category_id: number;
  category_name: string;
  title: string;
  description: string | null;
  price: string;
  image_url: string | null;
  status: 'active' | 'pending' | 'sold';
  date_posted: string;
  store_name: string;
  vendor_location: string | null;
  vendor_whatsapp: string | null;
}

// ─── CART ──────────────────────────────────────

export interface ShoppingCart {
  cart_id: number;
  client_id: number;
  status: 'active' | 'checked_out' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  item_id: number;
  cart_id: number;
  catalog_id: number;
  quantity: number;
  added_at: string;
  title: string;
  price: string;
  image_url: string | null;
}

export interface CartResponse {
  cart: ShoppingCart;
  items: CartItem[];
  total: string;
}

export interface AddToCart {
  catalog_id: number;
  quantity: number;
}

export interface UpdateCartItem {
  quantity: number;
}

// ─── PAYMENT ──────────────────────────────────

export interface Payment {
  payment_id: number;
  client_id: number;
  cart_id: number;
  amount: string;
  method: 'cash' | 'bank_transfer' | 'mobile_money' | 'card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_date: string;
}

export interface PaymentCreate {
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'card';
}

export interface PaymentResponse {
  payment: Payment;
  items: CartItem[];
  total: number;
}

// ─── CATEGORY ──────────────────────────────────

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

// ─── AUTHENTICATION ──────────────────────────

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    client?: ClientResponse;
    vendor?: VendorResponse;
    token: string;
    role: 'client' | 'vendor';
  };
}

export interface JwtPayload {
  clientId?: number;
  vendorId?: number;
  email: string;
  role: 'client' | 'vendor';
  iat: number;
  exp: number;
}

// ─── API RESPONSE ────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  error?: string;
}