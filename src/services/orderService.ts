import prisma from '@/config/prisma';
import { OrderType, OrderStatus } from '@prisma/client';
import ApiError from '@/utils/ApiError';
import { ERROR_CODES } from '@/utils/errorCodes';
import status from 'http-status';

interface CreateOptionOrderData {
    symbol: string;
    amount: number;
    duration: number; // seconds
    ror: number; // rate of return percentage
    entryPrice: number;
}

/**
 * Create an Option order and immediately add profit to user's balance
 */
export const createOptionOrder = async (userId: string, data: CreateOptionOrderData) => {
    const { symbol, amount, duration, ror, entryPrice } = data;

    // Get user and check balance
    const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
    });

    if (!user) {
        throw new ApiError(status.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    const currentBalance = parseFloat(user.accountBalance.toString());
    const orderAmount = amount;

    if (currentBalance < orderAmount) {
        throw new ApiError(status.BAD_REQUEST, 'Insufficient balance', ERROR_CODES.INSUFFICIENT_BALANCE);
    }

    // Calculate profit based on ROR
    const profit = (orderAmount * ror) / 100;
    const newBalance = currentBalance + profit;

    // Create the order and update balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create Order record
        const order = await tx.order.create({
            data: {
                userId,
                orderType: OrderType.OPTION,
                status: OrderStatus.COMPLETED,
                amount: orderAmount,
                currency: 'USDT',
                symbol,
                entryPrice,
                periodSeconds: duration,
                ror,
                startDate: new Date(),
                endDate: new Date(),
                profit,
                isWon: true,
                description: `Option order: ${symbol} - ${ror}% ROR for ${duration}s`,
            },
        });

        // Update user balance
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                accountBalance: newBalance,
            },
            select: {
                id: true,
                accountBalance: true,
            },
        });

        return { order, updatedUser };
    });

    return {
        status: 'success',
        message: 'Option order placed successfully. Profit added to balance.',
        data: {
            order: {
                id: result.order.id,
                symbol: result.order.symbol,
                amount: result.order.amount,
                ror,
                profit,
                status: result.order.status,
            },
            newBalance: parseFloat(result.updatedUser.accountBalance.toString()),
        },
    };
};
