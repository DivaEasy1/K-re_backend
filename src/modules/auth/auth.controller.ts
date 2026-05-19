import { Request, Response } from 'express';
import authService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import logger from '../../config/logger';
import { getJwtExpirationMs } from '../../utils/jwt';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
};

const ACCESS_TOKEN_MAX_AGE = getJwtExpirationMs(process.env.JWT_EXPIRES_IN || '15m');
const REFRESH_TOKEN_MAX_AGE = getJwtExpirationMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d');


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
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
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
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
