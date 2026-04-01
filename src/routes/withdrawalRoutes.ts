import { Router } from 'express';
import { withdraw } from '@/controllers/withdrawalController';
import auth from '@/middleware/auth';
import validation from '@/middleware/validation';
import { createWithdrawalSchema } from '@/validations/withdrawalValidation';

const router = Router();

/**
 * @swagger
 * /api/withdrawals:
 *   post:
 *     summary: Submit a withdrawal request
 *     description: Deducts the amount from the user's balance immediately and creates a PENDING withdrawal transaction. Admins are notified in real time.
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - network
 *               - walletAddress
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 116
 *               network:
 *                 type: string
 *                 enum: [TRC20, ERC20]
 *                 example: TRC20
 *               walletAddress:
 *                 type: string
 *                 example: TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *               currency:
 *                 type: string
 *                 default: USDT
 *     responses:
 *       200:
 *         description: Withdrawal submitted, balance deducted
 */
router.post('/', auth(), validation(createWithdrawalSchema), withdraw);

export default router;
