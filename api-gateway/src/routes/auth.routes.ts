import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const validatorModule = require('../validators/auth.validator');
const loginSchema = validatorModule.loginSchema || validatorModule.default?.loginSchema;
const registerSchema = validatorModule.registerSchema || validatorModule.default?.registerSchema;

const authModule = require('../services/auth.client');
const authClient = authModule.default || authModule;

const router = Router();

router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id ?? '';
    const response = await authClient.logout(userId, req.headers.authorization ?? '');
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id ?? '';
    const response = await authClient.getCurrentUser(userId);
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.refreshToken(req.body.refreshToken);
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.resetPassword(req.body);
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.verifyEmail(req.body.token);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-verification', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await authClient.resendVerification(req.body.email);
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/change-password', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id ?? '';
    const response = await authClient.changePassword(
      userId,
      req.body,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sessions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id ?? '';
    const response = await authClient.getUserSessions(userId, req.headers.authorization ?? '');
    res.status(200).json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id ?? '';
    const response = await authClient.revokeSession(
      userId,
      req.params['sessionId'],
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/sessions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id ?? '';
    const response = await authClient.revokeAllSessions(
      userId,
      req.headers.authorization ?? ''
    );
    res.status(200).json({
      success: true,
      message: 'All sessions revoked successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;