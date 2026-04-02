import prisma from '@/config/prisma';
import { OrderType, OrderStatus } from '@prisma/client';
import ApiError from '@/utils/ApiError';
import { ERROR_CODES } from '@/utils/errorCodes';
import status from 'http-status';
import { isTradeLossMode } from './settingsService';

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

    // Deduct amount from balance and create order atomically
    const newBalance = currentBalance - amount;

    const [updatedUser, order] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { accountBalance: newBalance },
            select: { id: true, accountBalance: true },
        }),
        prisma.order.create({
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
        }),
    ]);

    // Emit real-time balance update to the user
    try {
        const { getIO } = await import('./socketService');
        const io = getIO();
        io.to(`user:${userId}`).emit('balance-updated', {
            userId,
            accountBalance: updatedUser.accountBalance.toString(),
        });
    } catch {
        // Socket not initialized — non-fatal
    }

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

    // Check admin trade mode: loss = user loses their stake, profit = user gains ROR
    const lossMode = await isTradeLossMode();
    const profit = lossMode ? 0 : (orderAmount * ror) / 100;
    // In loss mode balance stays as-is (amount was already deducted on order create)
    // In profit mode we add the profit on top of already-deducted balance
    const newBalance = lossMode ? currentBalance : currentBalance + profit;

    // Update order and user balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.COMPLETED,
                profit,
                isWon: !lossMode,
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

    const finalBalance = parseFloat(result.user.accountBalance.toString());

    // Emit real-time balance update to the user
    try {
        const { getIO } = await import('./socketService');
        const io = getIO();
        io.to(`user:${userId}`).emit('balance-updated', {
            userId,
            accountBalance: result.user.accountBalance.toString(),
        });
    } catch {
        // Socket not initialized — non-fatal
    }

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
            newBalance: finalBalance,
        },
    };
};
