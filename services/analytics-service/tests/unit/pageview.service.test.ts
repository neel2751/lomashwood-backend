import { PageViewService } from '../../src/app/tracking/tracking.service';
import { PageViewRepository } from '../../src/app/tracking/tracking.repository';

jest.mock('../../src/app/tracking/tracking.repository');

const mockPageViewRepository = jest.mocked(PageViewRepository);

describe('PageViewService', () => {
  let pageViewService: PageViewService;
  let mockRepo: jest.Mocked<PageViewRepository>;

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
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      findBySessionId: jest.fn(),
      findByUserId: jest.fn(),
      findByPath: jest.fn(),
      countByPath: jest.fn(),
      updateDuration: jest.fn(),
      deleteOlderThan: jest.fn(),
      getTopPages: jest.fn(),
      getPageViewsByDateRange: jest.fn(),
    } as unknown as jest.Mocked<PageViewRepository>;

    mockPageViewRepository.mockImplementation(() => mockRepo);
    pageViewService = new PageViewService(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordPageView', () => {
    it('should create and return a page view record', async () => {
      mockRepo.create.mockResolvedValue(mockPageView);

      const dto = {
        sessionId: 'session-id-1',
        url: 'https://lomashwood.co.uk/kitchens',
        path: '/kitchens',
        referrer: 'https://google.com',
      };

      const result = await pageViewService.recordPageView(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPageView);
    });

    it('should throw when repository throws', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB error'));

      await expect(
        pageViewService.recordPageView({
          sessionId: 'session-id-1',
          url: 'https://lomashwood.co.uk/kitchens',
          path: '/kitchens',
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('getPageViewById', () => {
    it('should return a page view by id', async () => {
      mockRepo.findById.mockResolvedValue(mockPageView);

      const result = await pageViewService.getPageViewById('pv-id-1');

      expect(mockRepo.findById).toHaveBeenCalledWith('pv-id-1');
      expect(result).toEqual(mockPageView);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await pageViewService.getPageViewById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPageViews', () => {
    it('should return paginated page views', async () => {
      const paginatedResult = {
        data: [mockPageView],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findMany.mockResolvedValue(paginatedResult);

      const result = await pageViewService.getPageViews({ page: 1, limit: 20 });

      expect(mockRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result).toEqual(paginatedResult);
    });

    it('should apply date range filters', async () => {
      const paginatedResult = {
        data: [mockPageView],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findMany.mockResolvedValue(paginatedResult);

      const params = {
        page: 1,
        limit: 20,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      };

      await pageViewService.getPageViews(params);

      expect(mockRepo.findMany).toHaveBeenCalledWith(params);
    });
  });

  describe('getSessionPageViews', () => {
    it('should return page views for a session', async () => {
      const paginatedResult = {
        data: [mockPageView],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findBySessionId.mockResolvedValue(paginatedResult);

      const result = await pageViewService.getSessionPageViews('session-id-1', {
        page: 1,
        limit: 20,
      });

      expect(mockRepo.findBySessionId).toHaveBeenCalledWith('session-id-1', {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getUserPageViews', () => {
    it('should return page views for a user', async () => {
      const paginatedResult = {
        data: [mockPageView],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findByUserId.mockResolvedValue(paginatedResult);

      const result = await pageViewService.getUserPageViews('user-id-1', {
        page: 1,
        limit: 20,
      });

      expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-id-1', {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getTopPages', () => {
    it('should return top pages by view count', async () => {
      const topPages = [
        { path: '/kitchens', views: 1500 },
        { path: '/bedrooms', views: 1200 },
        { path: '/showrooms', views: 800 },
      ];

      mockRepo.getTopPages.mockResolvedValue(topPages);

      const result = await pageViewService.getTopPages({
        limit: 10,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(mockRepo.getTopPages).toHaveBeenCalled();
      expect(result).toEqual(topPages);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no data', async () => {
      mockRepo.getTopPages.mockResolvedValue([]);

      const result = await pageViewService.getTopPages({ limit: 10 });

      expect(result).toEqual([]);
    });
  });

  describe('updatePageViewDuration', () => {
    it('should update the duration of a page view', async () => {
      const updatedPageView = { ...mockPageView, duration: 90000 };
      mockRepo.updateDuration.mockResolvedValue(updatedPageView);

      const result = await pageViewService.updatePageViewDuration('pv-id-1', 90000);

      expect(mockRepo.updateDuration).toHaveBeenCalledWith('pv-id-1', 90000);
      expect(result.duration).toBe(90000);
    });

    it('should throw when page view not found for update', async () => {
      mockRepo.updateDuration.mockRejectedValue(new Error('Record not found'));

      await expect(
        pageViewService.updatePageViewDuration('nonexistent', 5000)
      ).rejects.toThrow('Record not found');
    });
  });

  describe('getPageViewsByDateRange', () => {
    it('should return aggregated page views in a date range', async () => {
      const aggregated = [
        { date: '2026-01-01', views: 120 },
        { date: '2026-01-02', views: 98 },
        { date: '2026-01-03', views: 145 },
      ];

      mockRepo.getPageViewsByDateRange.mockResolvedValue(aggregated);

      const start = new Date('2026-01-01');
      const end = new Date('2026-01-03');

      const result = await pageViewService.getPageViewsByDateRange(start, end);

      expect(mockRepo.getPageViewsByDateRange).toHaveBeenCalledWith(start, end);
      expect(result).toHaveLength(3);
      expect(result[0].views).toBe(120);
    });
  });

  describe('getPageViewsForPath', () => {
    it('should return page views for a specific path', async () => {
      const paginatedResult = {
        data: [mockPageView],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockRepo.findByPath.mockResolvedValue(paginatedResult);

      const result = await pageViewService.getPageViewsForPath('/kitchens', {
        page: 1,
        limit: 20,
      });

      expect(mockRepo.findByPath).toHaveBeenCalledWith('/kitchens', {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getPathViewCount', () => {
    it('should return total view count for a path', async () => {
      mockRepo.countByPath.mockResolvedValue(1500);

      const result = await pageViewService.getPathViewCount('/kitchens');

      expect(mockRepo.countByPath).toHaveBeenCalledWith('/kitchens');
      expect(result).toBe(1500);
    });
  });
});