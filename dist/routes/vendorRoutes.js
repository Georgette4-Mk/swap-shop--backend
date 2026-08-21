"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const ownership_1 = require("../middlewares/ownership");
const vendorController_1 = require("../controllers/vendorController");
const vendorItemsController_1 = require("../controllers/vendorItemsController");
const vendorOrdersController_1 = require("../controllers/vendorOrdersController");
const router = (0, express_1.Router)();
// Auth (No auth required)
router.post('/register', vendorController_1.registerVendor);
router.post('/login', vendorController_1.loginVendor);
// Profile (Auth required)
router.get('/me', auth_1.requireVendorAuth, vendorController_1.getVendorProfile);
router.put('/me', auth_1.requireVendorAuth, vendorController_1.updateVendorProfile);
// Items (Auth required)
router.get('/items', auth_1.requireVendorAuth, vendorItemsController_1.getVendorItems);
router.post('/items', auth_1.requireVendorAuth, vendorItemsController_1.createCatalogItem);
router.put('/items/:id', auth_1.requireVendorAuth, ownership_1.checkCatalogOwnership, vendorItemsController_1.updateCatalogItem);
router.delete('/items/:id', auth_1.requireVendorAuth, ownership_1.checkCatalogOwnership, vendorItemsController_1.deleteCatalogItem);
// Orders (Auth required)
router.get('/orders', auth_1.requireVendorAuth, vendorOrdersController_1.getVendorOrders);
exports.default = router;
