import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MetricRepository } from '../../app/metrics/metric.repository';

const mockPrisma = {
  analyticsSession: {
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  analyticsPageview: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  analyticsConversion: {
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  analyticsEvent: {
    groupBy: jest.fn(),
    count: jest.fn(),
  },
};

const makeRepository = () => new MetricRepository(mockPrisma as never);

const dateRange = {
  from: new Date('2025-01-01'),
  to: new Date('2025-01-31'),
};

describe('MetricRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDashboardSummary', () => {
    it('aggregates sessions, pageviews and conversions', async () => {
      mockPrisma.analyticsSession.count.mockResolvedValue(4200);
      mockPrisma.analyticsSession.aggregate.mockResolvedValue({ _avg: { duration: 185 } });
      mockPrisma.analyticsPageview.count.mockResolvedValue(18500);
      mockPrisma.analyticsConversion.count.mockResolvedValue(134);
      mockPrisma.analyticsSession.findMany.mockResolvedValue([]);

      const repo = makeRepository();
      const result = await repo.getDashboardSummary(dateRange);

      expect(result.totalSessions).toBe(4200);
      expect(result.totalPageviews).toBe(18500);
      expect(result.totalConversions).toBe(134);
    });

    it('returns zero conversionRate when sessions are zero', async () => {
      mockPrisma.analyticsSession.count.mockResolvedValue(0);
      mockPrisma.analyticsSession.aggregate.mockResolvedValue({ _avg: { duration: null } });
      mockPrisma.analyticsPageview.count.mockResolvedValue(0);
      mockPrisma.analyticsConversion.count.mockResolvedValue(0);
      mockPrisma.analyticsSession.findMany.mockResolvedValue([]);

      const repo = makeRepository();
      const result = await repo.getDashboardSummary(dateRange);

      expect(result.conversionRate).toBe(0);
    });
  });

  describe('getTimeSeries', () => {
    it('returns data grouped by day', async () => {
      mockPrisma.analyticsSession.groupBy.mockResolvedValue([
        { createdAt: new Date('2025-01-01'), _count: { id: 120 } },
        { createdAt: new Date('2025-01-02'), _count: { id: 135 } },
      ]);
      mockPrisma.analyticsPageview.groupBy.mockResolvedValue([]);
      mockPrisma.analyticsConversion.groupBy.mockResolvedValue([]);

      const repo = makeRepository();
      const result = await repo.getTimeSeries({ ...dateRange, granularity: 'day' });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getTopEvents', () => {
    it('returns top event names ordered by count', async () => {
      mockPrisma.analyticsEvent.groupBy.mockResolvedValue([
        { name: 'page_view', _count: { name: 9000 } },
        { name: 'brochure_download', _count: { name: 340 } },
        { name: 'booking_started', _count: { name: 210 } },
      ]);

      const repo = makeRepository();
      const result = await repo.getTopEvents({ ...dateRange, limit: 10 });

      expect(result).toHaveLength(3);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });
  });

  describe('getDeviceBreakdown', () => {
    it('computes percentages correctly', async () => {
      mockPrisma.analyticsSession.groupBy.mockResolvedValue([
        { device: 'mobile', _count: { device: 600 } },
        { device: 'desktop', _count: { device: 400 } },
      ]);

      const repo = makeRepository();
      const result = await repo.getDeviceBreakdown(dateRange);

      const totalPct = result.reduce((s, r) => s + r.percentage, 0);
      expect(totalPct).toBeCloseTo(1);
    });
  });

  describe('getActiveUsers', () => {
    it('counts sessions active within last 5 minutes', async () => {
      mockPrisma.analyticsSession.count.mockResolvedValue(42);

      const repo = makeRepository();
      const result = await repo.getActiveUsers();

      expect(result).toBe(42);
      expect(mockPrisma.analyticsSession.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startedAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('getUtmBreakdown', () => {
    it('groups sessions by utmSource and utmMedium', async () => {
      mockPrisma.analyticsSession.groupBy.mockResolvedValue([
        { utmSource: 'google', utmMedium: 'cpc', _count: { id: 800 } },
        { utmSource: 'facebook', utmMedium: 'social', _count: { id: 400 } },
      ]);
      mockPrisma.analyticsConversion.count
        .mockResolvedValueOnce(24)
        .mockResolvedValueOnce(8);

      const repo = makeRepository();
      const result = await repo.getUtmBreakdown(dateRange);

      expect(result).toHaveLength(2);
      expect(result[0].sessions).toBe(800);
      expect(result[0].conversions).toBe(24);
    });
  });
});