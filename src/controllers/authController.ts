// ============================================================
// AUTH CONTROLLER (Forgot & Reset Password)
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../config/database';
import argon2 from 'argon2';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// ─── EMAIL TRANSPORTER ────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── FORGOT PASSWORD ──────────────────────────

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists (client or vendor)
    const [clientRows] = await pool.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    const [vendorRows] = await pool.execute(
      'SELECT * FROM vendor WHERE email = ?',
      [email]
    );

    const user = (clientRows as any[])[0] || (vendorRows as any[])[0];
    const table = (clientRows as any[])[0] ? 'client' : 'vendor';

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await pool.execute(
      `UPDATE ${table} SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&role=${table}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset Request - Swap Shop',
      html: `
        <h1>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ─── RESET PASSWORD ────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, role } = req.body;

    if (!token || !newPassword || !role) {
      return res.status(400).json({
        success: false,
        message: 'Token, new password, and role are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const table = role === 'client' ? 'client' : 'vendor';
    const idColumn = role === 'client' ? 'client_id' : 'vendor_id';

    // Find user with valid token
    const [rows] = await pool.execute(
      `SELECT * FROM ${table} WHERE reset_token = ? AND reset_token_expiry > NOW()`,
      [token]
    );

    const user = (rows as any[])[0];
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword);

    // Update password and clear reset token
    await pool.execute(
      `UPDATE ${table} SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE ${idColumn} = ?`,
      [hashedPassword, user[idColumn]]
    );

    res.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};