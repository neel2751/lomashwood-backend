import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session.service';
import {
  GetSessionsQuerySchema,
  RevokeSessionSchema,
  RevokeAllSessionsSchema,
  UpdateSessionSchema,
} from './session.schemas';
import { SESSION_CONSTANTS, SESSION_MESSAGES } from './session.constants';
import {
  AuthenticationError,
  SessionNotFoundError,
  BadRequestError,
  PermissionDeniedError,
} from '../../shared/errors';
import { logger } from '../../config/logger';



type AsyncRequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: AsyncRequestHandler) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  
  currentSession?: {
    id: string;
  };
}

export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  getSessions = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    const query = GetSessionsQuerySchema.parse(req.query);

    logger.info(`Fetching sessions for user ${userId}`);

    const result = await this.sessionService.getUserSessions(
      userId,
      {
        includeExpired: query.includeExpired,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      { page: query.page, limit: query.limit }
    );

    logger.info(`Fetched ${result.data.length} of ${result.meta.total} sessions for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.INFO.NO_SESSIONS_FOUND,
      data: result.data,
      meta: result.meta,
    });
  });

  getCurrentSession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const sessionId = req.currentSession?.id;

    if (!userId || !sessionId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Fetching current session ${sessionId} for user ${userId}`);

    const session = await this.sessionService.getSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError(SESSION_CONSTANTS.ERRORS.SESSION_NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new PermissionDeniedError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Fetched current session ${sessionId} for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSION_VALIDATED,
      data: session,
    });
  });

  getSessionById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    
    const sessionId = req.params['id'] as string;

    if (!userId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    logger.info(`Fetching session ${sessionId} for user ${userId}`);

    const session = await this.sessionService.getSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError(SESSION_CONSTANTS.ERRORS.SESSION_NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new PermissionDeniedError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Fetched session ${sessionId} for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSION_VALIDATED,
      data: session,
    });
  });

  revokeSession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const currentSessionId = req.currentSession?.id;
    
    const sessionIdToRevoke = req.params['id'] as string;

    if (!userId || !currentSessionId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    if (!sessionIdToRevoke) {
      throw new BadRequestError('Session ID is required');
    }

    const body = RevokeSessionSchema.parse(req.body);

    logger.info(`User ${userId} revoking session ${sessionIdToRevoke}`);

    const session = await this.sessionService.getSessionById(sessionIdToRevoke);

    if (!session) {
      throw new SessionNotFoundError(SESSION_CONSTANTS.ERRORS.SESSION_NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new PermissionDeniedError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    if (sessionIdToRevoke === currentSessionId) {
      throw new BadRequestError('Cannot revoke your current session');
    }

    await this.sessionService.revokeSession(sessionIdToRevoke, body.reason);

    logger.info(`Session ${sessionIdToRevoke} revoked by user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSIONS_REVOKED,
    });
  });

  revokeAllSessions = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const currentSessionId = req.currentSession?.id;

    if (!userId || !currentSessionId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    const body = RevokeAllSessionsSchema.parse(req.body);

    logger.info(`User ${userId} revoking all sessions (includeCurrentSession: ${body.includeCurrentSession})`);

    
    const revokedCount = await this.sessionService.revokeAllUserSessions(
      userId,
      body.includeCurrentSession ? undefined : currentSessionId,
      body.reason
    );

    logger.info(`Revoked ${revokedCount} sessions for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSIONS_REVOKED,
      data: { revokedCount },
    });
  });

  updateSession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const sessionId = req.params['id'] as string;

    if (!userId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    const body = UpdateSessionSchema.parse(req.body);

    logger.info(`User ${userId} updating session ${sessionId}`);

    const session = await this.sessionService.getSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError(SESSION_CONSTANTS.ERRORS.SESSION_NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new PermissionDeniedError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    
    const updatedSession = await this.sessionService.updateSession(sessionId, {
      device: body.device,
      location: body.location,
    });

    logger.info(`Session ${sessionId} updated by user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSION_UPDATED,
      data: updatedSession,
    });
  });

  extendSession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const sessionId = req.currentSession?.id;

    if (!userId || !sessionId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`User ${userId} extending session ${sessionId}`);

    const extendedSession = await this.sessionService.extendSession(sessionId);

    logger.info(`Session ${sessionId} extended to ${extendedSession.expiresAt}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.INFO.SESSION_EXTENDED,
      data: extendedSession,
    });
  });

  getSessionStats = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Fetching session statistics for user ${userId}`);

    const stats = await this.sessionService.getSessionStatistics(userId);

    logger.info(`Fetched session statistics for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSION_VALIDATED,
      data: stats,
    });
  });

  verifySession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const sessionId = req.currentSession?.id;

    if (!userId || !sessionId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Verifying session ${sessionId} for user ${userId}`);

    const isValid = await this.sessionService.verifySession(sessionId);

    if (!isValid) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.SESSION_INACTIVE);
    }

    logger.info(`Session ${sessionId} verified for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSION_VALIDATED,
      data: { valid: true, sessionId },
    });
  });

  getActiveDevices = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Fetching active devices for user ${userId}`);

    
    const devices = await this.sessionService.getActiveDevices(userId, req.currentSession?.id);

    logger.info(`Fetched ${devices.length} active devices for user ${userId}`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSION_VALIDATED,
      data: devices,
    });
  });

  cleanupExpiredSessions = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AuthenticationError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new PermissionDeniedError(SESSION_CONSTANTS.ERRORS.UNAUTHORIZED_ACCESS);
    }

    logger.info(`Admin ${userId} triggering expired session cleanup`);

    const cleanedCount = await this.sessionService.cleanupExpiredSessions();

    logger.info(`Cleaned up ${cleanedCount} expired sessions`);

    res.status(SESSION_CONSTANTS.HTTP_STATUS.OK).json({
      success: true,
      message: SESSION_MESSAGES.SUCCESS.SESSIONS_CLEANED,
      data: { cleanedCount },
    });
  });
}