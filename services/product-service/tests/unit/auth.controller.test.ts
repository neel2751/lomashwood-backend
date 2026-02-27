

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { commonFixture } from '../fixtures/common.fixture';

describe('Product Service - Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let authController: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
      params: {},
      query: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    mockAuthService = {
      validateToken: jest.fn(),
      validateSession: jest.fn(),
      validateApiKey: jest.fn(),
      getUserById: jest.fn(),
      checkPermission: jest.fn(),
      checkRoleAccess: jest.fn(),
      createSession: jest.fn(),
      terminateSession: jest.fn(),
      refreshSession: jest.fn(),
    };

    authController = {
      authenticate: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const token = extractToken(req);
          if (!token) {
            return res.status(401).json({
              success: false,
              message: 'No authentication token provided',
              code: 'AUTH_TOKEN_MISSING',
            });
          }

          const isValid = await mockAuthService.validateToken(token);
          if (!isValid) {
            return res.status(401).json({
              success: false,
              message: 'Invalid or expired token',
              code: 'AUTH_TOKEN_INVALID',
            });
          }

          next();
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'AUTH_ERROR',
          });
        }
      },

      validateSession: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const sessionId = req.headers['x-session-id'] as string;
          if (!sessionId) {
            return res.status(401).json({
              success: false,
              message: 'No session ID provided',
              code: 'SESSION_ID_MISSING',
            });
          }

          const session = await mockAuthService.validateSession(sessionId);
          if (!session) {
            return res.status(401).json({
              success: false,
              message: 'Invalid or expired session',
              code: 'SESSION_INVALID',
            });
          }

          req.user = session.user;
          next();
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'SESSION_ERROR',
          });
        }
      },

      validateApiKey: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const apiKey = req.headers['x-api-key'] as string;
          if (!apiKey) {
            return res.status(401).json({
              success: false,
              message: 'No API key provided',
              code: 'API_KEY_MISSING',
            });
          }

          const isValid = await mockAuthService.validateApiKey(apiKey);
          if (!isValid) {
            return res.status(401).json({
              success: false,
              message: 'Invalid API key',
              code: 'API_KEY_INVALID',
            });
          }

          next();
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'API_KEY_ERROR',
          });
        }
      },

      requireRole: (allowedRoles: string[]) => {
        return async (req: Request, res: Response, next: NextFunction) => {
          try {
            if (!req.user) {
              return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
              });
            }

            const hasAccess = await mockAuthService.checkRoleAccess(req.user, allowedRoles);
            if (!hasAccess) {
              return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                code: 'FORBIDDEN',
              });
            }

            next();
          } catch (error: any) {
            return res.status(500).json({
              success: false,
              message: error.message,
              code: 'ROLE_CHECK_ERROR',
            });
          }
        };
      },

      requirePermission: (permission: string) => {
        return async (req: Request, res: Response, next: NextFunction) => {
          try {
            if (!req.user) {
              return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
              });
            }

            const hasPermission = await mockAuthService.checkPermission(req.user, permission);
            if (!hasPermission) {
              return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                code: 'FORBIDDEN',
              });
            }

            next();
          } catch (error: any) {
            return res.status(500).json({
              success: false,
              message: error.message,
              code: 'PERMISSION_CHECK_ERROR',
            });
          }
        };
      },

      getCurrentUser: async (req: Request, res: Response) => {
        try {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              message: 'Not authenticated',
              code: 'NOT_AUTHENTICATED',
            });
          }

          const user = await mockAuthService.getUserById(req.user.id);
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found',
              code: 'USER_NOT_FOUND',
            });
          }

          return res.status(200).json({
            success: true,
            data: user,
          });
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'GET_USER_ERROR',
          });
        }
      },

      createSession: async (req: Request, res: Response) => {
        try {
          const { userId, metadata } = req.body;
          if (!userId) {
            return res.status(400).json({
              success: false,
              message: 'User ID is required',
              code: 'VALIDATION_ERROR',
            });
          }

          const session = await mockAuthService.createSession({ userId, metadata });
          return res.status(201).json({
            success: true,
            data: session,
          });
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'SESSION_CREATE_ERROR',
          });
        }
      },

      terminateSession: async (req: Request, res: Response) => {
        try {
          const { sessionId } = req.params;
          if (!sessionId) {
            return res.status(400).json({
              success: false,
              message: 'Session ID is required',
              code: 'VALIDATION_ERROR',
            });
          }

          await mockAuthService.terminateSession(sessionId);
          return res.status(200).json({
            success: true,
            message: 'Session terminated successfully',
          });
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'SESSION_TERMINATE_ERROR',
          });
        }
      },

      refreshSession: async (req: Request, res: Response) => {
        try {
          const { sessionId } = req.body;
          if (!sessionId) {
            return res.status(400).json({
              success: false,
              message: 'Session ID is required',
              code: 'VALIDATION_ERROR',
            });
          }

          const session = await mockAuthService.refreshSession(sessionId);
          if (!session) {
            return res.status(404).json({
              success: false,
              message: 'Session not found or expired',
              code: 'SESSION_NOT_FOUND',
            });
          }

          return res.status(200).json({
            success: true,
            data: session,
          });
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            message: error.message,
            code: 'SESSION_REFRESH_ERROR',
          });
        }
      },
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token successfully', async () => {
      const token = 'valid-token-' + commonFixture.generateId();
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.validateToken.mockResolvedValue(true);

      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      mockRequest.headers = {};

      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authentication token provided',
        code: 'AUTH_TOKEN_MISSING',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const token = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.validateToken.mockResolvedValue(false);

      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const token = 'valid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.validateToken.mockRejectedValue(new Error('Service error'));

      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Service error',
        code: 'AUTH_ERROR',
      });
    });

    it('should extract token from Authorization header', async () => {
      const token = 'test-token-123';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.validateToken.mockResolvedValue(true);

      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
    });
  });

  describe('validateSession', () => {
    it('should validate active session successfully', async () => {
      const sessionId = commonFixture.generateId();
      const mockSession = {
        id: sessionId,
        user: {
          id: commonFixture.generateId(),
          email: commonFixture.generateEmail(),
          role: 'USER',
        },
      };

      mockRequest.headers = {
        'x-session-id': sessionId,
      };

      mockAuthService.validateSession.mockResolvedValue(mockSession);

      await authController.validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateSession).toHaveBeenCalledWith(sessionId);
      expect(mockRequest.user).toEqual(mockSession.user);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without session ID', async () => {
      mockRequest.headers = {};

      await authController.validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No session ID provided',
        code: 'SESSION_ID_MISSING',
      });
    });

    it('should reject invalid session', async () => {
      const sessionId = commonFixture.generateId();
      mockRequest.headers = {
        'x-session-id': sessionId,
      };

      mockAuthService.validateSession.mockResolvedValue(null);

      await authController.validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired session',
        code: 'SESSION_INVALID',
      });
    });

    it('should handle session validation errors', async () => {
      const sessionId = commonFixture.generateId();
      mockRequest.headers = {
        'x-session-id': sessionId,
      };

      mockAuthService.validateSession.mockRejectedValue(new Error('Database error'));

      await authController.validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        code: 'SESSION_ERROR',
      });
    });
  });

  describe('validateApiKey', () => {
    it('should validate API key successfully', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();
      mockRequest.headers = {
        'x-api-key': apiKey,
      };

      mockAuthService.validateApiKey.mockResolvedValue(true);

      await authController.validateApiKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateApiKey).toHaveBeenCalledWith(apiKey);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without API key', async () => {
      mockRequest.headers = {};

      await authController.validateApiKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No API key provided',
        code: 'API_KEY_MISSING',
      });
    });

    it('should reject invalid API key', async () => {
      const apiKey = 'invalid-api-key';
      mockRequest.headers = {
        'x-api-key': apiKey,
      };

      mockAuthService.validateApiKey.mockResolvedValue(false);

      await authController.validateApiKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid API key',
        code: 'API_KEY_INVALID',
      });
    });

    it('should handle API key validation errors', async () => {
      const apiKey = 'lw_live_test';
      mockRequest.headers = {
        'x-api-key': apiKey,
      };

      mockAuthService.validateApiKey.mockRejectedValue(new Error('Validation error'));

      await authController.validateApiKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        code: 'API_KEY_ERROR',
      });
    });
  });

  describe('requireRole', () => {
    it('should allow access for authorized role', async () => {
      mockRequest.user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
      };

      mockAuthService.checkRoleAccess.mockResolvedValue(true);

      const middleware = authController.requireRole(['ADMIN']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.checkRoleAccess).toHaveBeenCalledWith(mockRequest.user, ['ADMIN']);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', async () => {
      mockRequest.user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
      };

      mockAuthService.checkRoleAccess.mockResolvedValue(false);

      const middleware = authController.requireRole(['ADMIN']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    });

    it('should require authentication', async () => {
      mockRequest.user = undefined;

      const middleware = authController.requireRole(['ADMIN']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });

    it('should handle multiple allowed roles', async () => {
      mockRequest.user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'MANAGER',
      };

      mockAuthService.checkRoleAccess.mockResolvedValue(true);

      const middleware = authController.requireRole(['ADMIN', 'MANAGER']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow access with required permission', async () => {
      mockRequest.user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
      };

      mockAuthService.checkPermission.mockResolvedValue(true);

      const middleware = authController.requirePermission('product:create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.checkPermission).toHaveBeenCalledWith(mockRequest.user, 'product:create');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access without required permission', async () => {
      mockRequest.user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
      };

      mockAuthService.checkPermission.mockResolvedValue(false);

      const middleware = authController.requirePermission('product:delete');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    });

    it('should require authentication for permission check', async () => {
      mockRequest.user = undefined;

      const middleware = authController.requirePermission('product:create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user successfully', async () => {
      const userId = commonFixture.generateId();
      const mockUser = {
        id: userId,
        email: commonFixture.generateEmail(),
        role: 'USER',
        createdAt: commonFixture.generatePastDate(),
      };

      mockRequest.user = { id: userId };
      mockAuthService.getUserById.mockResolvedValue(mockUser);

      await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.getUserById).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('should return 401 when not authenticated', async () => {
      mockRequest.user = undefined;

      await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    });

    it('should return 404 when user not found', async () => {
      const userId = commonFixture.generateId();
      mockRequest.user = { id: userId };
      mockAuthService.getUserById.mockResolvedValue(null);

      await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      const userId = commonFixture.generateId();
      const metadata = { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' };
      const mockSession = {
        id: commonFixture.generateId(),
        userId,
        token: 'session-token',
        expiresAt: commonFixture.generateFutureDate(),
      };

      mockRequest.body = { userId, metadata };
      mockAuthService.createSession.mockResolvedValue(mockSession);

      await authController.createSession(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.createSession).toHaveBeenCalledWith({ userId, metadata });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.body = {};

      await authController.createSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('terminateSession', () => {
    it('should terminate session successfully', async () => {
      const sessionId = commonFixture.generateId();
      mockRequest.params = { sessionId };
      mockAuthService.terminateSession.mockResolvedValue(undefined);

      await authController.terminateSession(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.terminateSession).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session terminated successfully',
      });
    });

    it('should return 400 when sessionId is missing', async () => {
      mockRequest.params = {};

      await authController.terminateSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session ID is required',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const sessionId = commonFixture.generateId();
      const mockSession = {
        id: sessionId,
        token: 'new-token',
        expiresAt: commonFixture.generateFutureDate(),
      };

      mockRequest.body = { sessionId };
      mockAuthService.refreshSession.mockResolvedValue(mockSession);

      await authController.refreshSession(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.refreshSession).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });

    it('should return 404 when session not found', async () => {
      const sessionId = commonFixture.generateId();
      mockRequest.body = { sessionId };
      mockAuthService.refreshSession.mockResolvedValue(null);

      await authController.refreshSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found or expired',
        code: 'SESSION_NOT_FOUND',
      });
    });

    it('should return 400 when sessionId is missing', async () => {
      mockRequest.body = {};

      await authController.refreshSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session ID is required',
        code: 'VALIDATION_ERROR',
      });
    });
  });
});

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] || null;
}