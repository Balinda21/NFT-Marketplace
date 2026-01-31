import { Request, Response } from 'express';
import status from 'http-status';
import {
  getDashboardStats,
  getRecentActivity,
  getAllUsers,
  getUserDetails,
  updateUser,
  getAllTransactions,
  updateTransactionStatus,
  getAllOrders,
  getAllLoans,
  updateLoanStatus,
  getReferralStats,
} from '@/services/adminService';
import catchAsync from '@/utils/catchAsync';
import { sendResponse } from '@/utils/response';
import { TransactionType, TransactionStatus, LoanStatus } from '@prisma/client';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await getDashboardStats();
  return sendResponse(res, status.OK, 'Dashboard statistics retrieved', stats);
});

export const getActivity = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const activity = await getRecentActivity(limit);
  return sendResponse(res, status.OK, 'Recent activity retrieved', activity);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string,
    role: req.query.role as string,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
  };
  const result = await getAllUsers(filters);
  return sendResponse(res, status.OK, 'Users retrieved', result);
});

export const getUserDetail = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await getUserDetails(userId);
  return sendResponse(res, status.OK, 'User details retrieved', user);
});

export const updateUserHandler = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { firstName, lastName, role, isActive, isVerified, accountBalance } = req.body;
  const user = await updateUser(userId, {
    firstName,
    lastName,
    role,
    isActive,
    isVerified,
    accountBalance,
  });
  return sendResponse(res, status.OK, 'User updated', user);
});

export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    type: req.query.type as TransactionType | undefined,
    status: req.query.status as TransactionStatus | undefined,
    userId: req.query.userId as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
  };
  const result = await getAllTransactions(filters);
  return sendResponse(res, status.OK, 'Transactions retrieved', result);
});

export const approveTransaction = catchAsync(async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const transaction = await updateTransactionStatus(transactionId, TransactionStatus.PROCESSING);
  return sendResponse(res, status.OK, 'Transaction approved', transaction);
});

export const rejectTransaction = catchAsync(async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const transaction = await updateTransactionStatus(transactionId, TransactionStatus.CANCELLED);
  return sendResponse(res, status.OK, 'Transaction rejected', transaction);
});

export const completeTransaction = catchAsync(async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const transaction = await updateTransactionStatus(transactionId, TransactionStatus.COMPLETED);
  return sendResponse(res, status.OK, 'Transaction completed', transaction);
});

export const getOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    type: req.query.type as any,
    status: req.query.status as any,
    userId: req.query.userId as string,
    symbol: req.query.symbol as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
  };
  const result = await getAllOrders(filters);
  return sendResponse(res, status.OK, 'Orders retrieved', result);
});

export const getLoans = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as LoanStatus | undefined,
    userId: req.query.userId as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
  };
  const result = await getAllLoans(filters);
  return sendResponse(res, status.OK, 'Loans retrieved', result);
});

export const approveLoan = catchAsync(async (req: Request, res: Response) => {
  const { loanId } = req.params;
  const loan = await updateLoanStatus(loanId, LoanStatus.ACTIVE);
  return sendResponse(res, status.OK, 'Loan approved', loan);
});

export const rejectLoan = catchAsync(async (req: Request, res: Response) => {
  const { loanId } = req.params;
  const loan = await updateLoanStatus(loanId, LoanStatus.CANCELLED);
  return sendResponse(res, status.OK, 'Loan rejected', loan);
});

export const getReferralStatistics = catchAsync(async (req: Request, res: Response) => {
  const stats = await getReferralStats();
  return sendResponse(res, status.OK, 'Referral statistics retrieved', stats);
});
