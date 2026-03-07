import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWTPayload } from '@/types/auth';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export class SecurityUtils {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'lomashwood-auth',
      audience: 'lomashwood-admin'
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: payload.userId, type: 'refresh' },
      JWT_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'lomashwood-auth',
        audience: 'lomashwood-admin'
      } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'lomashwood-auth',
        audience: 'lomashwood-admin'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'lomashwood-auth',
        audience: 'lomashwood-admin'
      }) as { userId: string; type: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateSecureToken(): string {
    return uuidv4();
  }

  static async hashAnswer(answer: string): Promise<string> {
    return bcrypt.hash(answer.toLowerCase().trim(), SALT_ROUNDS);
  }

  static async compareAnswer(answer: string, hash: string): Promise<boolean> {
    return bcrypt.compare(answer.toLowerCase().trim(), hash);
  }

  static generateEmailVerificationToken(): string {
    return uuidv4();
  }

  static generatePasswordResetToken(): string {
    return uuidv4();
  }

  static isStrongPassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasNonalphas
    );
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}
