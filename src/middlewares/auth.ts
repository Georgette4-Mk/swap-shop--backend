// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// ─── CLIENT AUTH (Buyer) ──────────────────────

export const requireClientAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Please login as a client.'
    });
  }

  const secret = process.env.JWT_SECRET || 'default_secret';
  jwt.verify(token, secret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    if (!decoded.clientId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type. Please login as a client.'
      });
    }

    req.client = decoded;
    next();
  });
};

// ─── VENDOR AUTH (Seller) ──────────────────────

export const requireVendorAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Please login as a vendor.'
    });
  }

  const secret = process.env.JWT_SECRET || 'default_secret';
  jwt.verify(token, secret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    if (!decoded.vendorId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type. Please login as a vendor.'
      });
    }

    req.vendor = decoded;
    next();
  });
};