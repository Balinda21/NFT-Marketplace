import { Request, Response } from 'express';
import status from 'http-status';
import {
    createOptionOrder as createOptionOrderService,
    completeOptionOrder as completeOptionOrderService,
} from '@/services/orderService';
import catchAsync from '@/utils/catchAsync';
import { sendResponse } from '@/utils/response';
import { getUserIdFromRequest } from '@/utils/requestUtils';

export const createOptionOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    const { symbol, amount, duration, ror, entryPrice } = req.body;

    const result = await createOptionOrderService(userId, {
        symbol,
        amount,
        duration,
        ror,
        entryPrice,
    });

    return sendResponse(res, status.OK, result.message, result.data);
});

export const completeOptionOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    const { orderId } = req.params;

    const result = await completeOptionOrderService(userId, orderId);

    return sendResponse(res, status.OK, result.message, result.data);
});
