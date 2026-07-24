import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import cors from 'cors';
import helmet from 'helmet';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ──────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DATABASE ────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'swap_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ─── TEST ROUTES ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/test-db', async (req, res) => {
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

// ─── AUTH ROUTES ─────────────────────────────

// REGISTER - POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await argon2.hash(password);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, phone) 
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null]
    );

    const [newUser] = await pool.execute(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [(result as any).insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: (newUser as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// LOGIN - POST /api/auth/login (FIXED)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const user = (users as any[])[0];
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // FIXED: JWT signing with correct options
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: userWithoutPassword,
        token: token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ─── AUTH MIDDLEWARE ─────────────────────────

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Please login.'
    });
  }

  // FIXED: Use secret variable
  const secret = process.env.JWT_SECRET || 'default_secret';
  jwt.verify(token, secret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }
    req.user = decoded;
    next();
  });
};

// ─── ITEM ROUTES ─────────────────────────────

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const { category, search, status } = req.query;

    let query = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [rows] = await pool.execute(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );

    const items = rows as any[];
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: items[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST create item (requires auth)
app.post('/api/items', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { title, description, price, exchange_wanted, category, image_url } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO items 
       (user_id, title, description, price, exchange_wanted, category, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, price || null, exchange_wanted || null, category, image_url || null]
    );

    const [newItem] = await pool.execute(
      'SELECT * FROM items WHERE id = ?',
      [(result as any).insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Item listed successfully!',
      data: (newItem as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT update item (requires auth)
app.put('/api/items/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;

    const [existing] = await pool.execute(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );

    const item = (existing as any[])[0];
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this item'
      });
    }

    const { title, description, price, exchange_wanted, category, image_url, status } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (exchange_wanted !== undefined) { fields.push('exchange_wanted = ?'); values.push(exchange_wanted); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    await pool.execute(
      `UPDATE items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Item updated successfully!',
      data: (updated as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE item (requires auth)
app.delete('/api/items/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;

    const [existing] = await pool.execute(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );

    const item = (existing as any[])[0];
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item'
      });
    }

    await pool.execute(
      'DELETE FROM items WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Item deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET my items
app.get('/api/items/user/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.execute(
      'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ─── USER ROUTES ─────────────────────────────

// GET my profile
app.get('/api/users/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, whatsapp_link, campus_room, created_at FROM users WHERE id = ?',
      [userId]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT update profile
app.put('/api/users/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { name, phone, whatsapp_link, campus_room } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (whatsapp_link !== undefined) { fields.push('whatsapp_link = ?'); values.push(whatsapp_link); }
    if (campus_room !== undefined) { fields.push('campus_room = ?'); values.push(campus_room); }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT id, name, email, phone, whatsapp_link, campus_room, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: (updated as any[])[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET user's items (public)
app.get('/api/users/:id/items', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const [rows] = await pool.execute(
      'SELECT * FROM items WHERE user_id = ? AND status = "active" ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      count: (rows as any[]).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ─── START SERVER ────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Test database: http://localhost:${PORT}/test-db`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  console.log(``);
  console.log(`🔐 Authentication:`);
  console.log(`   POST /api/auth/register - Create account`);
  console.log(`   POST /api/auth/login - Login`);
  console.log(``);
  console.log(`📦 Items:`);
  console.log(`   GET  /api/items - Get all items`);
  console.log(`   GET  /api/items/:id - Get one item`);
  console.log(`   POST /api/items - Create item (Auth required)`);
  console.log(`   PUT  /api/items/:id - Update item (Auth required)`);
  console.log(`   DELETE /api/items/:id - Delete item (Auth required)`);
  console.log(``);
  console.log(`👤 User:`);
  console.log(`   GET  /api/users/me - Get profile (Auth required)`);
  console.log(`   PUT  /api/users/me - Update profile (Auth required)`);
});