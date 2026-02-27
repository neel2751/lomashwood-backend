

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { commonFixture } from '../fixtures/common.fixture';

describe('Product Service - Auth Repository', () => {
  let mockPrismaClient: any;
  let authRepository: any;

  beforeEach(() => {
    mockPrismaClient = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      apiKey: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    authRepository = {
      findUserById: async (id: string) => {
        return mockPrismaClient.user.findUnique({ where: { id } });
      },
      findUserByEmail: async (email: string) => {
        return mockPrismaClient.user.findUnique({ where: { email } });
      },
      findSessionById: async (id: string) => {
        return mockPrismaClient.session.findUnique({ where: { id } });
      },
      findActiveSessionByUserId: async (userId: string) => {
        return mockPrismaClient.session.findFirst({
          where: { userId, isActive: true, expiresAt: { gt: new Date() } },
        });
      },
      createSession: async (data: any) => {
        return mockPrismaClient.session.create({ data });
      },
      updateSession: async (id: string, data: any) => {
        return mockPrismaClient.session.update({ where: { id }, data });
      },
      deleteSession: async (id: string) => {
        return mockPrismaClient.session.delete({ where: { id } });
      },
      deleteUserSessions: async (userId: string) => {
        return mockPrismaClient.session.deleteMany({ where: { userId } });
      },
      findApiKeyByKey: async (key: string) => {
        return mockPrismaClient.apiKey.findUnique({ where: { key } });
      },
      validateApiKey: async (key: string) => {
        const apiKey = await mockPrismaClient.apiKey.findFirst({
          where: { key, isActive: true, expiresAt: { gt: new Date() } },
        });
        return !!apiKey;
      },
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findUserById', () => {
    it('should find user by id successfully', async () => {
      const userId = commonFixture.generateId();
      const mockUser = {
        id: userId,
        email: commonFixture.generateEmail(),
        role: 'USER',
        createdAt: commonFixture.generatePastDate(),
        updatedAt: commonFixture.generateRecentDate(),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await authRepository.findUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      const userId = commonFixture.generateId();

      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await authRepository.findUserById(userId);

      expect(result).toBeNull();
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should handle database errors', async () => {
      const userId = commonFixture.generateId();
      const error = new Error('Database connection failed');

      mockPrismaClient.user.findUnique.mockRejectedValue(error);

      await expect(authRepository.findUserById(userId)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = commonFixture.generateEmail();
      const mockUser = {
        id: commonFixture.generateId(),
        email,
        role: 'USER',
        createdAt: commonFixture.generatePastDate(),
        updatedAt: commonFixture.generateRecentDate(),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await authRepository.findUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null when user not found by email', async () => {
      const email = commonFixture.generateEmail();

      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await authRepository.findUserByEmail(email);

      expect(result).toBeNull();
    });

    it('should handle case-insensitive email lookup', async () => {
      const email = 'TEST@EXAMPLE.COM';
      const mockUser = {
        id: commonFixture.generateId(),
        email: email.toLowerCase(),
        role: 'USER',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await authRepository.findUserByEmail(email);

      expect(result).toEqual(mockUser);
    });
  });

  describe('findSessionById', () => {
    it('should find session by id successfully', async () => {
      const sessionId = commonFixture.generateId();
      const mockSession = {
        id: sessionId,
        userId: commonFixture.generateId(),
        token: 'mock-token-' + commonFixture.generateId(),
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
        createdAt: commonFixture.generatePastDate(),
      };

      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await authRepository.findSessionById(sessionId);

      expect(result).toEqual(mockSession);
      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
    });

    it('should return null when session not found', async () => {
      const sessionId = commonFixture.generateId();

      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await authRepository.findSessionById(sessionId);

      expect(result).toBeNull();
    });

    it('should handle expired session lookup', async () => {
      const sessionId = commonFixture.generateId();
      const mockSession = {
        id: sessionId,
        userId: commonFixture.generateId(),
        token: 'mock-token',
        isActive: true,
        expiresAt: commonFixture.generatePastDate(),
        createdAt: commonFixture.generatePastDate(),
      };

      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await authRepository.findSessionById(sessionId);

      expect(result).toEqual(mockSession);
      expect(result.expiresAt < new Date()).toBe(true);
    });
  });

  describe('findActiveSessionByUserId', () => {
    it('should find active session for user', async () => {
      const userId = commonFixture.generateId();
      const mockSession = {
        id: commonFixture.generateId(),
        userId,
        token: 'mock-token',
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
        createdAt: commonFixture.generatePastDate(),
      };

      mockPrismaClient.session.findFirst.mockResolvedValue(mockSession);

      const result = await authRepository.findActiveSessionByUserId(userId);

      expect(result).toEqual(mockSession);
      expect(mockPrismaClient.session.findFirst).toHaveBeenCalledWith({
        where: { userId, isActive: true, expiresAt: { gt: expect.any(Date) } },
      });
    });

    it('should return null when no active session exists', async () => {
      const userId = commonFixture.generateId();

      mockPrismaClient.session.findFirst.mockResolvedValue(null);

      const result = await authRepository.findActiveSessionByUserId(userId);

      expect(result).toBeNull();
    });

    it('should exclude inactive sessions', async () => {
      const userId = commonFixture.generateId();

      mockPrismaClient.session.findFirst.mockResolvedValue(null);

      const result = await authRepository.findActiveSessionByUserId(userId);

      expect(result).toBeNull();
      expect(mockPrismaClient.session.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should exclude expired sessions', async () => {
      const userId = commonFixture.generateId();

      mockPrismaClient.session.findFirst.mockResolvedValue(null);

      const result = await authRepository.findActiveSessionByUserId(userId);

      expect(result).toBeNull();
      expect(mockPrismaClient.session.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: { gt: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('createSession', () => {
    it('should create new session successfully', async () => {
      const userId = commonFixture.generateId();
      const sessionData = {
        userId,
        token: 'mock-token-' + commonFixture.generateId(),
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
      };

      const mockCreatedSession = {
        id: commonFixture.generateId(),
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.session.create.mockResolvedValue(mockCreatedSession);

      const result = await authRepository.createSession(sessionData);

      expect(result).toEqual(mockCreatedSession);
      expect(mockPrismaClient.session.create).toHaveBeenCalledWith({
        data: sessionData,
      });
    });

    it('should handle session creation with metadata', async () => {
      const sessionData = {
        userId: commonFixture.generateId(),
        token: 'mock-token',
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const mockCreatedSession = {
        id: commonFixture.generateId(),
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.session.create.mockResolvedValue(mockCreatedSession);

      const result = await authRepository.createSession(sessionData);

      expect(result.metadata).toEqual(sessionData.metadata);
    });

    it('should handle database errors during creation', async () => {
      const sessionData = {
        userId: commonFixture.generateId(),
        token: 'mock-token',
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
      };

      const error = new Error('Unique constraint violation');
      mockPrismaClient.session.create.mockRejectedValue(error);

      await expect(authRepository.createSession(sessionData)).rejects.toThrow(
        'Unique constraint violation'
      );
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const sessionId = commonFixture.generateId();
      const updateData = {
        isActive: false,
        lastAccessedAt: new Date(),
      };

      const mockUpdatedSession = {
        id: sessionId,
        userId: commonFixture.generateId(),
        token: 'mock-token',
        ...updateData,
        expiresAt: commonFixture.generateFutureDate(),
        createdAt: commonFixture.generatePastDate(),
        updatedAt: new Date(),
      };

      mockPrismaClient.session.update.mockResolvedValue(mockUpdatedSession);

      const result = await authRepository.updateSession(sessionId, updateData);

      expect(result).toEqual(mockUpdatedSession);
      expect(mockPrismaClient.session.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: updateData,
      });
    });

    it('should deactivate session', async () => {
      const sessionId = commonFixture.generateId();
      const updateData = { isActive: false };

      const mockUpdatedSession = {
        id: sessionId,
        userId: commonFixture.generateId(),
        token: 'mock-token',
        isActive: false,
        expiresAt: commonFixture.generateFutureDate(),
        createdAt: commonFixture.generatePastDate(),
        updatedAt: new Date(),
      };

      mockPrismaClient.session.update.mockResolvedValue(mockUpdatedSession);

      const result = await authRepository.updateSession(sessionId, updateData);

      expect(result.isActive).toBe(false);
    });

    it('should handle non-existent session update', async () => {
      const sessionId = commonFixture.generateId();
      const updateData = { isActive: false };

      const error = new Error('Record not found');
      mockPrismaClient.session.update.mockRejectedValue(error);

      await expect(
        authRepository.updateSession(sessionId, updateData)
      ).rejects.toThrow('Record not found');
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      const sessionId = commonFixture.generateId();
      const mockDeletedSession = {
        id: sessionId,
        userId: commonFixture.generateId(),
        token: 'mock-token',
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
        createdAt: commonFixture.generatePastDate(),
        updatedAt: commonFixture.generateRecentDate(),
      };

      mockPrismaClient.session.delete.mockResolvedValue(mockDeletedSession);

      const result = await authRepository.deleteSession(sessionId);

      expect(result).toEqual(mockDeletedSession);
      expect(mockPrismaClient.session.delete).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
    });

    it('should handle non-existent session deletion', async () => {
      const sessionId = commonFixture.generateId();

      const error = new Error('Record not found');
      mockPrismaClient.session.delete.mockRejectedValue(error);

      await expect(authRepository.deleteSession(sessionId)).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all user sessions successfully', async () => {
      const userId = commonFixture.generateId();
      const mockDeleteResult = { count: 3 };

      mockPrismaClient.session.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await authRepository.deleteUserSessions(userId);

      expect(result).toEqual(mockDeleteResult);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return zero count when user has no sessions', async () => {
      const userId = commonFixture.generateId();
      const mockDeleteResult = { count: 0 };

      mockPrismaClient.session.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await authRepository.deleteUserSessions(userId);

      expect(result.count).toBe(0);
    });

    it('should handle database errors during bulk deletion', async () => {
      const userId = commonFixture.generateId();
      const error = new Error('Database error');

      mockPrismaClient.session.deleteMany.mockRejectedValue(error);

      await expect(authRepository.deleteUserSessions(userId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('findApiKeyByKey', () => {
    it('should find API key successfully', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();
      const mockApiKey = {
        id: commonFixture.generateId(),
        key: apiKey,
        name: 'Production API Key',
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
        createdAt: commonFixture.generatePastDate(),
      };

      mockPrismaClient.apiKey.findUnique.mockResolvedValue(mockApiKey);

      const result = await authRepository.findApiKeyByKey(apiKey);

      expect(result).toEqual(mockApiKey);
      expect(mockPrismaClient.apiKey.findUnique).toHaveBeenCalledWith({
        where: { key: apiKey },
      });
    });

    it('should return null when API key not found', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();

      mockPrismaClient.apiKey.findUnique.mockResolvedValue(null);

      const result = await authRepository.findApiKeyByKey(apiKey);

      expect(result).toBeNull();
    });
  });

  describe('validateApiKey', () => {
    it('should validate active API key', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();
      const mockApiKey = {
        id: commonFixture.generateId(),
        key: apiKey,
        isActive: true,
        expiresAt: commonFixture.generateFutureDate(),
      };

      mockPrismaClient.apiKey.findFirst.mockResolvedValue(mockApiKey);

      const result = await authRepository.validateApiKey(apiKey);

      expect(result).toBe(true);
      expect(mockPrismaClient.apiKey.findFirst).toHaveBeenCalledWith({
        where: {
          key: apiKey,
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('should reject inactive API key', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();

      mockPrismaClient.apiKey.findFirst.mockResolvedValue(null);

      const result = await authRepository.validateApiKey(apiKey);

      expect(result).toBe(false);
    });

    it('should reject expired API key', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();

      mockPrismaClient.apiKey.findFirst.mockResolvedValue(null);

      const result = await authRepository.validateApiKey(apiKey);

      expect(result).toBe(false);
    });

    it('should handle database errors during validation', async () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();
      const error = new Error('Database connection failed');

      mockPrismaClient.apiKey.findFirst.mockRejectedValue(error);

      await expect(authRepository.validateApiKey(apiKey)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});