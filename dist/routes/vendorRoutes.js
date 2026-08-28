"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const ownership_1 = require("../middlewares/ownership");
const vendorController_1 = require("../controllers/vendorController");
const vendorItemsController_1 = require("../controllers/vendorItemsController");
const vendorOrdersController_1 = require("../controllers/vendorOrdersController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/vendor/register:
 *   post:
 *     summary: Register a new vendor (seller)
 *     description: Creates a new vendor account and returns a JWT token
 *     tags: [Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VendorRegistration'
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *       400:
 *         description: Missing required fields or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', vendorController_1.registerVendor);
/**
 * @swagger
 * /api/vendor/login:
 *   post:
 *     summary: Login as a vendor (seller)
 *     description: Authenticates a vendor and returns a JWT token
 *     tags: [Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VendorLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', vendorController_1.loginVendor);
/**
 * @swagger
 * /api/vendor/me:
 *   get:
 *     summary: Get vendor profile
 *     description: Returns the authenticated vendor's profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/me', auth_1.requireVendorAuth, vendorController_1.getVendorProfile);
/**
 * @swagger
 * /api/vendor/me:
 *   put:
 *     summary: Update vendor profile
 *     description: Updates the authenticated vendor's profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               store_name:
 *                 type: string
 *               whatsapp_contact:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor profile updated
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.put('/me', auth_1.requireVendorAuth, vendorController_1.updateVendorProfile);
/**
 * @swagger
 * /api/vendor/items:
 *   get:
 *     summary: Get vendor's items
 *     description: Returns all items listed by the authenticated vendor
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendor's items
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.get('/items', auth_1.requireVendorAuth, vendorItemsController_1.getVendorItems);
/**
 * @swagger
 * /api/vendor/items:
 *   post:
 *     summary: Create a new catalog item
 *     description: Creates a new item listing for the vendor
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CatalogCreate'
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Missing required fields or invalid category
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.post('/items', auth_1.requireVendorAuth, vendorItemsController_1.createCatalogItem);
/**
 * @swagger
 * /api/vendor/items/{id}:
 *   put:
 *     summary: Update a catalog item
 *     description: Updates an existing item listing (vendor must own it)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category_id:
 *                 type: integer
 *               image_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, pending, sold]
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       403:
 *         description: Not authorized to edit this item
 *       404:
 *         description: Item not found
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.put('/items/:id', auth_1.requireVendorAuth, ownership_1.checkCatalogOwnership, vendorItemsController_1.updateCatalogItem);
/**
 * @swagger
 * /api/vendor/items/{id}:
 *   delete:
 *     summary: Delete a catalog item
 *     description: Deletes an item listing (vendor must own it)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       403:
 *         description: Not authorized to delete this item
 *       404:
 *         description: Item not found
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.delete('/items/:id', auth_1.requireVendorAuth, ownership_1.checkCatalogOwnership, vendorItemsController_1.deleteCatalogItem);
/**
 * @swagger
 * /api/vendor/orders:
 *   get:
 *     summary: Get orders received
 *     description: Returns orders received for the vendor's items
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders received
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
router.get('/orders', auth_1.requireVendorAuth, vendorOrdersController_1.getVendorOrders);
exports.default = router;
