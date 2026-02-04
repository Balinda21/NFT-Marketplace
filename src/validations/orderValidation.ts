import Joi from 'joi';

export const createOptionOrderSchema = Joi.object({
  symbol: Joi.string().required().messages({
    'string.empty': 'Symbol is required',
    'any.required': 'Symbol is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  duration: Joi.number().integer().positive().required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.positive': 'Duration must be positive',
    'any.required': 'Duration is required',
  }),
  ror: Joi.number().positive().max(100).required().messages({
    'number.base': 'ROR must be a number',
    'number.positive': 'ROR must be positive',
    'number.max': 'ROR cannot exceed 100%',
    'any.required': 'ROR is required',
  }),
  entryPrice: Joi.number().positive().required().messages({
    'number.base': 'Entry price must be a number',
    'number.positive': 'Entry price must be positive',
    'any.required': 'Entry price is required',
  }),
});
