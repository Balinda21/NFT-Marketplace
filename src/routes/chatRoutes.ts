import { Router } from 'express';
import {
  getOrCreateSession,
  getUserSessions,
  getAllSessions,
  getMessages,
  sendChatMessage,
  markAsRead,
  assignAdmin,
  closeSession,
  getUnreadCount,
} from '@/controllers/chatController';
import auth from '@/middleware/auth';
import validation from '@/middleware/validation';
import { UserRole } from '@prisma/client';
import {
  sendMessageSchema,
  getMessagesSchema,
  assignAdminSchema,
  getAllSessionsSchema,
} from '@/validations/chatValidation';

const router = Router();

// All routes require authentication
router.use(auth());

/**
 * @swagger
 * /api/chat/session:
 *   get:
 *     summary: Get or create a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat session retrieved or created
 */
router.get('/session', getOrCreateSession);

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: Get user's chat sessions
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's chat sessions
 */
router.get('/sessions', getUserSessions);

/**
 * @swagger
 * /api/chat/sessions/all:
 *   get:
 *     summary: Get all chat sessions (admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, WAITING]
 *     responses:
 *       200:
 *         description: List of all chat sessions
 */
router.get('/sessions/all', auth(UserRole.ADMIN), validation(getAllSessionsSchema), getAllSessions);

/**
 * @swagger
 * /api/chat/unread:
 *   get:
 *     summary: Get unread message count
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 */
router.get('/unread', getUnreadCount);

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send a message (text or image)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Chat session ID
 *               message:
 *                 type: string
 *                 description: Text message (optional if imageUrl is provided)
 *                 maxLength: 5000
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Image URL (optional if message is provided)
 *             anyOf:
 *               - required: [message]
 *               - required: [imageUrl]
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/message', validation(sendMessageSchema), sendChatMessage);

/**
 * @swagger
 * /api/chat/{sessionId}/messages:
 *   get:
 *     summary: Get messages for a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
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
 *         description: Messages retrieved
 */
router.get('/:sessionId/messages', validation(getMessagesSchema), getMessages);

/**
 * @swagger
 * /api/chat/{sessionId}/read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/:sessionId/read', markAsRead);

/**
 * @swagger
 * /api/chat/{sessionId}/assign:
 *   post:
 *     summary: Assign admin to chat session (admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin assigned successfully
 */
router.post('/:sessionId/assign', auth(UserRole.ADMIN), validation(assignAdminSchema), assignAdmin);

/**
 * @swagger
 * /api/chat/{sessionId}/close:
 *   post:
 *     summary: Close a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat session closed
 */
router.post('/:sessionId/close', closeSession);

export default router;
