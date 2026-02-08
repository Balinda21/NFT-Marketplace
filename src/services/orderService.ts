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
 * Create an Option order with ACTIVE status (countdown will run on frontend)
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

    if (currentBalance < amount) {
        throw new ApiError(status.BAD_REQUEST, 'Insufficient balance', ERROR_CODES.INSUFFICIENT_BALANCE);
    }

    // Calculate expected profit (stored for reference, not added yet)
    const expectedProfit = (amount * ror) / 100;

    // Create Order with ACTIVE status
    const order = await prisma.order.create({
        data: {
            userId,
            orderType: OrderType.OPTION,
            status: OrderStatus.ACTIVE,
            amount,
            currency: 'USDT',
            symbol,
            entryPrice,
            periodSeconds: duration,
            ror,
            startDate: new Date(),
            endDate: new Date(Date.now() + duration * 1000),
            description: `Option order: ${symbol} - ${ror}% ROR for ${duration}s`,
        },
    });

    return {
        status: 'success',
        message: 'Option order created. Countdown started.',
        data: {
            order: {
                id: order.id,
                symbol: order.symbol,
                amount: order.amount,
                ror,
                expectedProfit,
                duration,
                status: order.status,
                endDate: order.endDate,
            },
        },
    };
};

/**
 * Complete an Option order after countdown finishes - adds profit to balance
 */
export const completeOptionOrder = async (userId: string, orderId: string) => {
    // Get the order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new ApiError(status.NOT_FOUND, 'Order not found', ERROR_CODES.ORDER_NOT_FOUND);
    }

    if (order.userId !== userId) {
        throw new ApiError(status.FORBIDDEN, 'Not authorized to complete this order', ERROR_CODES.FORBIDDEN);
    }

    if (order.status !== OrderStatus.ACTIVE) {
        throw new ApiError(status.BAD_REQUEST, 'Order is not active', ERROR_CODES.ORDER_ALREADY_COMPLETED);
    }

    // Get user
    const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
    });

    if (!user) {
        throw new ApiError(status.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    const currentBalance = parseFloat(user.accountBalance.toString());
    const orderAmount = parseFloat(order.amount.toString());
    const ror = order.ror ? parseFloat(order.ror.toString()) : 0;

    // Calculate profit
    const profit = (orderAmount * ror) / 100;
    const newBalance = currentBalance + profit;

    // Update order and user balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.COMPLETED,
                profit,
                isWon: true,
            },
        });

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

        return { order: updatedOrder, user: updatedUser };
    });

    return {
        status: 'success',
        message: 'Option order completed. Profit added to balance.',
        data: {
            order: {
                id: result.order.id,
                symbol: result.order.symbol,
                amount: result.order.amount,
                ror,
                profit,
                status: result.order.status,
            },
            newBalance: parseFloat(result.user.accountBalance.toString()),
        },
    };
};
