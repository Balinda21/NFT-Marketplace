import httpStatus from 'http-status';
import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { sendResponse } from '../utils/response';
import { ERROR_CODES } from '../utils/errorCodes';

const validation = (schema: Joi.ObjectSchema | Joi.ArraySchema) => async (req: Request, res: Response, next: NextFunction) => {
  // For GET requests, validate req.query; for POST/PUT/PATCH/DELETE, validate req.body
  const dataToValidate = req.method === 'GET' ? req.query : req.body;
  
  // Debug logging
  console.log('[validation] Validating:', {
    method: req.method,
    path: req.path,
    dataToValidate,
  });
  
  const { error, value } = schema.validate(dataToValidate, { 
    abortEarly: false,
    convert: true, // Enable type conversion for query params
  });
  
  if (error) {
    console.log('[validation] Validation error:', error.message);
    const message = error.message.replace(/\\?"/g, '').replace(/\.\s/g, ', ');
    return sendResponse(res, httpStatus.BAD_REQUEST, message, null, ERROR_CODES.VALIDATION_ERROR);
  }
  
  // Update the appropriate request object
  if (req.method === 'GET') {
    req.query = value;
  } else {
    req.body = value;
  }
  
  console.log('[validation] Validation passed, calling next()');
  return next();
};

export default validation;