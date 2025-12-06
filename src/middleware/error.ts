import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import config from '../config/config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';
import { ERROR_CODES } from '../utils/errorCodes';
import { sendResponse } from '../utils/response';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFormatter } from 'prisma-error-formatter';

const prismaErrorFormatter = new PrismaExceptionFormatter();

export const errorConverter: ErrorRequestHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    // Prisma errors → format via prisma-error-formatter
    if (
      err instanceof Prisma.PrismaClientKnownRequestError ||
      err instanceof Prisma.PrismaClientValidationError ||
      err instanceof Prisma.PrismaClientInitializationError ||
      err instanceof Prisma.PrismaClientRustPanicError
    ) {
      const formatted = prismaErrorFormatter.formatError(err);
      // Choose status based on error type/code
      let statusCode: number = Number(httpStatus.BAD_REQUEST);
      let errorCode = ERROR_CODES.VALIDATION_ERROR;

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2002':
            statusCode = Number(httpStatus.CONFLICT);
            errorCode = ERROR_CODES.CONFLICT;
            break;
          case 'P2003':
            statusCode = Number(httpStatus.CONFLICT);
            errorCode = ERROR_CODES.CONFLICT;
            break;
          case 'P2025':
            statusCode = Number(httpStatus.NOT_FOUND);
            errorCode = ERROR_CODES.NOT_FOUND;
            break;
          case 'P2024':
            statusCode = Number(httpStatus.SERVICE_UNAVAILABLE);
            errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
            break;
          default:
            statusCode = Number(httpStatus.BAD_REQUEST);
            errorCode = ERROR_CODES.VALIDATION_ERROR;
        }
      } else if (err instanceof Prisma.PrismaClientInitializationError) {
        // Database connection/initialization errors
        statusCode = Number(httpStatus.SERVICE_UNAVAILABLE);
        errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
      } else if (err instanceof Prisma.PrismaClientRustPanicError) {
        // Database panic errors
        statusCode = Number(httpStatus.SERVICE_UNAVAILABLE);
        errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
      }

      const message = formatted?.[0]?.message || 'Database error';
      error = new ApiError(statusCode, message, errorCode, true);
    } else {
      const statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || (httpStatus as any)[statusCode];
      error = new ApiError(statusCode, message, ERROR_CODES.INTERNAL_SERVER_ERROR, false, (err as any).stack);
    }
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  // Enhanced error logging with context
  const errorContext = {
    endpoint: req.originalUrl,
    method: req.method,
    ip: (req as any).originalIP || req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || (req as any).user?.userId || 'anonymous',
    statusCode,
    errorCode: err.errorCode,
    isOperational: err.isOperational,
    stack: config.env === 'development' ? err.stack : undefined
  };

  // Debug: Log what user information is available
  if (config.env === 'development') {
    logger.debug('Request user info:', {
      hasUser: !!(req as any).user,
      userKeys: (req as any).user ? Object.keys((req as any).user) : [],
      userId: (req as any).user?.id,
      userType: (req as any).user?.userType
    });
  }

  // Log security-related errors with higher severity
  if (statusCode === 401 || statusCode === 403) {
    logger.error('Unauthorized Access Attempt', {
      message: err.message,
      ...errorContext
    });
  } else if (statusCode >= 500) {
    logger.error('Server Error', {
      message: err.message,
      ...errorContext
    });
  } else {
    // Log all client errors as errors to ensure they appear in error logs
    logger.error('Client Error', {
      message: err.message,
      ...errorContext
    });
  }

  const errorCode = err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR;
  return sendResponse(res, statusCode, message, null, errorCode);
};
