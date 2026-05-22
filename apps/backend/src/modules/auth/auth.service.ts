import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '../../models/User';
import { RefreshSession } from '../../models/RefreshSession';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { RegisterSchema, LoginSchema, ErrorCodes } from '@classroom/shared';
import { z } from 'zod';

type RegisterInput = any;
type LoginInput = any;

export class AuthService {
  private static generateTokens(user: IUserDocument) {
    const accessToken = jwt.sign(
      { sub: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    return { accessToken, refreshToken, refreshTokenHash };
  }

  static async register(data: RegisterInput, ipAddress?: string, deviceInfo?: string) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already in use', 400, ErrorCodes.EMAIL_IN_USE);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role
    });

    const { accessToken, refreshToken, refreshTokenHash } = this.generateTokens(user);

    await RefreshSession.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      ipAddress,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return { user, accessToken, refreshToken };
  }

  static async login(data: LoginInput, ipAddress?: string, deviceInfo?: string) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    const { accessToken, refreshToken, refreshTokenHash } = this.generateTokens(user);

    await RefreshSession.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      ipAddress,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user, accessToken, refreshToken };
  }

  static async refresh(oldRefreshToken: string, ipAddress?: string, deviceInfo?: string) {
    const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    
    const session = await RefreshSession.findOne({ tokenHash }).populate<{ userId: IUserDocument }>('userId');
    if (!session) {
      throw new AppError('Invalid refresh token', 401, ErrorCodes.INVALID_TOKEN);
    }

    if (session.isRevoked) {
      // Security measure: Revoked token reuse triggers mass invalidation
      await RefreshSession.updateMany({ userId: session.userId._id }, { isRevoked: true });
      await User.updateOne({ _id: session.userId._id }, { $inc: { tokenVersion: 1 } });
      throw new AppError('Refresh token revoked', 401, ErrorCodes.TOKEN_REVOKED);
    }

    if (session.expiresAt < new Date()) {
      throw new AppError('Refresh token expired', 401, ErrorCodes.TOKEN_EXPIRED);
    }

    const user = session.userId;
    
    // Rotate token
    session.isRevoked = true; // Mark old token as used
    await session.save();

    const { accessToken, refreshToken, refreshTokenHash } = this.generateTokens(user);

    await RefreshSession.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      ipAddress,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { accessToken, refreshToken };
  }

  static async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshSession.updateOne({ tokenHash }, { isRevoked: true });
  }
}
