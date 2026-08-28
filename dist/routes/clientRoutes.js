"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const clientController_1 = require("../controllers/clientController");
const cartController_1 = require("../controllers/cartController");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/client/register:
 *   post:
 *     summary: Register a new client (buyer)
 *     description: Creates a new client account and returns a JWT token
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientRegistration'
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
 *         description: Missing required fields or email already exists
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
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientLogin'
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
 *       500:
 *         description: Server error
 */
router.post('/login', clientController_1.loginClient);
/**
 * @swagger
 * /api/client/me:
 *   get:
 *     summary: Get client profile
 *     description: Returns the authenticated client's profile
 *     tags: [Client]
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
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.get('/me', auth_1.requireClientAuth, clientController_1.getClientProfile);
/**
 * @swagger
 * /api/client/me:
 *   put:
 *     summary: Update client profile
 *     description: Updates the authenticated client's profile
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               whatsapp_contact:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.put('/me', auth_1.requireClientAuth, clientController_1.updateClientProfile);
/**
 * @swagger
 * /api/client/cart:
 *   get:
 *     summary: Get client's cart
 *     description: Returns the authenticated client's active shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shopping cart
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
 *                     cart:
 *                       type: object
 *                     items:
 *                       type: array
 *                     total:
 *                       type: string
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.get('/cart', auth_1.requireClientAuth, cartController_1.getClientCart);
/**
 * @swagger
 * /api/client/cart/items:
 *   post:
 *     summary: Add item to cart
 *     description: Adds a catalog item to the client's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCart'
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Missing catalog_id
 *       404:
 *         description: Item not found or not available
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.post('/cart/items', auth_1.requireClientAuth, cartController_1.addToCart);
/**
 * @swagger
 * /api/client/cart/items/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     description: Updates the quantity of a specific item in the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItem'
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       400:
 *         description: Invalid quantity
 *       404:
 *         description: Item not found in cart
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.put('/cart/items/:id', auth_1.requireClientAuth, cartController_1.updateCartItem);
/**
 * @swagger
 * /api/client/cart/items/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Removes a specific item from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Item not found in cart
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.delete('/cart/items/:id', auth_1.requireClientAuth, cartController_1.removeCartItem);
/**
 * @swagger
 * /api/client/payments/checkout:
 *   post:
 *     summary: Checkout and process payment
 *     description: Processes the payment for the client's active cart
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentCreate'
 *     responses:
 *       201:
 *         description: Payment successful
 *       400:
 *         description: Cart is empty
 *       404:
 *         description: No active cart found
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.post('/payments/checkout', auth_1.requireClientAuth, paymentController_1.checkout);
/**
 * @swagger
 * /api/client/payments:
 *   get:
 *     summary: Get payment history
 *     description: Returns the client's payment history
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.get('/payments', auth_1.requireClientAuth, paymentController_1.getPaymentHistory);
/**
 * @swagger
 * /api/client/payments/{id}:
 *   get:
 *     summary: Get payment details
 *     description: Returns details of a specific payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.get('/payments/:id', auth_1.requireClientAuth, paymentController_1.getPaymentDetails);
exports.default = router;
