import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { env } from '../../config/env';

export class AuthController {
  private static setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  static async register(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await AuthService.register(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    AuthController.setRefreshCookie(res, refreshToken);

    res.status(201).json({
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          organizationId: user.organizationId?.toString(),
          walletId: user.walletId?.toString(),
          enrolledCourses: user.enrolledCourses,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  }

  static async login(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await AuthService.login(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    AuthController.setRefreshCookie(res, refreshToken);

    res.status(200).json({
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          organizationId: user.organizationId?.toString(),
          walletId: user.walletId?.toString(),
          enrolledCourses: user.enrolledCourses,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  }

  static async refresh(req: Request, res: Response) {
    const oldRefreshToken = req.cookies.refreshToken;
    
    if (!oldRefreshToken) {
      return res.status(401).json({ error: 'No refresh token provided', code: 'NO_REFRESH_TOKEN' });
    }

    const { accessToken, refreshToken } = await AuthService.refresh(
      oldRefreshToken,
      req.ip,
      req.headers['user-agent']
    );

    AuthController.setRefreshCookie(res, refreshToken);

    res.status(200).json({
      data: {
        accessToken
      }
    });
  }

  static async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    
    res.clearCookie('refreshToken');
    res.status(200).json({ data: { message: 'Logged out successfully' } });
  }

  static async me(req: Request, res: Response) {
    // req.user is guaranteed to be set by authenticate middleware
    // We could fetch full user info here if needed, but we keep it minimal per constraints
    // Actually, usually GET /me returns the full DTO. Let's return what we have in req.user
    // or fetch from DB if we need full DTO fields (name, enrolledCourses, etc).
    // Let's assume we return minimal for now, or fetch from DB to be complete.
    const { User } = await import('../../models/User');
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    res.status(200).json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          organizationId: user.organizationId?.toString(),
          walletId: user.walletId?.toString(),
          enrolledCourses: user.enrolledCourses,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  }
}
