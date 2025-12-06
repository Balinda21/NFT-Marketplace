import Joi from 'joi';

/**
 * Common validation patterns and schemas
 */
export const commonSchemas = {
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address',
  }),
  
  password: Joi.string().min(6).messages({
    'string.min': 'Password must be at least 6 characters long',
  }),
  
  firstName: Joi.string().min(1).max(50).messages({
    'string.min': 'First name is required',
    'string.max': 'First name must not exceed 50 characters',
  }),
  
  lastName: Joi.string().min(1).max(50).messages({
    'string.min': 'Last name is required',
    'string.max': 'Last name must not exceed 50 characters',
  }),
};

