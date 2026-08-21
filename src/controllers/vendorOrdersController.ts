// ============================================================
// VENDOR ORDERS CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';

// ─── GET ORDERS RECEIVED ─────────────────────

export const getVendorOrders = async (req: any, res: Response) => {
  try {
    const vendorId = req.vendor.vendorId;

    const [rows] = await pool.execute(
      `SELECT p.payment_id, p.transaction_date, p.amount, p.method,
              i.item_id, i.quantity, c.title, c.price,
              cl.client_id, cl.full_name as buyer_name, cl.whatsapp_contact as buyer_contact
       FROM payment p
       JOIN shopping_cart sc ON p.cart_id = sc.cart_id
       JOIN items i ON sc.cart_id = i.cart_id
       JOIN catalog c ON i.catalog_id = c.catalog_id
       JOIN client cl ON p.client_id = cl.client_id
       WHERE c.vendor_id = ?
       ORDER BY p.transaction_date DESC`, 
      [vendorId]
    );

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};