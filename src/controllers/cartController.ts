// ============================================================
// CART CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AddToCart, UpdateCartItem } from '../types';

// ─── GET CLIENT CART ──────────────────────────

export const getClientCart = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;

    // Get active cart
    let [carts] = await pool.execute(
      'SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"',
      [clientId]
    );

    let cart = (carts as any[])[0];

    // If no active cart, create one
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

    // Get cart items with product details
    const [items] = await pool.execute(
      `SELECT i.*, c.title, c.description, c.price, c.image_url, c.status as catalog_status,
              v.store_name, v.location as vendor_location
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE i.cart_id = ?`,
      [cart.cart_id]
    );

    // Calculate total
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

    // Check if item exists and is active
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

    // Get or create active cart
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

    // Check if item already in cart
    const [existing] = await pool.execute(
      'SELECT * FROM items WHERE cart_id = ? AND catalog_id = ?',
      [cart.cart_id, catalog_id]
    );

    if ((existing as any[]).length > 0) {
      // Update quantity
      await pool.execute(
        'UPDATE items SET quantity = quantity + ? WHERE cart_id = ? AND catalog_id = ?',
        [quantity, cart.cart_id, catalog_id]
      );
    } else {
      // Add new item
      await pool.execute(
        'INSERT INTO items (cart_id, catalog_id, quantity) VALUES (?, ?, ?)',
        [cart.cart_id, catalog_id, quantity]
      );
    }

    // Get updated cart items
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

    // Check if item belongs to user's cart
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

    // Check if item belongs to user's cart
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