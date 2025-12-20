import { Request, Response } from 'express';
import status from 'http-status';
import { sendMessage } from '@/services/chatService';
import catchAsync from '@/utils/catchAsync';
import { sendResponse } from '@/utils/response';
import { getUserIdFromRequest } from '@/utils/requestUtils';
import prisma from '@/config/prisma';
import { ChatMessageSenderType, UserRole } from '@prisma/client';

export const sendChatMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId, message, imageUrl, audioUrl } = req.body;

  // Get user to determine sender type
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return sendResponse(res, status.NOT_FOUND, 'User not found', null);
  }

  const senderType =
    user.role === UserRole.ADMIN
      ? ChatMessageSenderType.ADMIN
      : ChatMessageSenderType.USER;

  const chatMessage = await sendMessage(sessionId, userId, message || '', senderType, imageUrl, audioUrl);

  return sendResponse(res, status.CREATED, 'Message sent successfully', chatMessage);
});

export const getOrCreateSession = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);

  let session = await prisma.chatSession.findFirst({
    where: {
      userId,
      status: 'OPEN',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        userId,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  return sendResponse(res, status.OK, 'Session retrieved', session);
});

export const getUserSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);

  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              userId: { not: userId },
            },
          },
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  return sendResponse(res, status.OK, 'Sessions retrieved', sessions);
});

export const getAllSessions = catchAsync(async (req: Request, res: Response) => {
  const { status: statusFilter } = req.query;

  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }

  const sessions = await prisma.chatSession.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  return sendResponse(res, status.OK, 'Sessions retrieved', sessions);
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.params;
  
  // Debug logging
  console.log('[getMessages] Request received:', {
    sessionId,
    userId,
    query: req.query,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
  });
  
  // Validate sessionId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    console.log('[getMessages] Invalid session ID format:', sessionId);
    return sendResponse(res, status.BAD_REQUEST, 'Invalid session ID format', null);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  // Get user role to check admin access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return sendResponse(res, status.NOT_FOUND, 'User not found', null);
  }

  // Build access check: user owns session OR is assigned admin OR is an admin
  const whereClause: any = {
    id: sessionId,
    isActive: true,
  };

  // If user is admin, they can access any session
  if (user.role === UserRole.ADMIN) {
    // Admin can access any session, no additional where conditions needed
  } else {
    // Regular users can only access their own sessions or sessions where they're assigned as admin
    whereClause.OR = [
      { userId }, // User is the owner
      { adminId: userId }, // User is the assigned admin
    ];
  }

  // Verify session exists and user has access
  const session = await prisma.chatSession.findFirst({
    where: whereClause,
  });

  if (!session) {
    return sendResponse(res, status.NOT_FOUND, 'Chat session not found or access denied', null);
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first for proper chat display
    },
    skip,
    take: limit,
  });

  const total = await prisma.chatMessage.count({
    where: {
      sessionId,
      isActive: true,
    },
  });

  return sendResponse(res, status.OK, 'Messages retrieved', {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const { sessionId } = req.params;

  await prisma.chatMessage.updateMany({
    where: {
      sessionId,
      userId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return sendResponse(res, status.OK, 'Messages marked as read', null);
});

export const assignAdmin = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { adminId } = req.body;

  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { adminId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });

  return sendResponse(res, status.OK, 'Admin assigned', session);
});

export const closeSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
  });

  return sendResponse(res, status.OK, 'Session closed', session);
});

export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);

  const count = await prisma.chatMessage.count({
    where: {
      userId: { not: userId },
      isRead: false,
      isActive: true,
      session: {
        userId,
        status: 'OPEN',
      },
    },
  });

  return sendResponse(res, status.OK, 'Unread count retrieved', { count });
});

