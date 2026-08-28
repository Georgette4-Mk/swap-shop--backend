// ============================================================
// MAIN ROUTER
// ============================================================

import { Router } from 'express';
import publicRoutes from './publicRoutes';
import clientRoutes from './clientRoutes';
import vendorRoutes from './vendorRoutes';
import authRoutes from './authRoutes';

const router = Router();

router.use('/', publicRoutes);
router.use('/client', clientRoutes);
router.use('/vendor', vendorRoutes);
router.use('/auth', authRoutes);

export default router;