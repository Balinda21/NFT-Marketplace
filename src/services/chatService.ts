import { PrismaClient, ChatMessageSenderType } from '@prisma/client';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

/**
 * Send a chat message
 */
export async function sendMessage(
  sessionId: string,
  userId: string,
  message: string,
  senderType: ChatMessageSenderType,
  imageUrl?: string | null
) {
  try {
    // Verify session exists
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        senderType,
        message: message || '', // Allow empty message if image is present
        imageUrl: imageUrl || null,
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

