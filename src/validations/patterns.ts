import Joi from 'joi';

export const commonSchemas = {
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.empty': 'Password is required',
  }),
  firstName: Joi.string().min(1).max(50).messages({
    'string.min': 'First name must be at least 1 character',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(1).max(50).messages({
    'string.min': 'Last name must be at least 1 character',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
};

