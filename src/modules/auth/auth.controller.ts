import { Request, Response } from 'express';
import authService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import logger from '../../config/logger';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`User ${email} logged in`);
    sendSuccess(
      res,
      {
        user: result.user,
      },
      200
    );
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 401);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendError(res, 'Refresh token manquant', 401);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(
      res,
      {
        message: 'Session actualisee',
      },
      200
    );
  } catch (error: any) {
    logger.error(error.message);
    sendError(res, error.message, 401);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    await authService.logout(refreshToken);

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    sendSuccess(res, { message: 'Deconnexion reussie' }, 200);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Non authentifie', 401);
    }

    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, user, 200);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
