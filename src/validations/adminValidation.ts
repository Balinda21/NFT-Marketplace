import Joi from 'joi';
import { UserRole, TransactionType, TransactionStatus, OrderType, OrderStatus, LoanStatus } from '@prisma/client';

export const getUsersSchema = Joi.object({
  search: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  isActive: Joi.string().valid('true', 'false').optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
});

export const getTransactionsSchema = Joi.object({
  type: Joi.string().valid(...Object.values(TransactionType)).optional(),
  status: Joi.string().valid(...Object.values(TransactionStatus)).optional(),
  userId: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
});

export const getOrdersSchema = Joi.object({
  type: Joi.string().valid(...Object.values(OrderType)).optional(),
  status: Joi.string().valid(...Object.values(OrderStatus)).optional(),
  userId: Joi.string().optional(),
  symbol: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
});

export const getLoansSchema = Joi.object({
  status: Joi.string().valid(...Object.values(LoanStatus)).optional(),
  userId: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
});


