"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check server health
 *     description: Returns the status of the server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});
/**
 * @swagger
 * /api/test-db:
 *   get:
 *     summary: Test database connection
 *     description: Checks if the database is connected
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 */
router.get('/test-db', async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT 1 + 1 AS result');
        res.json({
            success: true,
            message: 'Database connected successfully!',
            data: rows
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Returns a list of all product categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT * FROM category ORDER BY name');
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/catalog:
 *   get:
 *     summary: Browse catalog
 *     description: Get all catalog items with optional filters
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by keyword in title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, sold]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of catalog items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/catalog', async (req, res) => {
    try {
        const { category, q, status } = req.query;
        let query = `
      SELECT c.*, cat.name as category_name, v.store_name, v.location as vendor_location
      FROM catalog c
      LEFT JOIN category cat ON c.category_id = cat.category_id
      LEFT JOIN vendor v ON c.vendor_id = v.vendor_id
      WHERE 1=1
    `;
        const params = [];
        if (category) {
            query += ' AND c.category_id = ?';
            params.push(category);
        }
        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }
        if (q) {
            query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
            const searchPattern = `%${q}%`;
            params.push(searchPattern, searchPattern);
        }
        query += ' ORDER BY c.date_posted DESC';
        const [rows] = await database_1.pool.execute(query, params);
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch catalog',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/catalog/{id}:
 *   get:
 *     summary: Get single catalog item
 *     description: Returns details of a specific catalog item
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.get('/catalog/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await database_1.pool.execute(`SELECT c.*, cat.name as category_name, v.store_name, v.location as vendor_location,
              v.whatsapp_contact as vendor_whatsapp
       FROM catalog c
       LEFT JOIN category cat ON c.category_id = cat.category_id
       LEFT JOIN vendor v ON c.vendor_id = v.vendor_id
       WHERE c.catalog_id = ?`, [id]);
        const item = rows[0];
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }
        res.json({
            success: true,
            data: item
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch item',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * @swagger
 * /api/vendor/{id}:
 *   get:
 *     summary: Get vendor public profile
 *     description: Returns public information about a vendor
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vendor_id:
 *                       type: integer
 *                     store_name:
 *                       type: string
 *                     location:
 *                       type: string
 *                     whatsapp_contact:
 *                       type: string
 *                     is_verified:
 *                       type: boolean
 *                     total_items:
 *                       type: integer
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/vendor/:id', async (req, res) => {
    try {
        const vendorId = parseInt(req.params.id);
        const [rows] = await database_1.pool.execute(`SELECT vendor_id, store_name, location, whatsapp_contact, is_verified, created_at
       FROM vendor
       WHERE vendor_id = ?`, [vendorId]);
        const vendor = rows[0];
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        const [countResult] = await database_1.pool.execute('SELECT COUNT(*) as total_items FROM catalog WHERE vendor_id = ? AND status = "active"', [vendorId]);
        res.json({
            success: true,
            data: {
                ...vendor,
                total_items: countResult[0].total_items
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
