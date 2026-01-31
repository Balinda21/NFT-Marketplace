import { Router } from 'express';
import {
  getStats,
  getActivity,
  getUsers,
  getUserDetail,
  updateUserHandler,
  getTransactions,
  approveTransaction,
  rejectTransaction,
  completeTransaction,
  getOrders,
  getLoans,
  approveLoan,
  rejectLoan,
  getReferralStatistics,
} from '@/controllers/adminController';
import auth from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require ADMIN role
router.use(auth(UserRole.ADMIN));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/admin/activity:
 *   get:
 *     summary: Get recent activity (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent activity
 */
router.get('/activity', getActivity);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', getUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get user details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/users/:userId', getUserDetail);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isVerified:
 *                 type: boolean
 *               accountBalance:
 *                 type: number
 *                 description: User's account balance (admin can modify)
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/users/:userId', updateUserHandler);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions', getTransactions);

/**
 * @swagger
 * /api/admin/transactions/{transactionId}/approve:
 *   post:
 *     summary: Approve transaction (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction approved
 */
router.post('/transactions/:transactionId/approve', approveTransaction);

/**
 * @swagger
 * /api/admin/transactions/{transactionId}/reject:
 *   post:
 *     summary: Reject transaction (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction rejected
 */
router.post('/transactions/:transactionId/reject', rejectTransaction);

/**
 * @swagger
 * /api/admin/transactions/{transactionId}/complete:
 *   post:
 *     summary: Complete transaction (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction completed
 */
router.post('/transactions/:transactionId/complete', completeTransaction);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', getOrders);

/**
 * @swagger
 * /api/admin/loans:
 *   get:
 *     summary: Get all loans (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of loans
 */
router.get('/loans', getLoans);

/**
 * @swagger
 * /api/admin/loans/{loanId}/approve:
 *   post:
 *     summary: Approve loan (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan approved
 */
router.post('/loans/:loanId/approve', approveLoan);

/**
 * @swagger
 * /api/admin/loans/{loanId}/reject:
 *   post:
 *     summary: Reject loan (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan rejected
 */
router.post('/loans/:loanId/reject', rejectLoan);

/**
 * @swagger
 * /api/admin/referrals/stats:
 *   get:
 *     summary: Get referral statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral statistics
 */
router.get('/referrals/stats', getReferralStatistics);

export default router;

