"use strict";
// ============================================================
// CLIENT CONTROLLER (Buyer)
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientProfile = exports.getClientProfile = exports.loginClient = exports.registerClient = void 0;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
// ─── REGISTER CLIENT ──────────────────────────
const registerClient = async (req, res) => {
    try {
        const { full_name, email, password, whatsapp_contact, location } = req.body;
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, and password are required'
            });
        }
        const [existing] = await database_1.pool.execute('SELECT * FROM client WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Client with this email already exists'
            });
        }
        const [existingVendor] = await database_1.pool.execute('SELECT * FROM vendor WHERE email = ?', [email]);
        if (existingVendor.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered as a vendor. Please use a different email.'
            });
        }
        const hashedPassword = await argon2_1.default.hash(password);
        const [result] = await database_1.pool.execute(`INSERT INTO client (full_name, email, password_hash, whatsapp_contact, location) 
       VALUES (?, ?, ?, ?, ?)`, [full_name, email, hashedPassword, whatsapp_contact || null, location || null]);
        const [newClient] = await database_1.pool.execute('SELECT client_id, full_name, email, whatsapp_contact, location, created_at FROM client WHERE client_id = ?', [result.insertId]);
        const secret = process.env.JWT_SECRET || 'default_secret';
        const token = jsonwebtoken_1.default.sign({ clientId: newClient[0].client_id, email, role: 'client' }, secret, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'Client registered successfully!',
            data: {
                client: newClient[0],
                token,
                role: 'client'
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
exports.registerClient = registerClient;
// ─── LOGIN CLIENT ─────────────────────────────
const loginClient = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const [rows] = await database_1.pool.execute('SELECT * FROM client WHERE email = ?', [email]);
        const client = rows[0];
        if (!client) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const isPasswordValid = await argon2_1.default.verify(client.password_hash, password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const secret = process.env.JWT_SECRET || 'default_secret';
        const token = jsonwebtoken_1.default.sign({ clientId: client.client_id, email: client.email, role: 'client' }, secret, { expiresIn: '7d' });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.loginClient = loginClient;
// ─── GET CLIENT PROFILE ───────────────────────
const getClientProfile = async (req, res) => {
    try {
        const clientId = req.client.clientId;
        const [rows] = await database_1.pool.execute('SELECT client_id, full_name, email, whatsapp_contact, location, is_admin, created_at FROM client WHERE client_id = ?', [clientId]);
        const client = rows[0];
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getClientProfile = getClientProfile;
// ─── UPDATE CLIENT PROFILE ────────────────────
const updateClientProfile = async (req, res) => {
    try {
        const clientId = req.client.clientId;
        const { full_name, whatsapp_contact, location } = req.body;
        const fields = [];
        const values = [];
        if (full_name !== undefined) {
            fields.push('full_name = ?');
            values.push(full_name);
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
        values.push(clientId);
        await database_1.pool.execute(`UPDATE client SET ${fields.join(', ')} WHERE client_id = ?`, values);
        const [updated] = await database_1.pool.execute('SELECT client_id, full_name, email, whatsapp_contact, location, is_admin, created_at FROM client WHERE client_id = ?', [clientId]);
        res.json({
            success: true,
            message: 'Profile updated successfully!',
            data: updated[0]
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateClientProfile = updateClientProfile;
