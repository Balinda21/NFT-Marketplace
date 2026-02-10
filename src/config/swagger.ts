import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChainReturns API',
      version: '1.0.0',
      description: 'ChainReturns API - Digital asset trading backend. Email/password authentication. Most endpoints require authentication. Use the login/register endpoints to get an access token, then click the Authorize button to enter your token.',
    },
    servers: [
      // In production, use the actual request URL or Render's external URL
      ...(config.env === 'production' 
        ? [{
            url: process.env.RENDER_EXTERNAL_URL || 'https://api.chainreturns.it.com',
            description: 'Production server',
          }]
        : [{
            url: `http://localhost:${config.port}`,
            description: 'Development server',
          }]
      ),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: Bearer <token> or just <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
            imageUrl: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Login, register, forgot password, refresh token',
      },
      {
        name: 'Orders',
        description: 'Option trading - create and complete orders',
      },
      {
        name: 'Chat',
        description: 'Live chat endpoints for user-admin communication',
      },
      {
        name: 'Admin',
        description: 'Admin dashboard endpoints (admin only)',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;