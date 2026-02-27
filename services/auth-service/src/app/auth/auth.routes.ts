import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SessionRepository } from '../sessions/session.repository';
import { ZodSchema } from 'zod';
import { 
  RegisterSchema, 
  LoginSchema, 
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  ChangePasswordSchema 
} from './auth.schemas';


function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error,
        timestamp: new Date().toISOString(),
      });
    }
  };
}


function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    
    
    

    (req as any).token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}



export function createAuthRouter(): Router {
  const router = Router();

  
  
  const { prisma } = require('../../infrastructure/db/prisma.client');

  const authRepository = new AuthRepository();
  const sessionRepository = new SessionRepository(prisma);
  const authService = new AuthService(authRepository, sessionRepository);
  const authController = new AuthController(authService);


  router.post(
    '/register',
    validateRequest(RegisterSchema),
    authController.register
  );

  router.post(
    '/login',
    validateRequest(LoginSchema),
    authController.login
  );

  router.post(
    '/refresh',
    validateRequest(RefreshTokenSchema),
    authController.refreshToken
  );

  
  router.post(
    '/forgot-password',
    validateRequest(ForgotPasswordSchema),
    authController.forgotPassword
  );

  
  router.post(
    '/reset-password',
    validateRequest(ResetPasswordSchema),
    authController.resetPassword
  );


  
  router.post(
    '/verify-email',
    validateRequest(VerifyEmailSchema),
    authController.verifyEmail
  );

  
  
  router.post(
    '/resend-verification',
    authController.resendVerification
  );

  

  
  router.get(
    '/me',
    authMiddleware,
    authController.getMe
  );

 
  router.post(
    '/logout',
    authMiddleware,
    authController.logout
  );

 
  
  router.post(
    '/change-password',
    authMiddleware,
    validateRequest(ChangePasswordSchema),
    authController.changePassword
  );

  return router;
}