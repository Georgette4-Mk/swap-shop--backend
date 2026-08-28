"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Swap Shop API Documentation',
            version: '1.0.0',
            description: 'Swap Shop Marketplace Backend API - Buy, Sell, and Trade items on campus.',
            contact: {
                name: 'Swap Shop Team',
                email: 'support@swapshop.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server',
            },
            {
                url: 'https://creative-delight-production-6b6c.up.railway.app',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
