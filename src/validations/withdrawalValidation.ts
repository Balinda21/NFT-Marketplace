import Joi from 'joi';

export const createWithdrawalSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  network: Joi.string().valid('TRC20', 'ERC20').required().messages({
    'any.only': 'Network must be TRC20 or ERC20',
    'any.required': 'Network is required',
  }),
  walletAddress: Joi.string().min(10).required().messages({
    'string.empty': 'Wallet address is required',
    'string.min': 'Wallet address is too short',
    'any.required': 'Wallet address is required',
  }),
  currency: Joi.string().default('USDT'),
});
