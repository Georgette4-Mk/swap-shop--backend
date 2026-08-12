// ============================================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================================

import { Router } from 'express';
import { pool } from '../config/database';  // ← ADD THIS IMPORT!
import { 
  getCategories,
  getCatalogItems,
  getCatalogItemById,
  getVendorPublicProfile
} from '../controllers/catalogController';

const router = Router();

// ─── HEALTH & TEST ROUTES ────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

router.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 + 1 AS result');
    res.json({
      success: true,
      message: 'Database connected successfully!',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ─── CATEGORIES ──────────────────────────────

router.get('/categories', getCategories);

// ─── CATALOG ──────────────────────────────────

router.get('/catalog', getCatalogItems);
router.get('/catalog/:id', getCatalogItemById);

// ─── VENDOR PUBLIC PROFILE ───────────────────

router.get('/vendor/:id', getVendorPublicProfile);

export default router;