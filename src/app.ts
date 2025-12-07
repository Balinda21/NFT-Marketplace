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

// CORS - Configure based on environment
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow localhost with any port
    if (config.env === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }
    }
    
    // Always allow same-origin requests (for Swagger UI on same domain)
    // This allows Swagger UI to work when hosted on Render/Railway
    if (origin.includes('onrender.com') || origin.includes('railway.app') || origin.includes('fly.dev')) {
      callback(null, true);
      return;
    }
    
    // In production, check against allowed origins
    const allowedOrigins = config.frontend_url.split(',').map(url => url.trim());
    
    // Also allow any origin that matches the pattern (for testing)
    // Remove this in production if you want strict CORS
    const isAllowed = allowedOrigins.includes(origin) || 
                      allowedOrigins.some(url => origin.startsWith(url)) ||
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Log for debugging (remove in production)
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  const protocol = req.protocol || 'https';
  const host = req.get('host') || '';
  const baseUrl = `${protocol}://${host}`;
  
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
    customSiteTitle: 'NFT Marketplace API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
  })(req, res, next);
});

// Health check
app.get('/', (req, res) => {
  return sendResponse(res, httpStatus.OK, 'Welcome to NFT Marketplace Backend API');
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
