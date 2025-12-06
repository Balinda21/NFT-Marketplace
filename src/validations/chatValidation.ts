import Joi from 'joi';
import { ChatStatus } from '@prisma/client';

export const sendMessageSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.empty': 'Session ID is required',
    'any.required': 'Session ID is required',
  }),
  message: Joi.string().trim().min(1).max(5000).required().messages({
    'string.empty': 'Message cannot be empty',
    'string.min': 'Message must be at least 1 character',
    'string.max': 'Message must not exceed 5000 characters',
    'any.required': 'Message is required',
  }),
});

export const getMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
});

export const assignAdminSchema = Joi.object({
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required',
  }),
});

export const getAllSessionsSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ChatStatus))
    .optional(),
});

