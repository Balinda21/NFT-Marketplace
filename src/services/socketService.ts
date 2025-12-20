import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '@/config/config';
import prisma from '@/config/prisma';
import logger from '@/config/logger';
import { sendMessage, markMessagesAsRead } from './chatService';
import { ChatMessageSenderType, UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

let io: SocketServer | null = null;

/**
 * Initialize Socket.io server
 */
export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  // Handle multiple frontend URLs (comma-separated)
  const allowedOrigins = config.frontend_url.split(',').map(url => url.trim());
  
  io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (!decoded.userId || decoded.type !== 'access') {
        return next(new Error('Invalid token'));
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
          isActive: true,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userRole = socket.userRole!;

    logger.info(`Socket connected: ${userId} (${userRole})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // If admin, join admin room
    if (userRole === UserRole.ADMIN) {
      socket.join('admin:all');
    }

    // Join user's chat sessions
    socket.on('join-sessions', async () => {
      try {
        // Build where clause based on user role
        const whereClause: any = {
          isActive: true,
        };

        // If user is admin, they can see all sessions
        if (userRole === UserRole.ADMIN) {
          // Admin can access all sessions, no additional where conditions needed
        } else {
          // Regular users can only see their own sessions or sessions where they're assigned as admin
          whereClause.OR = [
            { userId }, // User is the owner
            { adminId: userId }, // User is the assigned admin
          ];
        }

        const sessions = await prisma.chatSession.findMany({
          where: whereClause,
          select: {
            id: true,
          },
        });

        sessions.forEach((session) => {
          socket.join(`session:${session.id}`);
        });

        socket.emit('sessions-joined', { count: sessions.length });
      } catch (error) {
        logger.error('Error joining sessions:', error);
        socket.emit('error', { message: 'Failed to join sessions' });
      }
    });

    // Join a specific chat session
    socket.on('join-session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        // Build access check: user owns session OR is assigned admin OR is an admin
        const whereClause: any = {
          id: sessionId,
          isActive: true,
        };

        // If user is admin, they can access any session
        if (userRole === UserRole.ADMIN) {
          // Admin can access any session, no additional where conditions needed
        } else {
          // Regular users can only access their own sessions or sessions where they're assigned as admin
          whereClause.OR = [
            { userId }, // User is the owner
            { adminId: userId }, // User is the assigned admin
          ];
        }

        // Verify user has access to this session
        const session = await prisma.chatSession.findFirst({
          where: whereClause,
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found or access denied' });
          return;
        }

        socket.join(`session:${sessionId}`);
        socket.emit('session-joined', { sessionId });

        // Notify other participants
        socket.to(`session:${sessionId}`).emit('user-joined', {
          sessionId,
          userId,
        });
      } catch (error) {
        logger.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Send a message
    socket.on('send-message', async (data: { sessionId: string; message?: string; imageUrl?: string; audioUrl?: string }) => {
      try {
        const { sessionId, message, imageUrl, audioUrl } = data;

        if ((!message || !message.trim()) && !imageUrl && !audioUrl) {
          socket.emit('error', { message: 'Message, image, or audio is required' });
          return;
        }

        // Determine sender type
        const senderType =
          userRole === UserRole.ADMIN
            ? ChatMessageSenderType.ADMIN
            : ChatMessageSenderType.USER;

        // Send message via service
        const chatMessage = await sendMessage(sessionId, userId, message?.trim() || '', senderType, imageUrl, audioUrl);

        // Emit to all participants in the session
        io!.to(`session:${sessionId}`).emit('new-message', {
          sessionId,
          message: chatMessage,
        });

        // If user sent message and no admin assigned, notify all admins
        if (senderType === ChatMessageSenderType.USER) {
          const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            select: { adminId: true },
          });

          if (!session?.adminId) {
            io!.to('admin:all').emit('new-chat-request', {
              sessionId,
              userId,
            });
          }
        }
      } catch (error: any) {
        logger.error('Error sending message:', error);
        socket.emit('error', {
          message: error.message || 'Failed to send message',
        });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        await markMessagesAsRead(sessionId, userId);

        // Notify other participants
        socket.to(`session:${sessionId}`).emit('messages-read', {
          sessionId,
          userId,
        });
      } catch (error: any) {
        logger.error('Error marking messages as read:', error);
        socket.emit('error', {
          message: error.message || 'Failed to mark messages as read',
        });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
      const { sessionId, isTyping } = data;
      socket.to(`session:${sessionId}`).emit('user-typing', {
        sessionId,
        userId,
        isTyping,
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  logger.info('Socket.io initialized for real-time chat');
  return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};


