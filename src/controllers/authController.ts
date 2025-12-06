import { Request, Response } from 'express';
import status from 'http-status';
import {
  googleAuth,
  passwordAuth,
  registerUser,
  refreshToken as refreshTokenService,
  getCurrentUser as getCurrentUserService,
} from '@/services/authService';
import catchAsync from '@/utils/catchAsync';
import { sendResponse } from '@/utils/response';
import { getUserIdFromRequest } from '@/utils/requestUtils';

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { googleToken } = req.body;
  const result = await googleAuth(googleToken);
  return sendResponse(res, status.OK, result.message, result.data);
});

export const passwordLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await passwordAuth(email, password);
  return sendResponse(res, status.OK, result.message, result.data);
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const result = await registerUser({ firstName, lastName, email, password });
  return sendResponse(res, status.CREATED, result.message, result.data);
});

export const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await refreshTokenService(refreshToken);
  return sendResponse(res, status.OK, result.message, result.data);
});

export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const result = await getCurrentUserService(userId);
  return sendResponse(res, status.OK, result.message, result.data);
});
