import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { sendResponse } from '@/utils/response';
import { createWithdrawal } from '@/services/withdrawalService';
import { NetworkType } from '@prisma/client';

export const withdraw = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { amount, network, walletAddress, currency } = req.body;

  const result = await createWithdrawal(userId, {
    amount,
    network: network as NetworkType,
    walletAddress,
    currency,
  });

  return sendResponse(res, httpStatus.OK, result.message, {
    transaction: result.transaction,
    newBalance: result.newBalance,
  });
});
