import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: message,
    code,
    details: err.details || null,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
