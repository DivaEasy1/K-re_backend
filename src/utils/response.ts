import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, pagination?: any) => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: string, statusCode = 400, details?: any) => {
  const response: ErrorResponse = {
    success: false,
    error,
    ...(details && { details }),
  };
  return res.status(statusCode).json(response);
};
