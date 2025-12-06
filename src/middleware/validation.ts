import httpStatus from 'http-status';
import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { sendResponse } from '../utils/response';
import { ERROR_CODES } from '../utils/errorCodes';

const validation = (schema: Joi.ObjectSchema | Joi.ArraySchema) => async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.message.replace(/\\?"/g, '').replace(/\.\s/g, ', ');
    return sendResponse(res, httpStatus.BAD_REQUEST, message, null, ERROR_CODES.VALIDATION_ERROR);
  }
  req.body = value;
  return next();
};

export default validation;