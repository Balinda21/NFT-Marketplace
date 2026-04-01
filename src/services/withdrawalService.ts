import prisma from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { ERROR_CODES } from '@/utils/errorCodes';
import { TransactionType, TransactionStatus, NetworkType, NotificationType } from '@prisma/client';
import httpStatus from 'http-status';

export const createWithdrawal = async (
  userId: string,
  data: {
    amount: number;
    network: NetworkType;
    walletAddress: string;
    currency?: string;
  }
) => {
  const { amount, network, walletAddress, currency = 'USDT' } = data;

  // Load user with current balance
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      accountBalance: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  const fee = parseFloat((amount * 0.02).toFixed(8));

  if (Number(user.accountBalance) < amount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Insufficient balance',
      ERROR_CODES.INSUFFICIENT_BALANCE
    );
  }

  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';

  // Atomically: deduct balance + create transaction + create notification
  const [updatedUser, transaction, notification] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { accountBalance: { decrement: amount } },
      select: { id: true, accountBalance: true },
    }),
    prisma.transaction.create({
      data: {
        userId,
        transactionType: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
        amount,
        currency,
        network,
        walletAddress,
        fee,
        description: `Withdrawal of ${amount} ${currency} to ${walletAddress} via ${network}`,
      },
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.WITHDRAWAL_REQUEST,
        title: 'New Withdrawal Request',
        message: `${userName} (${user.email}) requested a withdrawal of ${amount} ${currency} via ${network}`,
        data: {
          userId: user.id,
          userName,
          userEmail: user.email,
          amount,
          fee,
          currency,
          network,
          walletAddress,
        },
      },
    }),
  ]);

  // Emit real-time alert to all connected admins
  try {
    const { getIO } = await import('./socketService');
    const io = getIO();
    io.to('admin:all').emit('new-withdrawal', {
      notificationId: notification.id,
      transactionId: transaction.id,
      user: {
        id: user.id,
        name: userName,
        email: user.email,
      },
      amount,
      fee,
      currency,
      network,
      walletAddress,
      status: TransactionStatus.PENDING,
      createdAt: transaction.createdAt,
    });
  } catch {
    // Socket not yet initialized — non-fatal
  }

  return {
    transaction,
    newBalance: updatedUser.accountBalance,
    message:
      'Your withdrawal request has been submitted successfully. It may take a couple of hours to reach your wallet.',
  };
};
