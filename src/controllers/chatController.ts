import { Request, Response } from 'express';
import status from 'http-status';
import {
  getOrCreateChatSession,
  getUserChatSessions,
  getAllChatSessions,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  assignAdminToChat,
  closeChatSession,
  getUnreadMessageCount,
} from '@/services/chatService';
import catchAsync from '@/utils/catchAsync';
import { sendResponse } from '@/utils/response';
import { getUserIdFromRequest } from '@/utils/requestUtils';
import { ChatMessageSenderType, ChatStatus, UserRole } from '@prisma/client';

export const getOrCreateSession = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const session = await getOrCreateChatSession(userId);
  return sendResponse(res, status.OK, 'Chat session retrieved', session);
});

export const getUserSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const sessions = await getUserChatSessions(userId);
  return sendResponse(res, status.OK, 'Chat sessions retrieved', sessions);
});

export const getAllSessions = catchAsync(async (req: Request, res: Response) => {
  const statusFilter = req.query.status as ChatStatus | undefined;
  const sessions = await getAllChatSessions(statusFilter);
  return sendResponse(res, status.OK, 'All chat sessions retrieved', sessions);
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await getChatMessages(sessionId, userId, page, limit);
  return sendResponse(res, status.OK, 'Messages retrieved', result);
});

export const sendChatMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId, message } = req.body;

  // Determine sender type based on user role
  const user = req.user;
  const senderType =
    user?.role === UserRole.ADMIN
      ? ChatMessageSenderType.ADMIN
      : ChatMessageSenderType.USER;

  const chatMessage = await sendMessage(sessionId, userId, message, senderType);
  return sendResponse(res, status.CREATED, 'Message sent', chatMessage);
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.params;
  const result = await markMessagesAsRead(sessionId, userId);
  return sendResponse(res, status.OK, 'Messages marked as read', result);
});

export const assignAdmin = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { adminId } = req.body;
  const session = await assignAdminToChat(sessionId, adminId);
  return sendResponse(res, status.OK, 'Admin assigned to chat', session);
});

export const closeSession = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.params;
  const result = await closeChatSession(sessionId, userId);
  return sendResponse(res, status.OK, 'Chat session closed', result);
});

export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const count = await getUnreadMessageCount(userId);
  return sendResponse(res, status.OK, 'Unread count retrieved', { count });
});


