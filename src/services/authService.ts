import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import status from 'http-status';
import prisma from '@/config/prisma';
import config from '@/config/config';
import { findUserByEmail, updateLastLogin } from '@/utils/userUtils';
import ApiError from '@/utils/ApiError';
import { ERROR_CODES } from '@/utils/errorCodes';

// Initialize Google OAuth client
const googleClient = config.google ? new OAuth2Client(config.google.client_id) : null;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface GoogleUserInfo {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  imageUrl?: string;
}

/**
 * Generate JWT tokens for user authentication
 */
const generateTokens = (userId: string): AuthTokens => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: '30d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: '365d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
  };
};

/**
 * Google OAuth authentication
 */
export const googleAuth = async (googleToken: string) => {
  if (!googleClient) {
    throw new ApiError(status.BAD_REQUEST, 'Google OAuth not configured', ERROR_CODES.VALIDATION_ERROR);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: googleToken,
    audience: config.google!.client_id,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new ApiError(status.BAD_REQUEST, 'Invalid Google token', ERROR_CODES.INVALID_GOOGLE_TOKEN);
  }

  const googleUserInfo: GoogleUserInfo = {
    email: payload.email,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    googleId: payload.sub,
    imageUrl: payload.picture,
  };

  // Find or create user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: googleUserInfo.email },
        { googleId: googleUserInfo.googleId },
      ],
    },
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: googleUserInfo.email,
        firstName: googleUserInfo.firstName,
        lastName: googleUserInfo.lastName,
        googleId: googleUserInfo.googleId,
        imageUrl: googleUserInfo.imageUrl,
        isVerified: true,
      } as any,
    });
  } else {
    // Update Google ID if missing
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUserInfo.googleId },
      });
    }
  }

  await updateLastLogin(user.id);
  const tokens = generateTokens(user.id);

  return {
    status: 'success',
    message: 'Google authentication successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        imageUrl: user.imageUrl,
        isVerified: user.isVerified,
      },
      ...tokens,
    },
  };
};

/**
 * Email/password authentication
 */
export const passwordAuth = async (email: string, password: string) => {
  const { user } = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  if (!user.password) {
    throw new ApiError(status.BAD_REQUEST, 'Password authentication not enabled for this account', ERROR_CODES.PASSWORD_AUTH_DISABLED);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(status.BAD_REQUEST, 'Invalid password', ERROR_CODES.INVALID_PASSWORD);
  }

  await updateLastLogin(user.id);
  const tokens = generateTokens(user.id);

  return {
    status: 'success',
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        imageUrl: user.imageUrl,
        isVerified: user.isVerified,
      },
      ...tokens,
    },
  };
};

/**
 * Register new user with email and password
 */
export const registerUser = async (userData: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}) => {
  const { firstName, lastName, email, password } = userData;

  if (!email || !password) {
    throw new ApiError(status.BAD_REQUEST, 'Email and password are required', ERROR_CODES.VALIDATION_ERROR);
  }

  // Check if user already exists
  const { user: existingUser } = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(status.BAD_REQUEST, 'User with this email already exists', ERROR_CODES.EMAIL_ALREADY_EXISTS);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      isVerified: true,
    } as any,
  });

  return {
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
    },
  };
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string) => {
  const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;

  if (decoded.type !== 'refresh') {
    throw new ApiError(status.BAD_REQUEST, 'Invalid refresh token', ERROR_CODES.INVALID_REFRESH_TOKEN);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId, isActive: true },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  const tokens = generateTokens(user.id);

  return {
    status: 'success',
    message: 'Token refreshed successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    },
  };
};

/**
 * Get current user
 */
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      imageUrl: true,
      isVerified: true,
      accountBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  return {
    status: 'success',
    message: 'User profile retrieved successfully',
    data: { user },
  };
};
