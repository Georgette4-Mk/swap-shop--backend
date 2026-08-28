import { Router } from 'express';
import publicRoutes from './publicRoutes';
import clientRoutes from './clientRoutes';
import vendorRoutes from './vendorRoutes';
import authRoutes from './authRoutes';

const router = Router();

// ─── PUBLIC ROUTES ────────────────────────────

router.use('/', publicRoutes);

// ─── CLIENT ROUTES ────────────────────────────

router.use('/client', clientRoutes);

// ─── VENDOR ROUTES ────────────────────────────

router.use('/vendor', vendorRoutes);

// ─── AUTH ROUTES ──────────────────────────────

router.use('/auth', authRoutes);

export default router;