import { Request, Response } from 'express';
import multer from 'multer';
import logger from '../config/logger';
import { sendError } from '../utils/response';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: Function
) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image trop volumineuse. Maximum 5 Mo.'
        : 'Erreur lors du televersement du fichier.';

    logger.error({
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    return sendError(res, message, 400);
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  sendError(res, err.message || 'Erreur serveur', err.statusCode || 500);
};
