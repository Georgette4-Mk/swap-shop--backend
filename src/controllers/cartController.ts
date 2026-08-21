// ============================================================
// CART CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';
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

// ─── REQUEST WITH AUTH ──────────────────────

export interface AuthRequest extends Request {
  client?: JwtPayload;
  vendor?: JwtPayload;
}

// ─── API RESPONSE ────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  error?: string;
}
// ─── GET CLIENT CART ──────────────────────────

export const getClientCart = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;

    let [carts] = await pool.execute(
      'SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"',
      [clientId]
    );

    let cart = (carts as any[])[0];

    if (!cart) {
      const [result] = await pool.execute(
        'INSERT INTO shopping_cart (client_id, status) VALUES (?, "active")',
        [clientId]
      );
      const [newCart] = await pool.execute(
        'SELECT * FROM shopping_cart WHERE cart_id = ?',
        [(result as any).insertId]
      );
      cart = (newCart as any[])[0];
    }

    const [items] = await pool.execute(
      `SELECT i.*, c.title, c.description, c.price, c.image_url, c.status as catalog_status,
              v.store_name, v.location as vendor_location
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE i.cart_id = ?`,
      [cart.cart_id]
    );

    let total = 0;
    (items as any[]).forEach((item: any) => {
      total += parseFloat(item.price) * item.quantity;
    });

    res.json({
      success: true,
      data: {
        cart,
        items,
        total: total.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── ADD ITEM TO CART ─────────────────────────

export const addToCart = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;
    const { catalog_id, quantity = 1 } = req.body as AddToCart;

    if (!catalog_id) {
      return res.status(400).json({
        success: false,
        message: 'catalog_id is required'
      });
    }

    const [catalogItems] = await pool.execute(
      'SELECT * FROM catalog WHERE catalog_id = ? AND status = "active"',
      [catalog_id]
    );

    if ((catalogItems as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or not available'
      });
    }

    let [carts] = await pool.execute(
      'SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"',
      [clientId]
    );

    let cart = (carts as any[])[0];
    if (!cart) {
      const [result] = await pool.execute(
        'INSERT INTO shopping_cart (client_id, status) VALUES (?, "active")',
        [clientId]
      );
      const [newCart] = await pool.execute(
        'SELECT * FROM shopping_cart WHERE cart_id = ?',
        [(result as any).insertId]
      );
      cart = (newCart as any[])[0];
    }

    const [existing] = await pool.execute(
      'SELECT * FROM items WHERE cart_id = ? AND catalog_id = ?',
      [cart.cart_id, catalog_id]
    );

    if ((existing as any[]).length > 0) {
      await pool.execute(
        'UPDATE items SET quantity = quantity + ? WHERE cart_id = ? AND catalog_id = ?',
        [quantity, cart.cart_id, catalog_id]
      );
    } else {
      await pool.execute(
        'INSERT INTO items (cart_id, catalog_id, quantity) VALUES (?, ?, ?)',
        [cart.cart_id, catalog_id, quantity]
      );
    }

    const [updatedItems] = await pool.execute(
      `SELECT i.*, c.title, c.price, c.image_url
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       WHERE i.cart_id = ?`,
      [cart.cart_id]
    );

    res.json({
      success: true,
      message: 'Item added to cart!',
      data: {
        cart_id: cart.cart_id,
        items: updatedItems
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── UPDATE CART ITEM QUANTITY ───────────────

export const updateCartItem = async (req: any, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    const { quantity } = req.body as UpdateCartItem;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const [items] = await pool.execute(
      `SELECT i.*, sc.client_id 
       FROM items i
       JOIN shopping_cart sc ON i.cart_id = sc.cart_id
       WHERE i.item_id = ? AND sc.client_id = ?`,
      [itemId, req.client.clientId]
    );

    if ((items as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart'
      });
    }

    await pool.execute(
      'UPDATE items SET quantity = ? WHERE item_id = ?',
      [quantity, itemId]
    );

    res.json({
      success: true,
      message: 'Cart updated successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── REMOVE ITEM FROM CART ────────────────────

export const removeCartItem = async (req: any, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);

    const [items] = await pool.execute(
      `SELECT i.*, sc.client_id 
       FROM items i
       JOIN shopping_cart sc ON i.cart_id = sc.cart_id
       WHERE i.item_id = ? AND sc.client_id = ?`,
      [itemId, req.client.clientId]
    );

    if ((items as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart'
      });
    }

    await pool.execute(
      'DELETE FROM items WHERE item_id = ?',
      [itemId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};