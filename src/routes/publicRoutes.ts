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

router.get('/catalog', async (req, res) => {
  try {
    const { category, q, status } = req.query;

    let query = `
      SELECT c.*, cat.name as category_name, v.store_name, v.location as vendor_location
      FROM catalog c
      LEFT JOIN category cat ON c.category_id = cat.category_id
      LEFT JOIN vendor v ON c.vendor_id = v.vendor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND c.category_id = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (q) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY c.date_posted DESC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;