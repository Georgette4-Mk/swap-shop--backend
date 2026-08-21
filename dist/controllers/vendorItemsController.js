"use strict";
// ============================================================
// VENDOR ITEMS CONTROLLER
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCatalogItem = exports.updateCatalogItem = exports.createCatalogItem = exports.getVendorItems = void 0;
const database_1 = require("../config/database");
// ─── GET VENDOR'S ITEMS ──────────────────────
const getVendorItems = async (req, res) => {
    try {
        const vendorId = req.vendor.vendorId;
        const [rows] = await database_1.pool.execute(`SELECT c.*, cat.name as category_name
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       WHERE c.vendor_id = ?
       ORDER BY c.date_posted DESC`, [vendorId]);
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your items',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getVendorItems = getVendorItems;
// ─── CREATE CATALOG ITEM ─────────────────────
const createCatalogItem = async (req, res) => {
    try {
        const vendorId = req.vendor.vendorId;
        const { title, description, price, category_id, image_url } = req.body;
        if (!title || !price || !category_id) {
            return res.status(400).json({
                success: false,
                message: 'Title, price, and category are required'
            });
        }
        const [category] = await database_1.pool.execute('SELECT * FROM category WHERE category_id = ?', [category_id]);
        if (category.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }
        const [result] = await database_1.pool.execute(`INSERT INTO catalog 
       (vendor_id, category_id, title, description, price, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`, [vendorId, category_id, title, description || null, price, image_url || null]);
        const [newItem] = await database_1.pool.execute(`SELECT c.*, cat.name as category_name 
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       WHERE c.catalog_id = ?`, [result.insertId]);
        res.status(201).json({
            success: true,
            message: 'Item listed successfully!',
            data: newItem[0]
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create item',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createCatalogItem = createCatalogItem;
// ─── UPDATE CATALOG ITEM ─────────────────────
const updateCatalogItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, description, price, category_id, status } = req.body;
        const fields = [];
        const values = [];
        if (title !== undefined) {
            fields.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (price !== undefined) {
            fields.push('price = ?');
            values.push(price);
        }
        if (category_id !== undefined) {
            fields.push('category_id = ?');
            values.push(category_id);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            values.push(status);
        }
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE catalog SET ${fields.join(', ')} WHERE catalog_id = ?`, values);
        const [updated] = await database_1.pool.execute(`SELECT c.*, cat.name as category_name 
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       WHERE c.catalog_id = ?`, [id]);
        res.json({
            success: true,
            message: 'Item updated successfully!',
            data: updated[0]
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update item',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateCatalogItem = updateCatalogItem;
// ─── DELETE CATALOG ITEM ─────────────────────
const deleteCatalogItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await database_1.pool.execute('DELETE FROM items WHERE catalog_id = ?', [id]);
        await database_1.pool.execute('DELETE FROM catalog WHERE catalog_id = ?', [id]);
        res.json({
            success: true,
            message: 'Item deleted successfully!'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete item',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteCatalogItem = deleteCatalogItem;
