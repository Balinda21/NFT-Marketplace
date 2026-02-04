import { Router } from 'express';
import { createOptionOrder } from '@/controllers/orderController';
import validation from '@/middleware/validation';
import auth from '@/middleware/auth';
import { createOptionOrderSchema } from '@/validations/orderValidation';

const router = Router();

/**
 * @swagger
 * /api/orders/option:
 *   post:
 *     summary: Create an Option order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - amount
 *               - duration
 *               - ror
 *               - entryPrice
 *             properties:
 *               symbol:
 *                 type: string
 *                 description: Trading pair symbol (e.g., DOT/USD)
 *               amount:
 *                 type: number
 *                 description: Order amount in USDT
 *               duration:
 *                 type: number
 *                 description: Order duration in seconds
 *               ror:
 *                 type: number
 *                 description: Rate of return percentage
 *               entryPrice:
 *                 type: number
 *                 description: Entry price at order placement
 *     responses:
 *       200:
 *         description: Option order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         symbol:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         ror:
 *                           type: number
 *                         profit:
 *                           type: number
 *                         status:
 *                           type: string
 *                     newBalance:
 *                       type: number
 *       400:
 *         description: Validation error or insufficient balance
 *       401:
 *         description: Unauthorized
 */
router.post('/option', auth(), validation(createOptionOrderSchema), createOptionOrder);

export default router;
