import { prisma } from '../../infrastructure/db/prisma.client';
import { logger } from '../../config/logger';

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

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  emailVerified: boolean;     
  isActive: boolean;
  lastLoginAt?: Date | null;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userRoles?: any[];             
}

interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isVerified: boolean;
  createdAt: Date;
}

const db = prisma as any;

export class AuthRepository {

  async findById(id: string): Promise<User | null> {
    try {
      return await db.user.findUnique({
        where: { id },
        include: { userRoles: true },   
      });
    } catch (error) {
      logger.error('Error finding user by ID:', toMessage(error));
      throw new AppError('Database error', 500, 'DB_ERROR');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await db.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { userRoles: true },   
      });
    } catch (error) {
      logger.error('Error finding user by email:', toMessage(error));
      throw new AppError('Database error', 500, 'DB_ERROR');
    }
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<User> {
    try {
      return await db.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          emailVerified: false,          
          isActive: true,
        },
        include: { userRoles: true },   
      });
    } catch (error) {
      logger.error('Error creating user:', toMessage(error));
      throw new AppError('Failed to create user', 500, 'CREATE_USER_ERROR');
    }
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    try {
      return await db.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating password:', toMessage(error));
      throw new AppError('Failed to update password', 500, 'UPDATE_PASSWORD_ERROR');
    }
  }

  async updateLastLogin(userId: string): Promise<User> {
    try {
      return await db.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating last login:', toMessage(error));
      throw new AppError('Failed to update last login', 500, 'UPDATE_LAST_LOGIN_ERROR');
    }
  }

  async markEmailAsVerified(userId: string): Promise<User> {
    try {
      return await db.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,     
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error marking email as verified:', toMessage(error));
      throw new AppError('Failed to verify email', 500, 'VERIFY_EMAIL_ERROR');
    }
  }

  async deactivate(userId: string): Promise<User> {
    try {
      return await db.user.update({
        where: { id: userId },
        data: { isActive: false, updatedAt: new Date() },
      });
    } catch (error) {
      logger.error('Error deactivating user:', toMessage(error));
      throw new AppError('Failed to deactivate user', 500, 'DEACTIVATE_USER_ERROR');
    }
  }

  async activate(userId: string): Promise<User> {
    try {
      return await db.user.update({
        where: { id: userId },
        data: { isActive: true, updatedAt: new Date() },
      });
    } catch (error) {
      logger.error('Error activating user:', toMessage(error));
      throw new AppError('Failed to activate user', 500, 'ACTIVATE_USER_ERROR');
    }
  }

  async createPasswordReset(userId: string, token: string): Promise<PasswordReset> {
    try {
      await db.passwordReset.updateMany({
        where: { userId, isUsed: false },
        data: { isUsed: true },
      });

      return await db.passwordReset.create({
        data: {
          userId,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          isUsed: false,
        },
      });
    } catch (error) {
      logger.error('Error creating password reset:', toMessage(error));
      throw new AppError('Failed to create password reset', 500, 'CREATE_PASSWORD_RESET_ERROR');
    }
  }

  async findPasswordResetByToken(token: string): Promise<PasswordReset | null> {
    try {
      return await db.passwordReset.findUnique({ where: { token } });
    } catch (error) {
      logger.error('Error finding password reset:', toMessage(error));
      throw new AppError('Database error', 500, 'DB_ERROR');
    }
  }

  async markPasswordResetAsUsed(id: string): Promise<PasswordReset> {
    try {
      return await db.passwordReset.update({
        where: { id },
        data: { isUsed: true },
      });
    } catch (error) {
      logger.error('Error marking password reset as used:', toMessage(error));
      throw new AppError('Failed to mark password reset as used', 500, 'MARK_RESET_USED_ERROR');
    }
  }

  async createEmailVerification(userId: string, token: string): Promise<EmailVerification> {
    try {
      await db.emailVerification.updateMany({
        where: { userId, isVerified: false },
        data: { isVerified: true },
      });

      return await db.emailVerification.create({
        data: {
          userId,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isVerified: false,
        },
      });
    } catch (error) {
      logger.error('Error creating email verification:', toMessage(error));
      throw new AppError('Failed to create email verification', 500, 'CREATE_EMAIL_VERIFICATION_ERROR');
    }
  }

  async findEmailVerificationByToken(token: string): Promise<EmailVerification | null> {
    try {
      return await db.emailVerification.findUnique({ where: { token } });
    } catch (error) {
      logger.error('Error finding email verification:', toMessage(error));
      throw new AppError('Database error', 500, 'DB_ERROR');
    }
  }

  async markEmailVerificationAsUsed(id: string): Promise<EmailVerification> {
    try {
      return await db.emailVerification.update({
        where: { id },
        data: { isVerified: true },
      });
    } catch (error) {
      logger.error('Error marking email verification as used:', toMessage(error));
      throw new AppError('Failed to mark email verification as used', 500, 'MARK_VERIFICATION_USED_ERROR');
    }
  }

  async deleteExpiredPasswordResets(): Promise<number> {
    try {
      const result = await db.passwordReset.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return result.count;
    } catch (error) {
      logger.error('Error deleting expired password resets:', toMessage(error));
      throw new AppError('Failed to delete expired password resets', 500, 'DELETE_EXPIRED_RESETS_ERROR');
    }
  }

  async deleteExpiredEmailVerifications(): Promise<number> {
    try {
      const result = await db.emailVerification.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return result.count;
    } catch (error) {
      logger.error('Error deleting expired email verifications:', toMessage(error));
      throw new AppError('Failed to delete expired email verifications', 500, 'DELETE_EXPIRED_VERIFICATIONS_ERROR');
    }
  }

  async findInactiveUsers(days: number): Promise<User[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await db.user.findMany({
        where: {
          isActive: true,
          OR: [
            { lastLoginAt: { lt: cutoffDate } },
            { lastLoginAt: null, createdAt: { lt: cutoffDate } },
          ],
        },
      });
    } catch (error) {
      logger.error('Error finding inactive users:', toMessage(error));
      throw new AppError('Failed to find inactive users', 500, 'FIND_INACTIVE_USERS_ERROR');
    }
  }

  async count(): Promise<number> {
    try {
      return await db.user.count();
    } catch (error) {
      logger.error('Error counting users:', toMessage(error));
      throw new AppError('Failed to count users', 500, 'COUNT_USERS_ERROR');
    }
  }

  async countActive(): Promise<number> {
    try {
      return await db.user.count({ where: { isActive: true } });
    } catch (error) {
      logger.error('Error counting active users:', toMessage(error));
      throw new AppError('Failed to count active users', 500, 'COUNT_ACTIVE_USERS_ERROR');
    }
  }

  async countVerified(): Promise<number> {
    try {
      return await db.user.count({ where: { emailVerified: true } }); 
    } catch (error) {
      logger.error('Error counting verified users:', toMessage(error));
      throw new AppError('Failed to count verified users', 500, 'COUNT_VERIFIED_USERS_ERROR');
    }
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<User> {
    try {
      return await db.user.update({
        where: { id: userId },
        data: { ...data, updatedAt: new Date() },
        include: { userRoles: true },
      });
    } catch (error) {
      logger.error('Error updating user profile:', toMessage(error));
      throw new AppError('Failed to update user profile', 500, 'UPDATE_PROFILE_ERROR');
    }
  }
}