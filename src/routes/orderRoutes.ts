import { Router } from 'express';
import { createOptionOrder, completeOptionOrder } from '@/controllers/orderController';
import validation from '@/middleware/validation';
import auth from '@/middleware/auth';
import { createOptionOrderSchema } from '@/validations/orderValidation';

const router = Router();

/**
 * @swagger
 * /api/orders/option:
 *   post:
 *     summary: Create an Option order (starts countdown)
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
 *               amount:
 *                 type: number
 *               duration:
 *                 type: number
 *               ror:
 *                 type: number
 *               entryPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Option order created with ACTIVE status
 */
router.post('/option', auth(), validation(createOptionOrderSchema), createOptionOrder);

/**
 * @swagger
 * /api/orders/{orderId}/complete:
 *   post:
 *     summary: Complete an Option order after countdown (adds profit)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order completed, profit added to balance
 */
router.post('/:orderId/complete', auth(), completeOptionOrder);

export default router;
