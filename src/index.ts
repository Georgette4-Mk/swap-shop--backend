import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ─── CORS CONFIGURATION ──────────────────────────

// Get allowed origins from environment variable or use defaults
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5000', 'https://creative-delight-production-6b6c.up.railway.app'];

console.log('🔗 CORS Origins:', corsOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// ─── OTHER MIDDLEWARE ────────────────────────────

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── SWAGGER DOCUMENTATION ──────────────────────

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── ROUTES ──────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Swap Shop Backend API is running',
    version: '1.0.0',
    documentation: '/api-docs',
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

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Swap Shop Backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health: /api/health`);
  console.log(`📚 API Docs: /api-docs`);
  console.log(`🔗 CORS Origins: ${corsOrigins.join(', ')}`);
});