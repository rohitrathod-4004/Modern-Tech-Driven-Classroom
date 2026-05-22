import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '@classroom/shared';

const handler = () => {
  throw new AppError('Too many requests, please try again later.', 429, ErrorCodes.TOO_MANY_REQUESTS);
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // Very high limit for local dev
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
