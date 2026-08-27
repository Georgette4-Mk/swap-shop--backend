import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.log(`📡 Database test: /api/test-db`);
});