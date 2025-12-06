import prisma from '../config/prisma';

export interface DeviceInfo {
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const extractDeviceInfo = (req: any): DeviceInfo => {
  return {
    deviceInfo: req.headers['user-agent'] || 'Unknown',
    ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown',
  };
};

export const createUserSession = async (
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
  deviceInfo: DeviceInfo
): Promise<void> => {
  await prisma.userSession.create({
    data: {
      userId,
      accessToken,
      refreshToken,
      deviceInfo: deviceInfo.deviceInfo,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      expiresAt,
    } as any,
  });
};

export const deactivateUserSession = async (accessToken: string): Promise<void> => {
  await prisma.userSession.updateMany({
    where: { accessToken, isActive: true },
    data: { isActive: false },
  });
};

export const deactivateAllUserSessions = async (userId: string): Promise<void> => {
  await prisma.userSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
};

export const getUserActiveSessions = async (userId: string) => {
  return prisma.userSession.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findUserSession = async (refreshToken: string) => {
  return prisma.userSession.findUnique({
    where: { refreshToken },
  });
};

export const deactivateUserSessionByAccessToken = async (accessToken: string): Promise<void> => {
  await deactivateUserSession(accessToken);
};

export const deactivateUserSessionById = async (sessionId: string): Promise<void> => {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
};

export const getUserActiveSessionsWithCurrentDevice = async (userId: string, currentAccessToken: string) => {
  const sessions = await getUserActiveSessions(userId);
  return sessions.map((session) => ({
    ...session,
    isCurrentDevice: session.accessToken === currentAccessToken,
  }));
};

