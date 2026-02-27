import { PageViewRepository } from '../../src/app/tracking/tracking.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    pageView: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PageViewRepository', () => {
  let pageViewRepository: PageViewRepository;
  let prisma: jest.Mocked<PrismaClient>;

  const mockPageView = {
    id: 'pv-id-1',
    sessionId: 'session-id-1',
    userId: 'user-id-1',
    url: 'https://lomashwood.co.uk/kitchens',
    path: '/kitchens',
    referrer: 'https://google.com',
    userAgent: 'Mozilla/5.0',
    ipAddress: '127.0.0.1',
    duration: 45000,
    timestamp: new Date('2026-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    pageViewRepository = new PageViewRepository(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a page view record', async () => {
      (prisma.pageView.create as jest.Mock).mockResolvedValue(mockPageView);

      const dto = {
        sessionId: 'session-id-1',
        url: 'https://lomashwood.co.uk/kitchens',
        path: '/kitchens',
        referrer: 'https://google.com',
      };

      const result = await pageViewRepository.create(dto);

      expect(prisma.pageView.create).toHaveBeenCalledWith({
        data: expect.objectContaining(dto),
      });
      expect(result).toEqual(mockPageView);
    });

    it('should throw on database error', async () => {
      (prisma.pageView.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        pageViewRepository.create({
          sessionId: 'session-id-1',
          url: 'https://lomashwood.co.uk',
          path: '/',
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should return a page view by id', async () => {
      (prisma.pageView.findUnique as jest.Mock).mockResolvedValue(mockPageView);

      const result = await pageViewRepository.findById('pv-id-1');

      expect(prisma.pageView.findUnique).toHaveBeenCalledWith({
        where: { id: 'pv-id-1' },
      });
      expect(result).toEqual(mockPageView);
    });

    it('should return null when not found', async () => {
      (prisma.pageView.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await pageViewRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return paginated page views', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([mockPageView]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(1);

      const result = await pageViewRepository.findMany({ page: 1, limit: 20 });

      expect(prisma.pageView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should apply date range filter', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([mockPageView]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(1);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await pageViewRepository.findMany({ page: 1, limit: 20, startDate, endDate });

      expect(prisma.pageView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      );
    });

    it('should calculate correct skip offset for page 3', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(0);

      await pageViewRepository.findMany({ page: 3, limit: 10 });

      expect(prisma.pageView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it('should return correct totalPages calculation', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([mockPageView]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(55);

      const result = await pageViewRepository.findMany({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(6);
    });
  });

  describe('findBySessionId', () => {
    it('should return page views filtered by sessionId', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([mockPageView]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(1);

      const result = await pageViewRepository.findBySessionId('session-id-1', {
        page: 1,
        limit: 20,
      });

      expect(prisma.pageView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sessionId: 'session-id-1' }),
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findByUserId', () => {
    it('should return page views filtered by userId', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([mockPageView]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(1);

      const result = await pageViewRepository.findByUserId('user-id-1', {
        page: 1,
        limit: 20,
      });

      expect(prisma.pageView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-id-1' }),
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findByPath', () => {
    it('should return page views for a given path', async () => {
      (prisma.pageView.findMany as jest.Mock).mockResolvedValue([mockPageView]);
      (prisma.pageView.count as jest.Mock).mockResolvedValue(1);

      const result = await pageViewRepository.findByPath('/kitchens', {
        page: 1,
        limit: 20,
      });

      expect(prisma.pageView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ path: '/kitchens' }),
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('countByPath', () => {
    it('should return total page view count for a path', async () => {
      (prisma.pageView.count as jest.Mock).mockResolvedValue(1500);

      const result = await pageViewRepository.countByPath('/kitchens');

      expect(prisma.pageView.count).toHaveBeenCalledWith({
        where: { path: '/kitchens' },
      });
      expect(result).toBe(1500);
    });

    it('should return 0 when path has no views', async () => {
      (prisma.pageView.count as jest.Mock).mockResolvedValue(0);

      const result = await pageViewRepository.countByPath('/nonexistent-page');

      expect(result).toBe(0);
    });
  });

  describe('updateDuration', () => {
    it('should update duration for a page view record', async () => {
      const updated = { ...mockPageView, duration: 90000 };
      (prisma.pageView.update as jest.Mock).mockResolvedValue(updated);

      const result = await pageViewRepository.updateDuration('pv-id-1', 90000);

      expect(prisma.pageView.update).toHaveBeenCalledWith({
        where: { id: 'pv-id-1' },
        data: { duration: 90000 },
      });
      expect(result.duration).toBe(90000);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete page views older than the given date', async () => {
      (prisma.pageView.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });

      const cutoff = new Date('2025-01-01');
      const result = await pageViewRepository.deleteOlderThan(cutoff);

      expect(prisma.pageView.deleteMany).toHaveBeenCalledWith({
        where: { timestamp: { lt: cutoff } },
      });
      expect(result).toEqual({ count: 10 });
    });
  });

  describe('getTopPages', () => {
    it('should return top pages ordered by view count', async () => {
      const grouped = [
        { path: '/kitchens', _count: { id: 1500 } },
        { path: '/bedrooms', _count: { id: 1200 } },
      ];

      (prisma.pageView.groupBy as jest.Mock).mockResolvedValue(grouped);

      const result = await pageViewRepository.getTopPages({ limit: 10 });

      expect(prisma.pageView.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['path'],
          _count: { id: true },
          orderBy: expect.objectContaining({ _count: { id: 'desc' } }),
          take: 10,
        })
      );
      expect(result).toHaveLength(2);
    });

    it('should apply date range filter to top pages query', async () => {
      (prisma.pageView.groupBy as jest.Mock).mockResolvedValue([]);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await pageViewRepository.getTopPages({ limit: 5, startDate, endDate });

      expect(prisma.pageView.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      );
    });
  });

  describe('getPageViewsByDateRange', () => {
    it('should return aggregated daily page view counts', async () => {
      const grouped = [
        { timestamp: new Date('2026-01-01'), _count: { id: 120 } },
        { timestamp: new Date('2026-01-02'), _count: { id: 98 } },
      ];

      (prisma.pageView.groupBy as jest.Mock).mockResolvedValue(grouped);

      const start = new Date('2026-01-01');
      const end = new Date('2026-01-02');

      const result = await pageViewRepository.getPageViewsByDateRange(start, end);

      expect(prisma.pageView.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({ gte: start, lte: end }),
          }),
        })
      );
      expect(result).toHaveLength(2);
    });
  });
});