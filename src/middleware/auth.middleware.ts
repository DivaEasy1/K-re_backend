import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';
import prisma from '../config/database';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return sendError(res, 'Token manquant', 401);
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return sendError(res, 'Token invalide', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return sendError(res, 'Utilisateur non trouvé', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'SUPER_ADMIN',
    };

    next();
  } catch (error) {
    sendError(res, 'Erreur d\'authentification', 500);
  }
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return sendError(res, 'Accès refusé', 403);
  }
  next();
};
