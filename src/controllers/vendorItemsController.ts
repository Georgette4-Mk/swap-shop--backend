// ============================================================
// VENDOR ITEMS CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';

// ─── GET VENDOR'S ITEMS ──────────────────────

export const getVendorItems = async (req: any, res: Response) => {
  try {
    const vendorId = req.vendor.vendorId;

    const [rows] = await pool.execute(
      `SELECT c.*, cat.name as category_name
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       WHERE c.vendor_id = ?
       ORDER BY c.date_posted DESC`,
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
      message: 'Failed to fetch your items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── CREATE CATALOG ITEM ─────────────────────

export const createCatalogItem = async (req: any, res: Response) => {
  try {
    const vendorId = req.vendor.vendorId;
    const { title, description, price, category_id, image_url } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, price, and category are required'
      });
    }

    const [category] = await pool.execute(
      'SELECT * FROM category WHERE category_id = ?',
      [category_id]
    );

    if ((category as any[]).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO catalog 
       (vendor_id, category_id, title, description, price, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vendorId, category_id, title, description || null, price, image_url || null]
    );

    const [newItem] = await pool.execute(
      `SELECT c.*, cat.name as category_name 
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       WHERE c.catalog_id = ?`,
      [(result as any).insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Item listed successfully!',
      data: (newItem as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── UPDATE CATALOG ITEM ─────────────────────

export const updateCatalogItem = async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, price, category_id, status } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    await pool.execute(
      `UPDATE catalog SET ${fields.join(', ')} WHERE catalog_id = ?`,
      values
    );

    const [updated] = await pool.execute(
      `SELECT c.*, cat.name as category_name 
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       WHERE c.catalog_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Item updated successfully!',
      data: (updated as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── DELETE CATALOG ITEM ─────────────────────

export const deleteCatalogItem = async (req: any, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    await pool.execute(
      'DELETE FROM items WHERE catalog_id = ?',
      [id]
    );

    await pool.execute(
      'DELETE FROM catalog WHERE catalog_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Item deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};