import { Request, Response } from 'express';
import logger from '../config/logger';
import { sendError } from '../utils/response';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: Function
) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  sendError(res, err.message || 'Erreur serveur', err.statusCode || 500);
};
