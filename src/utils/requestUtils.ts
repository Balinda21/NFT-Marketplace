import { Request } from 'express';
import ApiError from './ApiError';
import { ERROR_CODES } from './errorCodes';
import httpStatus from 'http-status';

export const getUserIdFromRequest = (req: Request): string => {
  if (!req.user || !req.user.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated', ERROR_CODES.UNAUTHORIZED);
  }
  return req.user.id;
};
