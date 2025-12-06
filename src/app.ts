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
    
    // In production, check against allowed origins
    const allowedOrigins = config.frontend_url.split(',').map(url => url.trim());
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NFT Marketplace API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
  },
}));

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
