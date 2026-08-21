// ============================================================
// CLIENT CONTROLLER (Buyer)
// ============================================================

import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { ClientRegistration, ClientLogin, ClientUpdate } from '../types';

// ─── REGISTER CLIENT ──────────────────────────

export const registerClient = async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, whatsapp_contact, location } = req.body as ClientRegistration;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    const [existing] = await pool.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const [existingVendor] = await pool.execute(
      'SELECT * FROM vendor WHERE email = ?',
      [email]
    );

    if ((existingVendor as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a vendor. Please use a different email.'
      });
    }

    const hashedPassword = await argon2.hash(password);

    const [result] = await pool.execute(
      `INSERT INTO client (full_name, email, password_hash, whatsapp_contact, location) 
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, hashedPassword, whatsapp_contact || null, location || null]
    );

    const [newClient] = await pool.execute(
      'SELECT client_id, full_name, email, whatsapp_contact, location, created_at FROM client WHERE client_id = ?',
      [(result as any).insertId]
    );

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { clientId: (newClient as any[])[0].client_id, email, role: 'client' },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Client registered successfully!',
      data: {
        client: (newClient as any[])[0],
        token,
        role: 'client'
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

// ─── LOGIN CLIENT ─────────────────────────────

export const loginClient = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as ClientLogin;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    const client = (rows as any[])[0];
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await argon2.verify(client.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { clientId: client.client_id, email: client.email, role: 'client' },
      secret,
      { expiresIn: '7d' }
    );

    const { password_hash, ...clientWithoutPassword } = client;

    res.json({
      success: true,
      message: 'Client login successful!',
      data: {
        client: clientWithoutPassword,
        token,
        role: 'client'
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

// ─── GET CLIENT PROFILE ───────────────────────

export const getClientProfile = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.execute(
      'SELECT client_id, full_name, email, whatsapp_contact, location, created_at FROM client WHERE client_id = ?',
      [clientId]
    );

    const client = (rows as any[])[0];
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── UPDATE CLIENT PROFILE ────────────────────

export const updateClientProfile = async (req: any, res: Response) => {
  try {
    const clientId = req.client.clientId;
    const { full_name, whatsapp_contact, location } = req.body as ClientUpdate;

    const fields: string[] = [];
    const values: any[] = [];

    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (whatsapp_contact !== undefined) { fields.push('whatsapp_contact = ?'); values.push(whatsapp_contact); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(clientId);
    await pool.execute(
      `UPDATE client SET ${fields.join(', ')} WHERE client_id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT client_id, full_name, email, whatsapp_contact, location, created_at FROM client WHERE client_id = ?',
      [clientId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: (updated as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};