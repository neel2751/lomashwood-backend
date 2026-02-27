import { AuthRepository } from './auth.repository';
import { SessionRepository } from '../sessions/session.repository';
import { hashPassword, comparePassword } from '../../infrastructure/auth/password';
import { logger } from '../../config/logger';
import * as crypto from 'crypto';

class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  emailVerified: boolean;      
  isActive: boolean;
  roles?: string[];
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const AuthMapper = {
  toUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerified: user.emailVerified,         
      isActive: user.isActive,
      roles: user.userRoles?.map((r: any) => r.role?.name ?? r.name) ?? [],
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};

const JWT_SECRET         = process.env['JWT_SECRET']         ?? 'changeme-secret';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'changeme-refresh-secret';

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function signToken(payload: object, secret: string, expiresInSeconds: number): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64UrlEncode(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }));
  const sig = crypto.createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${sig}`;
}

function verifyTokenSignature(token: string, secret: string): any | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expected = crypto.createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (signature !== expected) return null;
    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function generateAccessToken(payload: { id: string; email: string; roles: string[] }): string {
  return signToken(payload, JWT_SECRET, 3600); // 1 hour
}

function generateRefreshToken(payload: { id: string; email: string }): string {
  return signToken(payload, JWT_REFRESH_SECRET, 7 * 24 * 3600); // 7 days
}

function verifyToken(token: string): any {
  return verifyTokenSignature(token, JWT_REFRESH_SECRET);
}

const tokenBlacklist = new Set<string>();

function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function addToBlacklist(token: string): Promise<void> {
  tokenBlacklist.add(token);
}

async function isBlacklisted(token: string): Promise<boolean> {
  return tokenBlacklist.has(token);
}

function extractRoleNames(user: any): string[] {
  if (Array.isArray(user.userRoles)) {
    return user.userRoles.map((r: any) => r.role?.name ?? r.name ?? '');
  }
  if (Array.isArray(user.roles)) {
    return user.roles.map((r: any) => r.name ?? r);
  }
  return [];
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async register(input: RegisterInput): Promise<{ user: UserProfile; message: string }> {
    try {
      const existingUser = await this.authRepository.findByEmail(input.email);
      if (existingUser) {
        throw new AppError('User with this email already exists', 409, 'USER_ALREADY_EXISTS');
      }

      const hashedPassword = await hashPassword(input.password);

      const user = await this.authRepository.create({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      });

      const verificationToken = generateEmailVerificationToken();
      await this.authRepository.createEmailVerification(user.id, verificationToken);

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: AuthMapper.toUserProfile(user),
        message: 'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      logger.error('Register error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async login(input: LoginInput): Promise<LoginResponse> {
    try {
      const user = await this.authRepository.findByEmail(input.email);
      if (!user) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
      }

      const isPasswordValid = await comparePassword(input.password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.emailVerified) {              
        logger.warn(`Login attempt with unverified email: ${user.email}`);
      }

      const roleNames = extractRoleNames(user);

      const accessToken  = generateAccessToken({ id: user.id, email: user.email, roles: roleNames });
      const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

      await this.sessionRepository.create({
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isValid: true,
      });

      await this.authRepository.updateLastLogin(user.id);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: AuthMapper.toUserProfile(user),
        accessToken,
        refreshToken,
        expiresIn: 3600,
      };
    } catch (error) {
      logger.error('Login error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async logout(token: string): Promise<void> {
    try {
      await addToBlacklist(token);

      if (typeof (this.sessionRepository as any).deleteByToken === 'function') {
        await (this.sessionRepository as any).deleteByToken(token);
      }

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const decoded = verifyToken(refreshToken);
      if (!decoded?.id) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      if (await isBlacklisted(refreshToken)) {
        throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
      }

      const session = await this.sessionRepository.findByRefreshToken(refreshToken);
      if (!session) {
        throw new AppError('Session not found', 401, 'SESSION_NOT_FOUND');
      }

      if (new Date() > session.expiresAt) {
        await this.sessionRepository.delete(session.id);
        throw new AppError('Session expired', 401, 'SESSION_EXPIRED');
      }

      const user = await this.authRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
      }

      const roleNames = extractRoleNames(user);

      const newAccessToken  = generateAccessToken({ id: user.id, email: user.email, roles: roleNames });
      const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email });

      await this.sessionRepository.update(session.id, {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await addToBlacklist(refreshToken);

      logger.info(`Token refreshed for user: ${user.id}`);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 3600 };
    } catch (error) {
      logger.error('RefreshToken error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      return AuthMapper.toUserProfile(user);
    } catch (error) {
      logger.error('GetUserProfile error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      const resetToken = generatePasswordResetToken();
      await this.authRepository.createPasswordReset(user.id, resetToken);

      logger.info(`Password reset token generated for: ${email}`);
    } catch (error) {
      logger.error('ForgotPassword error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const resetRecord = await this.authRepository.findPasswordResetByToken(token);
      if (!resetRecord) {
        throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
      }
      if (new Date() > resetRecord.expiresAt) {
        throw new AppError('Reset token has expired', 400, 'RESET_TOKEN_EXPIRED');
      }
      if (resetRecord.isUsed) {
        throw new AppError('Reset token has already been used', 400, 'RESET_TOKEN_USED');
      }

      const hashedPassword = await hashPassword(newPassword);
      await this.authRepository.updatePassword(resetRecord.userId, hashedPassword);
      await this.authRepository.markPasswordResetAsUsed(resetRecord.id);
      await this.sessionRepository.deleteAllByUserId(resetRecord.userId);

      logger.info(`Password reset successfully for user: ${resetRecord.userId}`);
    } catch (error) {
      logger.error('ResetPassword error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const verificationRecord = await this.authRepository.findEmailVerificationByToken(token);
      if (!verificationRecord) {
        throw new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
      }
      if (new Date() > verificationRecord.expiresAt) {
        throw new AppError('Verification token has expired', 400, 'VERIFICATION_TOKEN_EXPIRED');
      }
      if (verificationRecord.isVerified) {
        throw new AppError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED');
      }

      await this.authRepository.markEmailAsVerified(verificationRecord.userId);
      await this.authRepository.markEmailVerificationAsUsed(verificationRecord.id);

      logger.info(`Email verified for user: ${verificationRecord.userId}`);
    } catch (error) {
      logger.error('VerifyEmail error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) {
        logger.warn(`Verification email requested for non-existent email: ${email}`);
        return;
      }

      if (user.emailVerified) {              
        throw new AppError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED');
      }

      const verificationToken = generateEmailVerificationToken();
      await this.authRepository.createEmailVerification(user.id, verificationToken);

      logger.info(`Verification email resent to: ${email}`);
    } catch (error) {
      logger.error('ResendVerificationEmail error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
      }

      const hashedPassword = await hashPassword(newPassword);
      await this.authRepository.updatePassword(userId, hashedPassword);

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('ChangePassword error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}