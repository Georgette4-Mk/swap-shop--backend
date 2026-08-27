import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mysql from 'mysql2/promise';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ─── DATABASE CONNECTION ──────────────────────

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'swap_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ─── MIDDLEWARE ──────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── AUTH MIDDLEWARE ──────────────────────────

const requireClientAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Please login.'
    });
  }

  const secret = process.env.JWT_SECRET || 'default_secret';
  jwt.verify(token, secret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }
    req.client = decoded;
    next();
  });
};

// ─── HEALTH CHECK ──────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// ─── TEST DATABASE ──────────────────────────────

app.get('/api/test-db', async (req, res) => {
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

// ─── CATEGORIES (Public) ──────────────────────

app.get('/api/categories', async (req, res) => {
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

// ─── CATALOG (Public) ──────────────────────────

app.get('/api/catalog', async (req, res) => {
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

// ─── CLIENT REGISTER ──────────────────────────

app.post('/api/client/register', async (req, res) => {
  try {
    const { full_name, email, password, whatsapp_contact, location } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    const [existing] = await pool.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const [existingVendor] = await pool.execute(
      'SELECT * FROM vendor WHERE email = ?',
      [email]
    );

    if ((existingVendor as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a vendor. Please use a different email.'
      });
    }

    const hashedPassword = await argon2.hash(password);

    const [result] = await pool.execute(
      `INSERT INTO client (full_name, email, password_hash, whatsapp_contact, location) 
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, hashedPassword, whatsapp_contact || null, location || null]
    );

    const [newClient] = await pool.execute(
      'SELECT client_id, full_name, email, whatsapp_contact, location, created_at FROM client WHERE client_id = ?',
      [(result as any).insertId]
    );

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { clientId: (newClient as any[])[0].client_id, email, role: 'client' },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Client registered successfully!',
      data: {
        client: (newClient as any[])[0],
        token,
        role: 'client'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ─── CLIENT LOGIN ──────────────────────────────

app.post('/api/client/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    const client = (rows as any[])[0];
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await argon2.verify(client.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { clientId: client.client_id, email: client.email, role: 'client' },
      secret,
      { expiresIn: '7d' }
    );

    const { password_hash, ...clientWithoutPassword } = client;

    res.json({
      success: true,
      message: 'Client login successful!',
      data: {
        client: clientWithoutPassword,
        token,
        role: 'client'
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

// ─── GET CLIENT PROFILE (Protected) ────────────

app.get('/api/client/me', requireClientAuth, async (req: any, res: any) => {
  try {
    const clientId = req.client.clientId;

    const [rows] = await pool.execute(
      'SELECT client_id, full_name, email, whatsapp_contact, location, created_at FROM client WHERE client_id = ?',
      [clientId]
    );

    const client = (rows as any[])[0];
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ─── START SERVER ────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: /api/health`);
  console.log(`📡 Database test: /api/test-db`);
  console.log(``);
  console.log(`📋 Public Routes:`);
  console.log(`   GET /api/categories`);
  console.log(`   GET /api/catalog`);
  console.log(``);
  console.log(`👤 Client Routes:`);
  console.log(`   POST /api/client/register`);
  console.log(`   POST /api/client/login`);
  console.log(`   GET  /api/client/me (Auth required)`);
});