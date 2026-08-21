// ============================================================
// CATALOG CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';

// ─── GET ALL CATEGORIES ───────────────────────

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM category ORDER BY name');
    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── GET ALL CATALOG ITEMS (Public) ──────────

export const getCatalogItems = async (req: Request, res: Response) => {
  try {
    const { category, q, status } = req.query;

    let query = `
      SELECT c.*, cat.name as category_name, v.store_name, v.location as vendor_location
      FROM catalog c
      LEFT JOIN category cat ON c.category_id = cat.category_id
      LEFT JOIN vendor v ON c.vendor_id = v.vendor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND c.category_id = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (q) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY c.date_posted DESC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── GET SINGLE CATALOG ITEM ─────────────────

export const getCatalogItemById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const [rows] = await pool.execute(
      `SELECT c.*, cat.name as category_name, v.store_name, v.location as vendor_location,
              v.whatsapp_contact as vendor_whatsapp
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       LEFT JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE c.catalog_id = ?`,
      [id]
    );

    const item = (rows as any[])[0];
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── GET VENDOR PUBLIC PROFILE ───────────────

export const getVendorPublicProfile = async (req: Request, res: Response) => {
  try {
    const vendorId = parseInt(req.params.id);

    const [rows] = await pool.execute(
      `SELECT vendor_id, store_name, location, whatsapp_contact, is_verified, created_at
       FROM vendor
       WHERE vendor_id = ?`,
      [vendorId]
    );

    const vendor = (rows as any[])[0];
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total_items FROM catalog WHERE vendor_id = ? AND status = "active"',
      [vendorId]
    );

    res.json({
      success: true,
      data: {
        ...vendor,
        total_items: (countResult as any[])[0].total_items
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};