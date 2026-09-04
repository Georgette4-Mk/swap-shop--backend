"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const swagger_1 = require("./config/swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// ─── CORS CONFIGURATION ──────────────────────────
// Define all allowed origins
const allowedOrigins = [
    // Production (Vercel)
    'https://swap-shop.vercel.app',
    'https://your-frontend-url.vercel.app',
    'https://creative-delight-production-6b6c.up.railway.app',
    // Localhost (all ports)
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5500',
    'http://localhost:5501',
    'http://localhost:5502',
    'http://localhost:5000',
    'http://localhost:5001',
    // 127.0.0.1 (all ports)
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
    'http://127.0.0.1:5502',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5001',
];
// Also allow from environment variable (Railway)
const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : [];
// Combine both lists
const corsOrigins = [...allowedOrigins, ...envOrigins];
console.log('🔗 CORS Origins:', corsOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        // Check if origin is allowed
        if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            console.warn(`❌ CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
}));
// ─── OTHER MIDDLEWARE ────────────────────────────
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── SWAGGER DOCUMENTATION ──────────────────────
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
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
app.use('/api', routes_1.default);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health: /api/health`);
    console.log(`📚 API Docs: /api-docs`);
    console.log(`🔗 CORS Origins (${corsOrigins.length}):`);
    corsOrigins.forEach(origin => console.log(`   - ${origin}`));
});
