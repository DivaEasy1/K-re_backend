import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyRefreshToken } from '../utils/jwt';

// Store CSRF tokens in memory (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(sessionId);
    }
  }
}, 60000); // Clean every minute

export const generateCSRFToken = (req: Request): string => {
  // Use refresh token as session identifier (since it's httpOnly)
  const sessionId = req.cookies.refreshToken;

  if (!sessionId) {
    throw new Error('No session found');
  }

  const decoded = verifyRefreshToken(sessionId);
  if (!decoded) {
    throw new Error('Refresh token invalide');
  }

  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  csrfTokens.set(sessionId, { token, expires });

  return token;
};

export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionId = req.cookies.refreshToken;
  const tokenFromHeader = req.headers['x-csrf-token'] as string;

  if (!sessionId || !tokenFromHeader) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing'
    });
  }

  const storedData = csrfTokens.get(sessionId);

  if (!storedData || storedData.token !== tokenFromHeader || storedData.expires < Date.now()) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token invalid or expired'
    });
  }

  next();
};

export const getCSRFToken = (req: Request, res: Response) => {
  try {
    const token = generateCSRFToken(req);
    res.json({ csrfToken: token });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication required for CSRF token'
    });
  }
};