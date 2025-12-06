import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { ERROR_CODES } from '../utils/errorCodes';
import { NextFunction, Request, Response } from 'express';
import config from '../config/config';
import prisma from '../config/prisma';
import { UserRole } from '@prisma/client';

// Extend Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        role: UserRole;
      };
    }
  }
}

const auth = (...allowedRoles: UserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'No token provided', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (!decoded.userId || decoded.type !== 'access') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token', ERROR_CODES.UNAUTHORIZED);
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    // Check role if specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions', ERROR_CODES.FORBIDDEN);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token', ERROR_CODES.UNAUTHORIZED));
    }
  }
};

export default auth;
