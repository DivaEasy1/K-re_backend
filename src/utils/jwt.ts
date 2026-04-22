import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import prisma from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN as string;

// Hash token using SHA256
export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const storeRefreshToken = async (userId: string, token: string) => {
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Delete old refresh tokens (token rotation)
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  // Store new hashed refresh token
  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  });
};

export const verifyAndDeleteRefreshToken = async (userId: string, token: string) => {
  const hashedToken = hashToken(token);
  const refreshToken = await prisma.refreshToken.findFirst({
    where: { userId, token: hashedToken },
  });

  if (!refreshToken) return null;

  await prisma.refreshToken.delete({
    where: { id: refreshToken.id },
  });

  return refreshToken;
};

export const deleteAllRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
