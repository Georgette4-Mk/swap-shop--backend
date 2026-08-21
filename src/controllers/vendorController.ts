// ============================================================
// VENDOR CONTROLLER (Seller)
// ============================================================

import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { VendorRegistration, VendorLogin, VendorUpdate } from '../types';

// ─── REGISTER VENDOR ──────────────────────────

export const registerVendor = async (req: Request, res: Response) => {
  try {
    const { store_name, email, password, whatsapp_contact, location } = req.body as VendorRegistration;

    if (!store_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Store name, email, and password are required'
      });
    }

    const [existing] = await pool.execute(
      'SELECT * FROM vendor WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vendor with this email already exists'
      });
    }

    const [existingClient] = await pool.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    if ((existingClient as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a client. Please use a different email.'
      });
    }

    const hashedPassword = await argon2.hash(password);

    const [result] = await pool.execute(
      `INSERT INTO vendor (store_name, email, password_hash, whatsapp_contact, location) 
       VALUES (?, ?, ?, ?, ?)`,
      [store_name, email, hashedPassword, whatsapp_contact || null, location || null]
    );

    const [newVendor] = await pool.execute(
      'SELECT vendor_id, store_name, email, whatsapp_contact, location, is_verified, created_at FROM vendor WHERE vendor_id = ?',
      [(result as any).insertId]
    );

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { vendorId: (newVendor as any[])[0].vendor_id, email, role: 'vendor' },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully!',
      data: {
        vendor: (newVendor as any[])[0],
        token,
        role: 'vendor'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── LOGIN VENDOR ─────────────────────────────

export const loginVendor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as VendorLogin;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM vendor WHERE email = ?',
      [email]
    );

    const vendor = (rows as any[])[0];
    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await argon2.verify(vendor.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { vendorId: vendor.vendor_id, email: vendor.email, role: 'vendor' },
      secret,
      { expiresIn: '7d' }
    );

    const { password_hash, ...vendorWithoutPassword } = vendor;

    res.json({
      success: true,
      message: 'Vendor login successful!',
      data: {
        vendor: vendorWithoutPassword,
        token,
        role: 'vendor'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── GET VENDOR PROFILE ───────────────────────

export const getVendorProfile = async (req: any, res: Response) => {
  try {
    const vendorId = req.vendor.vendorId;

    const [rows] = await pool.execute(
      'SELECT vendor_id, store_name, email, whatsapp_contact, location, is_verified, created_at FROM vendor WHERE vendor_id = ?',
      [vendorId]
    );

    const vendor = (rows as any[])[0];
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── UPDATE VENDOR PROFILE ────────────────────

export const updateVendorProfile = async (req: any, res: Response) => {
  try {
    const vendorId = req.vendor.vendorId;
    const { store_name, whatsapp_contact, location } = req.body as VendorUpdate;

    const fields: string[] = [];
    const values: any[] = [];

    if (store_name !== undefined) { fields.push('store_name = ?'); values.push(store_name); }
    if (whatsapp_contact !== undefined) { fields.push('whatsapp_contact = ?'); values.push(whatsapp_contact); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(vendorId);
    await pool.execute(
      `UPDATE vendor SET ${fields.join(', ')} WHERE vendor_id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT vendor_id, store_name, email, whatsapp_contact, location, is_verified, created_at FROM vendor WHERE vendor_id = ?',
      [vendorId]
    );

    res.json({
      success: true,
      message: 'Vendor profile updated successfully!',
      data: (updated as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};