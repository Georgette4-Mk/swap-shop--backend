// ============================================================
// PAYMENT CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';
import { PaymentCreate } from '../types';

// ─── CHECKOUT / PROCESS PAYMENT ──────────────

export const checkout = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;
    const { payment_method } = req.body as PaymentCreate;

    const [carts] = await pool.execute(
      'SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"',
      [clientId]
    );

    const cart = (carts as any[])[0];
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No active cart found'
      });
    }

    const [items] = await pool.execute(
      `SELECT i.*, c.price, c.vendor_id
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       WHERE i.cart_id = ?`,
      [cart.cart_id]
    );

    if ((items as any[]).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    let total = 0;
    (items as any[]).forEach((item: any) => {
      total += parseFloat(item.price) * item.quantity;
    });

    const [result] = await pool.execute(
      `INSERT INTO payment 
       (client_id, cart_id, amount, method) 
       VALUES (?, ?, ?, ?)`,
      [clientId, cart.cart_id, total, payment_method || 'cash']
    );

    await pool.execute(
      'UPDATE shopping_cart SET status = "checked_out" WHERE cart_id = ?',
      [cart.cart_id]
    );

    for (const item of items as any[]) {
      await pool.execute(
        'UPDATE catalog SET status = "sold" WHERE catalog_id = ?',
        [item.catalog_id]
      );
    }

    const [payment] = await pool.execute(
      'SELECT * FROM payment WHERE payment_id = ?',
      [(result as any).insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Payment successful! Order confirmed.',
      data: {
        payment: (payment as any[])[0],
        items: items,
        total: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── GET PAYMENT HISTORY ─────────────────────

export const getPaymentHistory = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.execute(
      `SELECT p.*, COUNT(i.item_id) as item_count
       FROM payment p
       LEFT JOIN shopping_cart sc ON p.cart_id = sc.cart_id
       LEFT JOIN items i ON sc.cart_id = i.cart_id
       WHERE p.client_id = ?
       GROUP BY p.payment_id
       ORDER BY p.transaction_date DESC`,
      [clientId]
    );

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── GET PAYMENT DETAILS ─────────────────────

export const getPaymentDetails = async (req: any, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    const clientId = req.client.clientId;

    const [rows] = await pool.execute(
      `SELECT p.*
       FROM payment p
       WHERE p.payment_id = ? AND p.client_id = ?`,
      [paymentId, clientId]
    );

    const payment = (rows as any[])[0];
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const [items] = await pool.execute(
      `SELECT i.*, c.title, c.price, c.image_url, v.store_name
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE i.cart_id = ?`,
      [payment.cart_id]
    );

    res.json({
      success: true,
      data: {
        payment,
        items
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};