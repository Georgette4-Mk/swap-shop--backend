// ============================================================
// VENDOR ROUTES
// ============================================================

import { Router } from 'express';
import { requireVendorAuth } from '../middlewares/auth';
import { checkCatalogOwnership } from '../middlewares/ownership';
import {
  registerVendor,
  loginVendor,
  getVendorProfile,
  updateVendorProfile
} from '../controllers/vendorController';
import {
  getVendorItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem
} from '../controllers/vendorItemsController';
import { getVendorOrders } from '../controllers/vendorOrdersController';

const router = Router();

router.post('/register', registerVendor);
router.post('/login', loginVendor);
router.get('/me', requireVendorAuth, getVendorProfile);
router.put('/me', requireVendorAuth, updateVendorProfile);

router.get('/items', requireVendorAuth, getVendorItems);
router.post('/items', requireVendorAuth, createCatalogItem);
router.put('/items/:id', requireVendorAuth, checkCatalogOwnership, updateCatalogItem);
router.delete('/items/:id', requireVendorAuth, checkCatalogOwnership, deleteCatalogItem);

router.get('/orders', requireVendorAuth, getVendorOrders);

export default router;