import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MetricService } from '../../app/metrics/metric.service';
import { MetricRepository } from '../../app/metrics/metric.repository';
import { AppError } from '../../shared/errors';

const mockRepository = {
  getDashboardSummary: jest.fn(),
  getTimeSeries: jest.fn(),
  getTopEvents: jest.fn(),
  getTopPages: jest.fn(),
  getDeviceBreakdown: jest.fn(),
  getGeography: jest.fn(),
  getUtmBreakdown: jest.fn(),
  getActiveUsers: jest.fn(),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  setEx: jest.fn().mockResolvedValue('OK'),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () =>
  new MetricService(
    mockRepository as unknown as MetricRepository,
    mockRedis as never,
    mockLogger as never,
  );

const sampleSummary = {
  totalSessions: 4200,
  totalPageviews: 18500,
  totalConversions: 134,
  conversionRate: 0.032,
  avgSessionDuration: 185,
  bounceRate: 0.41,
  activeUsers: 87,
};

describe('MetricService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDashboardSummary', () => {
    it('returns summary metrics for date range', async () => {
      mockRepository.getDashboardSummary.mockResolvedValue(sampleSummary);

      const service = makeService();
      const result = await service.getDashboardSummary({
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(result.totalSessions).toBe(4200);
      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeLessThanOrEqual(1);
    });

    it('returns cached result on second call', async () => {
      const cached = JSON.stringify(sampleSummary);
      mockRedis.get.mockResolvedValue(cached);

      const service = makeService();
      await service.getDashboardSummary({
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(mockRepository.getDashboardSummary).not.toHaveBeenCalled();
    });
  });

  describe('getTimeSeries', () => {
    it('returns daily time series data points', async () => {
      const series = [
        { date: '2025-01-01', sessions: 120, pageviews: 540, conversions: 4 },
        { date: '2025-01-02', sessions: 135, pageviews: 610, conversions: 6 },
      ];
      mockRepository.getTimeSeries.mockResolvedValue(series);

      const service = makeService();
      const result = await service.getTimeSeries({
        from: new Date('2025-01-01'),
        to: new Date('2025-01-02'),
        granularity: 'day',
      });

      expect(result).toHaveLength(2);
      expect(result[0].date).toBeDefined();
    });

    it('rejects invalid granularity', async () => {
      const service = makeService();
      await expect(
        service.getTimeSeries({
          from: new Date('2025-01-01'),
          to: new Date('2025-01-31'),
          granularity: 'invalid' as never,
        }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('getActiveUsers', () => {
    it('returns real-time active user count', async () => {
      mockRepository.getActiveUsers.mockResolvedValue(42);

      const service = makeService();
      const result = await service.getActiveUsers();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDeviceBreakdown', () => {
    it('returns device category percentages summing to 1', async () => {
      mockRepository.getDeviceBreakdown.mockResolvedValue([
        { device: 'mobile', count: 600, percentage: 0.6 },
        { device: 'desktop', count: 330, percentage: 0.33 },
        { device: 'tablet', count: 70, percentage: 0.07 },
      ]);

      const service = makeService();
      const result = await service.getDeviceBreakdown({
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      const totalPct = result.reduce((s, r) => s + r.percentage, 0);
      expect(totalPct).toBeCloseTo(1);
    });
  });

  describe('getUtmBreakdown', () => {
    it('returns utm attribution data', async () => {
      mockRepository.getUtmBreakdown.mockResolvedValue([
        { utmSource: 'google', utmMedium: 'cpc', sessions: 800, conversions: 24 },
        { utmSource: 'facebook', utmMedium: 'social', sessions: 400, conversions: 8 },
      ]);

      const service = makeService();
      const result = await service.getUtmBreakdown({
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(result).toHaveLength(2);
      expect(result[0].utmSource).toBeDefined();
    });
  });
});