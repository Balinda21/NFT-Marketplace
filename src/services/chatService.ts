import { PrismaClient, ChatMessageSenderType, UserRole } from '@prisma/client';
import logger from '@/config/logger';
import prisma from '@/config/prisma';

/**
 * Send a chat message
 */
export async function sendMessage(
  sessionId: string,
  userId: string,
  message: string,
  senderType: ChatMessageSenderType,
  imageUrl?: string | null,
  audioUrl?: string | null
) {
  try {
    // Get user role to check admin access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Build access check: user owns session OR is assigned admin OR is an admin
    const whereClause: any = {
      id: sessionId,
      isActive: true,
    };

    // If user is admin, they can send messages to any session
    if (user.role === UserRole.ADMIN) {
      // Admin can access any session, no additional where conditions needed
    } else {
      // Regular users can only send to their own sessions or sessions where they're assigned as admin
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
      throw new Error('Chat session not found or access denied');
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        senderType,
        message: message || '', // Allow empty message if image or audio is present
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
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

    // Update session last message time
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });

    return chatMessage;
  } catch (error: any) {
    logger.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(sessionId: string, userId: string) {
  try {
    await prisma.chatMessage.updateMany({
      where: {
        sessionId,
        userId: { not: userId }, // Mark messages from other users as read
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error: any) {
    logger.error('Error marking messages as read:', error);
    throw error;
  }
}

