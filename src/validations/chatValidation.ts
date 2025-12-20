import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  sessionId: Joi.string().uuid().required().messages({
    'string.empty': 'Session ID is required',
    'string.guid': 'Invalid session ID format',
    'any.required': 'Session ID is required',
  }),
  message: Joi.string().max(5000).optional().allow('').messages({
    'string.max': 'Message too long (max 5000 characters)',
  }),
  imageUrl: Joi.string().uri().optional().messages({
    'string.uri': 'Invalid image URL format',
  }),
  audioUrl: Joi.string().uri().optional().messages({
    'string.uri': 'Invalid audio URL format',
  }),
}).or('message', 'imageUrl', 'audioUrl').messages({
  'object.missing': 'Either message, imageUrl, or audioUrl must be provided',
});

export const getMessagesSchema = Joi.object({
  page: Joi.number().integer().positive().default(1).messages({
    'number.base': 'Page must be a number',
    'number.positive': 'Page must be positive',
  }),
  limit: Joi.number().integer().positive().max(100).default(50).messages({
    'number.base': 'Limit must be a number',
    'number.positive': 'Limit must be positive',
    'number.max': 'Limit cannot exceed 100',
  }),
});

export const assignAdminSchema = Joi.object({
  adminId: Joi.string().uuid().required().messages({
    'string.empty': 'Admin ID is required',
    'string.guid': 'Invalid admin ID format',
    'any.required': 'Admin ID is required',
  }),
});

export const getAllSessionsSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'CLOSED', 'WAITING').optional().messages({
    'any.only': 'Status must be one of: OPEN, CLOSED, WAITING',
  }),
});

