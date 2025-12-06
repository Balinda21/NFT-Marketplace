import Joi from 'joi';
import { commonSchemas } from './patterns';

export const googleLoginSchema = Joi.object({
  googleToken: Joi.string().required().messages({
    'string.empty': 'Google token is required',
    'any.required': 'Google token is required',
  }),
});

export const passwordLoginSchema = Joi.object({
  email: commonSchemas.email.required().messages({
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
  password: commonSchemas.password.required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

export const registerSchema = Joi.object({
  firstName: commonSchemas.firstName.optional(),
  lastName: commonSchemas.lastName.optional(),
  email: commonSchemas.email.required().messages({
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
  password: commonSchemas.password.required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required',
  }),
});
