import { Router } from 'express';
import { requireClientAuth } from '../middlewares/auth';
import {
  registerClient,
  loginClient,
  getClientProfile,
  updateClientProfile
} from '../controllers/clientController';
import {
  getClientCart,
  addToCart,
  updateCartItem,
  removeCartItem
} from '../controllers/cartController';
import {
  checkout,
  getPaymentHistory,
  getPaymentDetails
} from '../controllers/paymentController';

const router = Router();

// Auth (No auth required)
router.post('/register', registerClient);
router.post('/login', loginClient);

// Profile (Auth required)
router.get('/me', requireClientAuth, getClientProfile);
router.put('/me', requireClientAuth, updateClientProfile);

// Cart (Auth required)
router.get('/cart', requireClientAuth, getClientCart);
router.post('/cart/items', requireClientAuth, addToCart);
router.put('/cart/items/:id', requireClientAuth, updateCartItem);
router.delete('/cart/items/:id', requireClientAuth, removeCartItem);

// Payment (Auth required)
router.post('/payments/checkout', requireClientAuth, checkout);
router.get('/payments', requireClientAuth, getPaymentHistory);
router.get('/payments/:id', requireClientAuth, getPaymentDetails);

export default router;