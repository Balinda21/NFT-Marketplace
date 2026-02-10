import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import httpStatus from 'http-status';
import config from './config/config';
import morgan from './config/morgan';
import xss from './middleware/xss';
import routes from './routes';
import { errorConverter, errorHandler } from './middleware/error';
import ApiError from './utils/ApiError';
import { ERROR_CODES } from './utils/errorCodes';
import { sendResponse } from './utils/response';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

const app = express();

// Trust proxy - Required for Render and other hosting platforms to get correct protocol
app.set('trust proxy', true);

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Security
app.use(helmet());

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Handle JSON parsing errors (must be after body parsing middleware)
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && 'body' in error) {
    sendResponse(
      res, 
      httpStatus.BAD_REQUEST, 
      'Invalid JSON in request body. Please check your JSON syntax.', 
      null, 
      ERROR_CODES.VALIDATION_ERROR
    );
    return;
  }
  return next(error);
});

// Sanitize
app.use(xss());

// Compression
app.use(compression());

// CORS - Allow all origins (can be restricted later for production)
// This ensures Swagger UI and all clients can access the API
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Swagger documentation - dynamically set server URL based on request
app.use('/api-docs', swaggerUi.serve, (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Get the actual host from the request
  // In production behind a proxy (like Render), use x-forwarded-proto
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || '';
  
  // Ensure protocol is http or https
  const validProtocol = protocol === 'http' || protocol === 'https' ? protocol : 'https';
  const baseUrl = `${validProtocol}://${host}`;
  
  // Update swagger spec with the actual server URL
  const swaggerSpecWithServer = {
    ...swaggerSpec,
    servers: [{
      url: baseUrl,
      description: config.env === 'production' ? 'Production server' : 'Development server',
    }],
  };
  
  return swaggerUi.setup(swaggerSpecWithServer, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ChainReturns API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
  })(req, res, next);
});

// Serve Swagger JSON with correct server URL
app.get('/api-docs/swagger.json', (req, res) => {
  // In production behind a proxy (like Render), use x-forwarded-proto
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || '';
  
  // Ensure protocol is http or https
  const validProtocol = protocol === 'http' || protocol === 'https' ? protocol : 'https';
  const baseUrl = `${validProtocol}://${host}`;
  
  const swaggerSpecWithServer = {
    ...swaggerSpec,
    servers: [{
      url: baseUrl,
      description: config.env === 'production' ? 'Production server' : 'Development server',
    }],
  };
  
  res.json(swaggerSpecWithServer);
});

// Health check - root
app.get('/', (req, res) => {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || '';
  const baseUrl = `${protocol === 'https' ? 'https' : 'http'}://${host}`;
  return sendResponse(res, httpStatus.OK, 'Welcome to ChainReturns API', {
    docs: `${baseUrl}/api-docs`,
    health: `${baseUrl}/api/health`,
  });
});

// Health check - for Render and other platforms
app.get('/api/health', (req, res) => {
  return sendResponse(res, httpStatus.OK, 'OK', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// GET /api - API info (must be before app.use so it matches exactly)
app.get('/api', (req, res) => {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || '';
  const baseUrl = `${protocol === 'https' ? 'https' : 'http'}://${host}`;
  return sendResponse(res, httpStatus.OK, 'ChainReturns API', {
    endpoints: {
      auth: `${baseUrl}/api/auth`,
      orders: `${baseUrl}/api/orders`,
      chat: `${baseUrl}/api/chat`,
      admin: `${baseUrl}/api/admin`,
      docs: `${baseUrl}/api-docs`,
      health: `${baseUrl}/api/health`,
    },
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'API URL Not found', ERROR_CODES.NOT_FOUND));
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;