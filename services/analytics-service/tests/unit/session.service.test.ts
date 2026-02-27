import { SessionService } from '../../src/app/tracking/tracking.service';
import { SessionRepository } from '../../src/app/tracking/tracking.repository';

jest.mock('../../src/app/tracking/tracking.repository');

const mockSessionRepository = jest.mocked(SessionRepository);

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockRepo: jest.Mocked<SessionRepository>;

  const mockSession = {
    id: 'session-id-1',
    userId: 'user-id-1',
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    country: 'GB',
    city: 'London',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    referrer: 'https://google.com',
    utmSource: 'google',
    utmMedium: 'organic',
    utmCampaign: null,
    startedAt: new Date('2026-01-01T10:00:00Z'),
    endedAt: null,
    duration: null,
    pageViewCount: 3,
    isActive: true,
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      findByUserId: jest.fn(),
      findActiveSessions: jest.fn(),
      endSession: jest.fn(),
      updatePageViewCount: jest.fn(),
      deleteOlderThan: jest.fn(),
      getSessionStats: jest.fn(),
      getSessionsByDateRange: jest.fn(),
      countActiveSessions: jest.fn(),
    } as unknown as jest.Mocked<SessionRepository>;

    mockSessionRepository.mockImplementation(() => mockRepo);
    sessionService = new SessionService(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should create and return a new session', async () => {
      mockRepo.create.mockResolvedValue(mockSession);

      const dto = {
        userId: 'user-id-1',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        referrer: 'https://google.com',
        utmSource: 'google',
        utmMedium: 'organic',
      };

      const result = await sessionService.startSession(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...dto, isActive: true })
      );
      expect(result).toEqual(mockSession);
    });

    it('should create a session without optional fields', async () => {
      const anonymousSession = { ...mockSession, userId: null };
      mockRepo.create.mockResolvedValue(anonymousSession);

      const dto = {
        deviceType: 'mobile',
        browser: 'Safari',
        os: 'iOS',
        ipAddress: '192.168.1.1',
        userAgent: 'Safari/537.36',
      };

      const result = await sessionService.startSession(dto);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual(anonymousSession);
    });

    it('should throw when repository throws', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB connection failed'));

      await expect(
        sessionService.startSession({
          deviceType: 'desktop',
          browser: 'Firefox',
          os: 'Linux',
          ipAddress: '10.0.0.1',
          userAgent: 'Firefox/100',
        })
      ).rejects.toThrow('DB connection failed');
    });
  });

  describe('endSession', () => {
    it('should end a session and set duration', async () => {
      const endedAt = new Date('2026-01-01T10:30:00Z');
      const endedSession = {
        ...mockSession,
        endedAt,
        duration: 1800000,
        isActive: false,
      };

      mockRepo.endSession.mockResolvedValue(endedSession);

      const result = await sessionService.endSession('session-id-1');

      expect(mockRepo.endSession).toHaveBeenCalledWith(
        'session-id-1',
        expect.any(Date)
      );
      expect(result.isActive).toBe(false);
      expect(result.endedAt).toEqual(endedAt);
    });

    it('should throw when session not found', async () => {
      mockRepo.endSession.mockRejectedValue(new Error('Session not found'));

      await expect(sessionService.endSession('nonexistent')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('getSessionById', () => {
    it('should return a session by id', async () => {
      mockRepo.findById.mockResolvedValue(mockSession);

      const result = await sessionService.getSessionById('session-id-1');

      expect(mockRepo.findById).toHaveBeenCalledWith('session-id-1');
      expect(result).toEqual(mockSession);
    });

    it('should return null when session not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await sessionService.getSessionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSessions', () => {
    it('should return paginated sessions', async () => {
      const paginatedResult = {
        data: [mockSession],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findMany.mockResolvedValue(paginatedResult);

      const result = await sessionService.getSessions({ page: 1, limit: 20 });

      expect(mockRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result).toEqual(paginatedResult);
    });

    it('should pass filter params to repository', async () => {
      const paginatedResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };

      mockRepo.findMany.mockResolvedValue(paginatedResult);

      const params = {
        page: 1,
        limit: 20,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        isActive: true,
      };

      await sessionService.getSessions(params);

      expect(mockRepo.findMany).toHaveBeenCalledWith(params);
    });
  });

  describe('getUserSessions', () => {
    it('should return sessions for a user', async () => {
      const paginatedResult = {
        data: [mockSession],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findByUserId.mockResolvedValue(paginatedResult);

      const result = await sessionService.getUserSessions('user-id-1', {
        page: 1,
        limit: 20,
      });

      expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-id-1', {
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getActiveSessions', () => {
    it('should return currently active sessions', async () => {
      const paginatedResult = {
        data: [mockSession],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findActiveSessions.mockResolvedValue(paginatedResult);

      const result = await sessionService.getActiveSessions({ page: 1, limit: 20 });

      expect(mockRepo.findActiveSessions).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.data[0].isActive).toBe(true);
    });
  });

  describe('countActiveSessions', () => {
    it('should return the count of active sessions', async () => {
      mockRepo.countActiveSessions.mockResolvedValue(42);

      const result = await sessionService.countActiveSessions();

      expect(mockRepo.countActiveSessions).toHaveBeenCalled();
      expect(result).toBe(42);
    });
  });

  describe('incrementPageViewCount', () => {
    it('should increment page view count for a session', async () => {
      const updatedSession = { ...mockSession, pageViewCount: 4 };
      mockRepo.updatePageViewCount.mockResolvedValue(updatedSession);

      const result = await sessionService.incrementPageViewCount('session-id-1');

      expect(mockRepo.updatePageViewCount).toHaveBeenCalledWith('session-id-1');
      expect(result.pageViewCount).toBe(4);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const stats = {
        totalSessions: 1500,
        activeSessions: 42,
        averageDuration: 180000,
        averagePageViews: 4.2,
        bounceRate: 0.35,
        deviceBreakdown: {
          desktop: 0.6,
          mobile: 0.35,
          tablet: 0.05,
        },
      };

      mockRepo.getSessionStats.mockResolvedValue(stats);

      const result = await sessionService.getSessionStats({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(mockRepo.getSessionStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
      expect(result.totalSessions).toBe(1500);
      expect(result.bounceRate).toBe(0.35);
    });
  });

  describe('getSessionsByDateRange', () => {
    it('should return aggregated daily session counts', async () => {
      const aggregated = [
        { date: '2026-01-01', sessions: 120, newUsers: 45 },
        { date: '2026-01-02', sessions: 98, newUsers: 32 },
      ];

      mockRepo.getSessionsByDateRange.mockResolvedValue(aggregated);

      const start = new Date('2026-01-01');
      const end = new Date('2026-01-02');

      const result = await sessionService.getSessionsByDateRange(start, end);

      expect(mockRepo.getSessionsByDateRange).toHaveBeenCalledWith(start, end);
      expect(result).toHaveLength(2);
      expect(result[0].sessions).toBe(120);
    });
  });
});