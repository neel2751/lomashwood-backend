import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  ChangePasswordSchema,
} from './auth.schemas';
import { logger } from '../../config/logger';


class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}



interface AuthRefreshResult {
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

 
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = RegisterSchema.parse(req.body);

      const result = await this.authService.register(validatedData);

      logger.info(`User registered successfully: ${validatedData.email}`);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };


  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = LoginSchema.parse(req.body);

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await this.authService.login({
        ...validatedData,
        ipAddress,
        userAgent,
      });

      logger.info(`User logged in successfully: ${validatedData.email}`);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        await this.authService.logout(token);
      }

      res.clearCookie('refreshToken');

      logger.info('User logged out successfully');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };


  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken: string = req.cookies['refreshToken'] || req.body['refreshToken'];

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
      }

      RefreshTokenSchema.parse({ refreshToken });

      const result = (await this.authService.refreshToken(refreshToken) as unknown) as AuthRefreshResult;

      logger.info('Token refreshed successfully');

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

 
  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const user = await this.authService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };


  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = ForgotPasswordSchema.parse(req.body);

      await this.authService.forgotPassword(validatedData.email);

      logger.info(`Password reset requested for: ${validatedData.email}`);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  
  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = ResetPasswordSchema.parse(req.body);

      await this.authService.resetPassword(
        validatedData.token,
        validatedData.newPassword
      );

      logger.info('Password reset successfully');

      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

 
  verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = VerifyEmailSchema.parse(req.body);

      await this.authService.verifyEmail(validatedData.token);

      logger.info('Email verified successfully');

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

 
  resendVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');
      }

      await this.authService.resendVerificationEmail(email);

      logger.info(`Verification email resent to: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Verification email sent',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const validatedData = ChangePasswordSchema.parse(req.body);

      await this.authService.changePassword(
        userId,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      logger.info(`Password changed for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}