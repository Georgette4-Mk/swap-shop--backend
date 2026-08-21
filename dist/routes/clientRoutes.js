"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const clientController_1 = require("../controllers/clientController");
const cartController_1 = require("../controllers/cartController");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Auth (No auth required)
router.post('/register', clientController_1.registerClient);
router.post('/login', clientController_1.loginClient);
// Profile (Auth required)
router.get('/me', auth_1.requireClientAuth, clientController_1.getClientProfile);
router.put('/me', auth_1.requireClientAuth, clientController_1.updateClientProfile);
// Cart (Auth required)
router.get('/cart', auth_1.requireClientAuth, cartController_1.getClientCart);
router.post('/cart/items', auth_1.requireClientAuth, cartController_1.addToCart);
router.put('/cart/items/:id', auth_1.requireClientAuth, cartController_1.updateCartItem);
router.delete('/cart/items/:id', auth_1.requireClientAuth, cartController_1.removeCartItem);
// Payment (Auth required)
router.post('/payments/checkout', auth_1.requireClientAuth, paymentController_1.checkout);
router.get('/payments', auth_1.requireClientAuth, paymentController_1.getPaymentHistory);
router.get('/payments/:id', auth_1.requireClientAuth, paymentController_1.getPaymentDetails);
exports.default = router;
