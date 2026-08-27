import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ─── MIDDLEWARE ──────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ROOT ─────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Swap Shop Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      testDatabase: '/api/test-db',
      categories: '/api/categories',
      catalog: '/api/catalog',
      client: '/api/client',
      vendor: '/api/vendor',
    },
  });
});

// ─── DIRECT HEALTH CHECK ─────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Swap Shop Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── API ROUTES ──────────────────────────────

app.use('/api', routes);

// ─── 404 HANDLER ─────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ─── ERROR HANDLER ───────────────────────────

app.use(errorHandler);

// ─── START SERVER ────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log('==========================================');
  console.log('🚀 SWAP SHOP BACKEND');
  console.log('==========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Health: /api/health`);
  console.log(`Database Test: /api/test-db`);
  console.log('==========================================');
});