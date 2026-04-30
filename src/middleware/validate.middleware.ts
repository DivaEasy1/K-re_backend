import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

const isProduction = process.env.NODE_ENV === 'production';

export const validateMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        // In production, don't expose validation field details
        if (isProduction) {
          return sendError(res, 'Données invalides', 400);
        }

        const details = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(res, 'Données invalides', 400, details);
      }

      req.body = result.data;
      next();
    } catch (error) {
      sendError(res, 'Erreur de validation', 500);
    }
  };
};
