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
 *                 count:
 *                   type: integer
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
exports.default = router;
