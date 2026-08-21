"use strict";
// ============================================================
// PAYMENT CONTROLLER
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentDetails = exports.getPaymentHistory = exports.checkout = void 0;
const database_1 = require("../config/database");
// ─── CHECKOUT / PROCESS PAYMENT ──────────────
const checkout = async (req, res) => {
    try {
        const clientId = req.client.clientId;
        const { payment_method } = req.body;
        const [carts] = await database_1.pool.execute('SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"', [clientId]);
        const cart = carts[0];
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'No active cart found'
            });
        }
        const [items] = await database_1.pool.execute(`SELECT i.*, c.price, c.vendor_id
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       WHERE i.cart_id = ?`, [cart.cart_id]);
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }
        let total = 0;
        items.forEach((item) => {
            total += parseFloat(item.price) * item.quantity;
        });
        const [result] = await database_1.pool.execute(`INSERT INTO payment 
       (client_id, cart_id, amount, method) 
       VALUES (?, ?, ?, ?)`, [clientId, cart.cart_id, total, payment_method || 'cash']);
        await database_1.pool.execute('UPDATE shopping_cart SET status = "checked_out" WHERE cart_id = ?', [cart.cart_id]);
        for (const item of items) {
            await database_1.pool.execute('UPDATE catalog SET status = "sold" WHERE catalog_id = ?', [item.catalog_id]);
        }
        const [payment] = await database_1.pool.execute('SELECT * FROM payment WHERE payment_id = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            message: 'Payment successful! Order confirmed.',
            data: {
                payment: payment[0],
                items: items,
                total: total
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Payment failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.checkout = checkout;
// ─── GET PAYMENT HISTORY ─────────────────────
const getPaymentHistory = async (req, res) => {
    try {
        const clientId = req.client.clientId;
        const [rows] = await database_1.pool.execute(`SELECT p.*, COUNT(i.item_id) as item_count
       FROM payment p
       LEFT JOIN shopping_cart sc ON p.cart_id = sc.cart_id
       LEFT JOIN items i ON sc.cart_id = i.cart_id
       WHERE p.client_id = ?
       GROUP BY p.payment_id
       ORDER BY p.transaction_date DESC`, [clientId]);
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getPaymentHistory = getPaymentHistory;
// ─── GET PAYMENT DETAILS ─────────────────────
const getPaymentDetails = async (req, res) => {
    try {
        const paymentId = parseInt(req.params.id);
        const clientId = req.client.clientId;
        const [rows] = await database_1.pool.execute(`SELECT p.*
       FROM payment p
       WHERE p.payment_id = ? AND p.client_id = ?`, [paymentId, clientId]);
        const payment = rows[0];
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        const [items] = await database_1.pool.execute(`SELECT i.*, c.title, c.price, c.image_url, v.store_name
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE i.cart_id = ?`, [payment.cart_id]);
        res.json({
            success: true,
            data: {
                payment,
                items
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getPaymentDetails = getPaymentDetails;
