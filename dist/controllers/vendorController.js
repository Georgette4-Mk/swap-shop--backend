"use strict";
// ============================================================
// VENDOR CONTROLLER (Seller)
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorProfile = exports.getVendorProfile = exports.loginVendor = exports.registerVendor = void 0;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
// ─── REGISTER VENDOR ──────────────────────────
const registerVendor = async (req, res) => {
    try {
        const { store_name, email, password, whatsapp_contact, location } = req.body;
        if (!store_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Store name, email, and password are required'
            });
        }
        const [existing] = await database_1.pool.execute('SELECT * FROM vendor WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }
        const [existingClient] = await database_1.pool.execute('SELECT * FROM client WHERE email = ?', [email]);
        if (existingClient.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered as a client. Please use a different email.'
            });
        }
        const hashedPassword = await argon2_1.default.hash(password);
        const [result] = await database_1.pool.execute(`INSERT INTO vendor (store_name, email, password_hash, whatsapp_contact, location) 
       VALUES (?, ?, ?, ?, ?)`, [store_name, email, hashedPassword, whatsapp_contact || null, location || null]);
        const [newVendor] = await database_1.pool.execute('SELECT vendor_id, store_name, email, whatsapp_contact, location, is_verified, created_at FROM vendor WHERE vendor_id = ?', [result.insertId]);
        const secret = process.env.JWT_SECRET || 'default_secret';
        const token = jsonwebtoken_1.default.sign({ vendorId: newVendor[0].vendor_id, email, role: 'vendor' }, secret, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'Vendor registered successfully!',
            data: {
                vendor: newVendor[0],
                token,
                role: 'vendor'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.registerVendor = registerVendor;
// ─── LOGIN VENDOR ─────────────────────────────
const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const [rows] = await database_1.pool.execute('SELECT * FROM vendor WHERE email = ?', [email]);
        const vendor = rows[0];
        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const isPasswordValid = await argon2_1.default.verify(vendor.password_hash, password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const secret = process.env.JWT_SECRET || 'default_secret';
        const token = jsonwebtoken_1.default.sign({ vendorId: vendor.vendor_id, email: vendor.email, role: 'vendor' }, secret, { expiresIn: '7d' });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.loginVendor = loginVendor;
// ─── GET VENDOR PROFILE ───────────────────────
const getVendorProfile = async (req, res) => {
    try {
        const vendorId = req.vendor.vendorId;
        const [rows] = await database_1.pool.execute('SELECT vendor_id, store_name, email, whatsapp_contact, location, is_verified, created_at FROM vendor WHERE vendor_id = ?', [vendorId]);
        const vendor = rows[0];
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getVendorProfile = getVendorProfile;
// ─── UPDATE VENDOR PROFILE ────────────────────
const updateVendorProfile = async (req, res) => {
    try {
        const vendorId = req.vendor.vendorId;
        const { store_name, whatsapp_contact, location } = req.body;
        const fields = [];
        const values = [];
        if (store_name !== undefined) {
            fields.push('store_name = ?');
            values.push(store_name);
        }
        if (whatsapp_contact !== undefined) {
            fields.push('whatsapp_contact = ?');
            values.push(whatsapp_contact);
        }
        if (location !== undefined) {
            fields.push('location = ?');
            values.push(location);
        }
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        values.push(vendorId);
        await database_1.pool.execute(`UPDATE vendor SET ${fields.join(', ')} WHERE vendor_id = ?`, values);
        const [updated] = await database_1.pool.execute('SELECT vendor_id, store_name, email, whatsapp_contact, location, is_verified, created_at FROM vendor WHERE vendor_id = ?', [vendorId]);
        res.json({
            success: true,
            message: 'Vendor profile updated successfully!',
            data: updated[0]
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update vendor profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateVendorProfile = updateVendorProfile;
