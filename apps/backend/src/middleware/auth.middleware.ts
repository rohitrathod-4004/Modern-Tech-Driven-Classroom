import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { UserRole, ErrorCodes } from '@classroom/shared';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Enforce tokenVersion for session invalidation
    const user = await User.findById(decoded.sub).select('tokenVersion');
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError('Session invalidated', 401, ErrorCodes.TOKEN_REVOKED));
    }
    
    // Attach minimal auth context
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401, ErrorCodes.TOKEN_EXPIRED));
    }
    return next(new AppError('Invalid token', 401, ErrorCodes.INVALID_TOKEN));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN));
    }

    next();
  };
};
