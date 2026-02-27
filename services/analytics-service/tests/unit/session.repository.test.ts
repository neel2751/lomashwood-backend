import { SessionRepository } from '../../src/app/tracking/tracking.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    analyticsSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('SessionRepository', () => {
  let sessionRepository: SessionRepository;
  let prisma: jest.Mocked<PrismaClient>;

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
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    sessionRepository = new SessionRepository(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a session in the database', async () => {
      (prisma.analyticsSession.create as jest.Mock).mockResolvedValue(mockSession);

      const dto = {
        userId: 'user-id-1',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        isActive: true,
      };

      const result = await sessionRepository.create(dto);

      expect(prisma.analyticsSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining(dto),
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw on database failure', async () => {
      (prisma.analyticsSession.create as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        sessionRepository.create({
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          ipAddress: '10.0.0.1',
          userAgent: 'Safari/537',
          isActive: true,
        })
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('findById', () => {
    it('should return a session by id', async () => {
      (prisma.analyticsSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await sessionRepository.findById('session-id-1');

      expect(prisma.analyticsSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id-1' },
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null when session does not exist', async () => {
      (prisma.analyticsSession.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await sessionRepository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return paginated sessions', async () => {
      (prisma.analyticsSession.findMany as jest.Mock).mockResolvedValue([mockSession]);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(1);

      const result = await sessionRepository.findMany({ page: 1, limit: 20 });

      expect(prisma.analyticsSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by isActive', async () => {
      (prisma.analyticsSession.findMany as jest.Mock).mockResolvedValue([mockSession]);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(1);

      await sessionRepository.findMany({ page: 1, limit: 20, isActive: true });

      expect(prisma.analyticsSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should apply date range filter', async () => {
      (prisma.analyticsSession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(0);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await sessionRepository.findMany({ page: 1, limit: 20, startDate, endDate });

      expect(prisma.analyticsSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startedAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      );
    });

    it('should correctly compute skip for page 2', async () => {
      (prisma.analyticsSession.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(0);

      await sessionRepository.findMany({ page: 2, limit: 15 });

      expect(prisma.analyticsSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 15, take: 15 })
      );
    });
  });

  describe('findByUserId', () => {
    it('should return sessions belonging to a user', async () => {
      (prisma.analyticsSession.findMany as jest.Mock).mockResolvedValue([mockSession]);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(1);

      const result = await sessionRepository.findByUserId('user-id-1', {
        page: 1,
        limit: 20,
      });

      expect(prisma.analyticsSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-id-1' }),
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findActiveSessions', () => {
    it('should return only active sessions', async () => {
      (prisma.analyticsSession.findMany as jest.Mock).mockResolvedValue([mockSession]);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(1);

      const result = await sessionRepository.findActiveSessions({ page: 1, limit: 20 });

      expect(prisma.analyticsSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
      expect(result.data[0].isActive).toBe(true);
    });
  });

  describe('endSession', () => {
    it('should mark session as ended with endedAt and duration', async () => {
      const endedAt = new Date('2026-01-01T10:30:00Z');
      const endedSession = {
        ...mockSession,
        endedAt,
        duration: 1800000,
        isActive: false,
      };

      (prisma.analyticsSession.update as jest.Mock).mockResolvedValue(endedSession);

      const result = await sessionRepository.endSession('session-id-1', endedAt);

      expect(prisma.analyticsSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id-1' },
        data: expect.objectContaining({
          endedAt,
          isActive: false,
          duration: expect.any(Number),
        }),
      });
      expect(result.isActive).toBe(false);
      expect(result.endedAt).toEqual(endedAt);
    });
  });

  describe('updatePageViewCount', () => {
    it('should increment pageViewCount by 1', async () => {
      const updated = { ...mockSession, pageViewCount: 4 };
      (prisma.analyticsSession.update as jest.Mock).mockResolvedValue(updated);

      const result = await sessionRepository.updatePageViewCount('session-id-1');

      expect(prisma.analyticsSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id-1' },
        data: {
          pageViewCount: { increment: 1 },
        },
      });
      expect(result.pageViewCount).toBe(4);
    });
  });

  describe('countActiveSessions', () => {
    it('should return the count of active sessions', async () => {
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValue(42);

      const result = await sessionRepository.countActiveSessions();

      expect(prisma.analyticsSession.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toBe(42);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete sessions older than the given date', async () => {
      (prisma.analyticsSession.deleteMany as jest.Mock).mockResolvedValue({ count: 25 });

      const cutoff = new Date('2025-06-01');
      const result = await sessionRepository.deleteOlderThan(cutoff);

      expect(prisma.analyticsSession.deleteMany).toHaveBeenCalledWith({
        where: { startedAt: { lt: cutoff } },
      });
      expect(result).toEqual({ count: 25 });
    });
  });

  describe('getSessionStats', () => {
    it('should return aggregated session statistics', async () => {
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValueOnce(1500);
      (prisma.analyticsSession.count as jest.Mock).mockResolvedValueOnce(42);
      (prisma.analyticsSession.aggregate as jest.Mock).mockResolvedValue({
        _avg: { duration: 180000, pageViewCount: 4.2 },
      });
      (prisma.analyticsSession.groupBy as jest.Mock).mockResolvedValue([
        { deviceType: 'desktop', _count: { id: 900 } },
        { deviceType: 'mobile', _count: { id: 525 } },
        { deviceType: 'tablet', _count: { id: 75 } },
      ]);

      const result = await sessionRepository.getSessionStats({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('activeSessions');
      expect(result).toHaveProperty('averageDuration');
      expect(result).toHaveProperty('deviceBreakdown');
    });
  });

  describe('getSessionsByDateRange', () => {
    it('should return grouped session counts per day', async () => {
      (prisma.analyticsSession.groupBy as jest.Mock).mockResolvedValue([
        { startedAt: new Date('2026-01-01'), _count: { id: 120 } },
        { startedAt: new Date('2026-01-02'), _count: { id: 98 } },
      ]);

      const start = new Date('2026-01-01');
      const end = new Date('2026-01-02');

      const result = await sessionRepository.getSessionsByDateRange(start, end);

      expect(prisma.analyticsSession.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startedAt: expect.objectContaining({ gte: start, lte: end }),
          }),
        })
      );
      expect(result).toHaveLength(2);
    });
  });
});