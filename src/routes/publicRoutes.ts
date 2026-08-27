import { Router } from 'express';
import { pool } from '../config/database';

const router = Router();

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

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM category ORDER BY name');
    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;