import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

// ─── DATABASE POOL ──────────────────────────────
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