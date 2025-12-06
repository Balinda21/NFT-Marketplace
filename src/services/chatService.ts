import { ChatSession, ChatMessage, ChatStatus, ChatMessageSenderType, UserRole } from '@prisma/client';
import prisma from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { ERROR_CODES } from '@/utils/errorCodes';
import status from 'http-status';

/**
 * Get or create a chat session for a user
 */
export const getOrCreateChatSession = async (userId: string): Promise<ChatSession> => {
  // Try to find an existing open session
  let session = await prisma.chatSession.findFirst({
    where: {
      userId,
      status: ChatStatus.OPEN,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If no open session exists, create a new one
  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        userId,
        status: ChatStatus.OPEN,
      },
    });
  }

  return session;
};

/**
 * Get all chat sessions for a user
 */
export const getUserChatSessions = async (userId: string) => {
  const sessions = await prisma.chatSession.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
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
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1, // Get only the last message for preview
        select: {
          id: true,
          message: true,
          senderType: true,
          createdAt: true,
          isRead: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  return sessions;
};

/**
 * Get all chat sessions (for admin)
 */
export const getAllChatSessions = async (status?: ChatStatus) => {
  const where: any = {
    isActive: true,
  };

  if (status) {
    where.status = status;
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
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        select: {
          id: true,
          message: true,
          senderType: true,
          createdAt: true,
          isRead: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderType: ChatMessageSenderType.USER,
            },
          },
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  return sessions;
};

/**
 * Get messages for a chat session
 */
export const getChatMessages = async (
  sessionId: string,
  userId: string,
  page: number = 1,
  limit: number = 50
) => {
  // Verify user has access to this session
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      OR: [
        { userId },
        { adminId: userId }, // Admin can also access
      ],
      isActive: true,
    },
  });

  if (!session) {
    throw new ApiError(status.NOT_FOUND, 'Chat session not found', ERROR_CODES.NOT_FOUND);
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
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
        createdAt: 'asc',
      },
      skip,
      take: limit,
    }),
    prisma.chatMessage.count({
      where: {
        sessionId,
        isActive: true,
      },
    }),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Send a message in a chat session
 */
export const sendMessage = async (
  sessionId: string,
  userId: string,
  message: string,
  senderType: ChatMessageSenderType = ChatMessageSenderType.USER
) => {
  // Verify session exists and user has access
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      OR: [
        { userId },
        { adminId: userId },
      ],
      isActive: true,
    },
  });

  if (!session) {
    throw new ApiError(status.NOT_FOUND, 'Chat session not found', ERROR_CODES.NOT_FOUND);
  }

  // Create the message
  const chatMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      userId,
      message: message.trim(),
      senderType,
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
  });

  // Update session's last message time
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { lastMessageAt: new Date() },
  });

  return chatMessage;
};

/**
 * Mark messages as read in a session
 */
export const markMessagesAsRead = async (sessionId: string, userId: string) => {
  // Verify user has access to this session
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      OR: [
        { userId },
        { adminId: userId },
      ],
      isActive: true,
    },
  });

  if (!session) {
    throw new ApiError(status.NOT_FOUND, 'Chat session not found', ERROR_CODES.NOT_FOUND);
  }

  // Determine which messages to mark as read
  // If user is the session owner, mark admin messages as read
  // If user is admin, mark user messages as read
  const senderTypeToMark =
    session.userId === userId
      ? ChatMessageSenderType.ADMIN
      : ChatMessageSenderType.USER;

  await prisma.chatMessage.updateMany({
    where: {
      sessionId,
      senderType: senderTypeToMark,
      isRead: false,
      isActive: true,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
};

/**
 * Assign an admin to a chat session
 */
export const assignAdminToChat = async (sessionId: string, adminId: string) => {
  // Verify admin exists and has admin role
  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  if (!admin) {
    throw new ApiError(status.NOT_FOUND, 'Admin not found', ERROR_CODES.NOT_FOUND);
  }

  // Update session
  const session = await prisma.chatSession.update({
    where: {
      id: sessionId,
      isActive: true,
    },
    data: {
      adminId,
      status: ChatStatus.OPEN,
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

  return session;
};

/**
 * Close a chat session
 */
export const closeChatSession = async (sessionId: string, userId: string) => {
  // Verify user has access
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      OR: [
        { userId },
        { adminId: userId },
      ],
      isActive: true,
    },
  });

  if (!session) {
    throw new ApiError(status.NOT_FOUND, 'Chat session not found', ERROR_CODES.NOT_FOUND);
  }

  // Close the session
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: ChatStatus.CLOSED,
    },
  });

  return { success: true };
};

/**
 * Get unread message count for a user
 */
export const getUnreadMessageCount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return 0;
  }

  if (user.role === UserRole.ADMIN) {
    // For admins, count unread user messages in assigned sessions
    const count = await prisma.chatMessage.count({
      where: {
        session: {
          adminId: userId,
          isActive: true,
          status: ChatStatus.OPEN,
        },
        senderType: ChatMessageSenderType.USER,
        isRead: false,
        isActive: true,
      },
    });
    return count;
  } else {
    // For users, count unread admin messages in their sessions
    const count = await prisma.chatMessage.count({
      where: {
        session: {
          userId,
          isActive: true,
        },
        senderType: ChatMessageSenderType.ADMIN,
        isRead: false,
        isActive: true,
      },
    });
    return count;
  }
};

