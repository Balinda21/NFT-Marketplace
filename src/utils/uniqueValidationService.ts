import prisma from '../config/prisma';
import ApiError from './ApiError';
import { ERROR_CODES } from './errorCodes';
import httpStatus from 'http-status';

class UniqueValidationService {
  async validateUniqueEmail(email: string, excludeUserId?: string): Promise<void> {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
    });

    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, ERROR_CODES.EMAIL_ALREADY_EXISTS, 'Email already exists');
    }
  }

  async validateUniquePhone(phone: string, excludeUserId?: string): Promise<void> {
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: {
          equals: phone,
        },
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
    });

    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, ERROR_CODES.PHONE_ALREADY_EXISTS || 'E1008', 'Phone already exists');
    }
  }
}

export default new UniqueValidationService();

