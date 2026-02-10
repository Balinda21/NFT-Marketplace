import './instrument';
import { Server } from 'http';
import app from './app';
import config from './config/config';
import logger from './config/logger';
import { initializeSocket } from './services/socketService';
import { execSync } from 'child_process';

let server: Server;

// Run database migrations on startup
async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Failed to run database migrations:', error);
    // Don't exit - allow app to start even if migrations fail
    // This allows manual migration if needed
    logger.warn('Continuing without migrations. Run manually: npx prisma migrate deploy');
  }
}

// Run migrations before starting server
runMigrations().then(() => {
  server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
    logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
    logger.info('ChainReturns API is running');

    // Initialize Socket.io for real-time chat
    initializeSocket(server);
    logger.info('Socket.io initialized for real-time chat');
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use. Please free the port or use a different port.`);
    logger.error(`To find and kill the process: lsof -ti:${config.port} | xargs kill -9`);
  } else {
    logger.error('Server error:', error);
  }
  process.exit(1);
  });

  const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
      server.close();
    }
  });
}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});