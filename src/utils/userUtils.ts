import { User } from '@prisma/client';
import prisma from '@/config/prisma';

/**
 * Normalizes email by trimming and converting to lowercase
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

interface FindUserResult {
  user: User | null;
  matchType: 'email' | null;
}

/**
 * Finds a user by email
 */
export const findUserByEmail = async (email: string): Promise<FindUserResult> => {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  return {
    user,
    matchType: user ? 'email' : null,
  };
};

/**
 * Updates user's last login time
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
};
