import { Response } from 'express';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errorCode?: string;
}

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  errorCode?: string
) {
  const response: ApiResponse<T> = {
    status: errorCode ? 'error' : 'success',
    message,
  };
  if (data !== undefined) response.data = data;
  if (errorCode) response.errorCode = errorCode;
  return res.status(statusCode).json(response);
} 