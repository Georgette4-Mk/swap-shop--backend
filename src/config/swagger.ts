import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Swap Shop API Documentation',
      version: '2.0.0',
      description: 'Complete Swap Shop Marketplace Backend API - Buy, Sell, and Trade items on campus.',
      contact: {
        name: 'Swap Shop Team',
        email: 'support@swapshop.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
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
    tags: [
      { name: 'Health', description: 'Server health and status' },
      { name: 'Public', description: 'Public endpoints (no auth required)' },
      { name: 'Client', description: 'Client/Buyer endpoints' },
      { name: 'Vendor', description: 'Vendor/Seller endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Cart', description: 'Shopping cart endpoints' },
      { name: 'Payment', description: 'Payment and checkout endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token here',
        },
      },
      schemas: {
        ClientRegistration: {
          type: 'object',
          required: ['full_name', 'email', 'password'],
          properties: {
            full_name: { type: 'string', example: 'Alice Johnson' },
            email: { type: 'string', example: 'alice@test.com' },
            password: { type: 'string', example: 'password123' },
            whatsapp_contact: { type: 'string', example: '08012345678' },
            location: { type: 'string', example: 'Lagos, Nigeria' },
          },
        },
        ClientLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'alice@test.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        VendorRegistration: {
          type: 'object',
          required: ['store_name', 'email', 'password'],
          properties: {
            store_name: { type: 'string', example: "Alice's Tech Shop" },
            email: { type: 'string', example: 'alice@shop.com' },
            password: { type: 'string', example: 'password123' },
            whatsapp_contact: { type: 'string', example: '08087654321' },
            location: { type: 'string', example: 'Abuja, Nigeria' },
          },
        },
        VendorLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'alice@shop.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        CatalogCreate: {
          type: 'object',
          required: ['title', 'price', 'category_id'],
          properties: {
            title: { type: 'string', example: 'MacBook Pro 2023' },
            description: { type: 'string', example: '16GB RAM, 512GB SSD. Excellent condition.' },
            price: { type: 'number', example: 1200 },
            category_id: { type: 'integer', example: 1 },
            image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8' },
          },
        },
        AddToCart: {
          type: 'object',
          required: ['catalog_id'],
          properties: {
            catalog_id: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 2 },
          },
        },
        UpdateCartItem: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: { type: 'integer', example: 3 },
          },
        },
        PaymentCreate: {
          type: 'object',
          properties: {
            payment_method: { 
              type: 'string', 
              enum: ['cash', 'bank_transfer', 'mobile_money', 'card'],
              example: 'cash' 
            },
          },
        },
        ForgotPassword: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', example: 'alice@test.com' },
          },
        },
        ResetPassword: {
          type: 'object',
          required: ['token', 'newPassword', 'role'],
          properties: {
            token: { type: 'string', example: 'abc123...' },
            newPassword: { type: 'string', example: 'newpassword123' },
            role: { type: 'string', enum: ['client', 'vendor'], example: 'client' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            count: { type: 'integer' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);