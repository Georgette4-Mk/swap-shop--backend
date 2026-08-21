"use strict";
// ============================================================
// CART CONTROLLER
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCartItem = exports.updateCartItem = exports.addToCart = exports.getClientCart = void 0;
const database_1 = require("../config/database");
// ─── GET CLIENT CART ──────────────────────────
const getClientCart = async (req, res) => {
    try {
        const clientId = req.client.clientId;
        let [carts] = await database_1.pool.execute('SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"', [clientId]);
        let cart = carts[0];
        if (!cart) {
            const [result] = await database_1.pool.execute('INSERT INTO shopping_cart (client_id, status) VALUES (?, "active")', [clientId]);
            const [newCart] = await database_1.pool.execute('SELECT * FROM shopping_cart WHERE cart_id = ?', [result.insertId]);
            cart = newCart[0];
        }
        const [items] = await database_1.pool.execute(`SELECT i.*, c.title, c.description, c.price, c.image_url, c.status as catalog_status,
              v.store_name, v.location as vendor_location
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE i.cart_id = ?`, [cart.cart_id]);
        let total = 0;
        items.forEach((item) => {
            total += parseFloat(item.price) * item.quantity;
        });
        res.json({
            success: true,
            data: {
                cart,
                items,
                total: total.toFixed(2)
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getClientCart = getClientCart;
// ─── ADD ITEM TO CART ─────────────────────────
const addToCart = async (req, res) => {
    try {
        const clientId = req.client.clientId;
        const { catalog_id, quantity = 1 } = req.body;
        if (!catalog_id) {
            return res.status(400).json({
                success: false,
                message: 'catalog_id is required'
            });
        }
        const [catalogItems] = await database_1.pool.execute('SELECT * FROM catalog WHERE catalog_id = ? AND status = "active"', [catalog_id]);
        if (catalogItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found or not available'
            });
        }
        let [carts] = await database_1.pool.execute('SELECT * FROM shopping_cart WHERE client_id = ? AND status = "active"', [clientId]);
        let cart = carts[0];
        if (!cart) {
            const [result] = await database_1.pool.execute('INSERT INTO shopping_cart (client_id, status) VALUES (?, "active")', [clientId]);
            const [newCart] = await database_1.pool.execute('SELECT * FROM shopping_cart WHERE cart_id = ?', [result.insertId]);
            cart = newCart[0];
        }
        const [existing] = await database_1.pool.execute('SELECT * FROM items WHERE cart_id = ? AND catalog_id = ?', [cart.cart_id, catalog_id]);
        if (existing.length > 0) {
            await database_1.pool.execute('UPDATE items SET quantity = quantity + ? WHERE cart_id = ? AND catalog_id = ?', [quantity, cart.cart_id, catalog_id]);
        }
        else {
            await database_1.pool.execute('INSERT INTO items (cart_id, catalog_id, quantity) VALUES (?, ?, ?)', [cart.cart_id, catalog_id, quantity]);
        }
        const [updatedItems] = await database_1.pool.execute(`SELECT i.*, c.title, c.price, c.image_url
       FROM items i
       JOIN catalog c ON i.catalog_id = c.catalog_id
       WHERE i.cart_id = ?`, [cart.cart_id]);
        res.json({
            success: true,
            message: 'Item added to cart!',
            data: {
                cart_id: cart.cart_id,
                items: updatedItems
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.addToCart = addToCart;
// ─── UPDATE CART ITEM QUANTITY ───────────────
const updateCartItem = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        const [items] = await database_1.pool.execute(`SELECT i.*, sc.client_id 
       FROM items i
       JOIN shopping_cart sc ON i.cart_id = sc.cart_id
       WHERE i.item_id = ? AND sc.client_id = ?`, [itemId, req.client.clientId]);
        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in your cart'
            });
        }
        await database_1.pool.execute('UPDATE items SET quantity = ? WHERE item_id = ?', [quantity, itemId]);
        res.json({
            success: true,
            message: 'Cart updated successfully!'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateCartItem = updateCartItem;
// ─── REMOVE ITEM FROM CART ────────────────────
const removeCartItem = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const [items] = await database_1.pool.execute(`SELECT i.*, sc.client_id 
       FROM items i
       JOIN shopping_cart sc ON i.cart_id = sc.cart_id
       WHERE i.item_id = ? AND sc.client_id = ?`, [itemId, req.client.clientId]);
        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in your cart'
            });
        }
        await database_1.pool.execute('DELETE FROM items WHERE item_id = ?', [itemId]);
        res.json({
            success: true,
            message: 'Item removed from cart!'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.removeCartItem = removeCartItem;
