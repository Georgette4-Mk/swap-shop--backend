"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const clientController_1 = require("../controllers/clientController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/client/register:
 *   post:
 *     summary: Register a new client (buyer)
 *     description: Creates a new client account with a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Alice Johnson"
 *               email:
 *                 type: string
 *                 example: "alice@test.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               whatsapp_contact:
 *                 type: string
 *                 example: "08012345678"
 *               location:
 *                 type: string
 *                 example: "Lagos, Nigeria"
 *     responses:
 *       201:
 *         description: Client registered successfully
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
 *                   type: object
 *                   properties:
 *                     client:
 *                       type: object
 *                     token:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/register', clientController_1.registerClient);
/**
 * @swagger
 * /api/client/login:
 *   post:
 *     summary: Login as a client (buyer)
 *     description: Authenticates a client and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "alice@test.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   type: object
 *                   properties:
 *                     client:
 *                       type: object
 *                     token:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', clientController_1.loginClient);
/**
 * @swagger
 * /api/client/me:
 *   get:
 *     summary: Get client profile
 *     description: Returns the authenticated client's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 */
router.get('/me', auth_1.requireClientAuth, clientController_1.getClientProfile);
// ... other routes
exports.default = router;
