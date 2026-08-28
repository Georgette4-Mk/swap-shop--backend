"use strict";
// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVendorAuth = exports.requireClientAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireClientAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Please login.'
        });
    }
    const secret = process.env.JWT_SECRET || 'default_secret';
    jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
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
exports.requireClientAuth = requireClientAuth;
const requireVendorAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Please login.'
        });
    }
    const secret = process.env.JWT_SECRET || 'default_secret';
    jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
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
exports.requireVendorAuth = requireVendorAuth;
