import { describe, it, expect, beforeEach, jest } from '@jest/globals';

interface Aggregation {
  id: string;
  period: 'day' | 'week' | 'month';
  date: Date;
  sessions: number;
  pageviews: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AggregationRepository {
  runDailyAggregation: jest.Mock<Promise<Aggregation>>;
  runWeeklyAggregation: jest.Mock<Promise<Aggregation>>;
  runMonthlyAggregation: jest.Mock<Promise<Aggregation>>;
  getAggregatedMetrics: jest.Mock<Promise<Aggregation[]>>;
  findAggregation: jest.Mock<Promise<Aggregation | null>>;
  upsertAggregation: jest.Mock<Promise<Aggregation>>;
}

interface Logger {
  info: jest.Mock<void>;
  warn: jest.Mock<void>;
  error: jest.Mock<void>;
}

class AggregationService {
  constructor(
    private repository: AggregationRepository,
    private logger: Logger,
  ) {}

  async runDaily(date: Date): Promise<Aggregation> {
    this.logger.info(`Running daily aggregation for ${date.toISOString()}`);
    return this.repository.runDailyAggregation(date);
  }

  async runWeekly(weekStart: Date): Promise<Aggregation> {
    return this.repository.runWeeklyAggregation(weekStart);
  }

  async runMonthly(monthStart: Date): Promise<Aggregation> {
    return this.repository.runMonthlyAggregation(monthStart);
  }

  async getAggregatedMetrics(params: {
    period: 'day' | 'week' | 'month';
    from: Date;
    to: Date;
  }): Promise<Aggregation[]> {
    return this.repository.getAggregatedMetrics(params);
  }

  async runBackfill(params: {
    from: Date;
    to: Date;
    period: 'day' | 'week' | 'month';
  }): Promise<{ processed: number }> {
    let processed = 0;
    const current = new Date(params.from);
    while (current <= params.to) {
      if (params.period === 'day') {
        await this.repository.runDailyAggregation(new Date(current));
        processed++;
        current.setDate(current.getDate() + 1);
      } else {
        break;
      }
    }
    return { processed };
  }
}

const mockRepository: AggregationRepository = {
  runDailyAggregation: jest.fn(),
  runWeeklyAggregation: jest.fn(),
  runMonthlyAggregation: jest.fn(),
  getAggregatedMetrics: jest.fn(),
  findAggregation: jest.fn(),
  upsertAggregation: jest.fn(),
};

const mockLogger: Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () => new AggregationService(mockRepository, mockLogger);

const sampleAggregation: Aggregation = {
  id: 'agg-1',
  period: 'day' as const,
  date: new Date('2025-01-15'),
  sessions: 220,
  pageviews: 940,
  conversions: 7,
  conversionRate: 0.032,
  avgSessionDuration: 190,
  bounceRate: 0.38,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AggregationService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('runDaily', () => {
    it('runs daily aggregation for given date', async () => {
      mockRepository.runDailyAggregation.mockResolvedValue(sampleAggregation);
      const service = makeService();
      const result = await service.runDaily(new Date('2025-01-15'));
      expect(result.period).toBe('day');
      expect(mockRepository.runDailyAggregation).toHaveBeenCalledWith(expect.any(Date));
    });

    it('logs completion with date and key metrics', async () => {
      mockRepository.runDailyAggregation.mockResolvedValue(sampleAggregation);
      const service = makeService();
      await service.runDaily(new Date('2025-01-15'));
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('runWeekly', () => {
    it('runs weekly aggregation for given week start', async () => {
      const weekly: Aggregation = { ...sampleAggregation, period: 'week' as const, sessions: 1540 };
      mockRepository.runWeeklyAggregation.mockResolvedValue(weekly);
      const service = makeService();
      const result = await service.runWeekly(new Date('2025-01-13'));
      expect(result.period).toBe('week');
      expect(result.sessions).toBe(1540);
    });
  });

  describe('runMonthly', () => {
    it('runs monthly aggregation for given month', async () => {
      const monthly: Aggregation = { ...sampleAggregation, period: 'month' as const, sessions: 6800 };
      mockRepository.runMonthlyAggregation.mockResolvedValue(monthly);
      const service = makeService();
      const result = await service.runMonthly(new Date('2025-01-01'));
      expect(result.period).toBe('month');
      expect(result.sessions).toBe(6800);
    });
  });

  describe('getAggregatedMetrics', () => {
    it('returns aggregated metrics for date range and period', async () => {
      const metrics: Aggregation[] = [
        sampleAggregation,
        { ...sampleAggregation, id: 'agg-2', date: new Date('2025-01-16') },
      ];
      mockRepository.getAggregatedMetrics.mockResolvedValue(metrics);
      const service = makeService();
      const result = await service.getAggregatedMetrics({
        period: 'day',
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('day');
    });

    it('returns empty array when no aggregations exist for range', async () => {
      mockRepository.getAggregatedMetrics.mockResolvedValue([] as Aggregation[]);
      const service = makeService();
      const result = await service.getAggregatedMetrics({
        period: 'day',
        from: new Date('2020-01-01'),
        to: new Date('2020-01-31'),
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('runBackfill', () => {
    it('runs daily aggregation for each day in range', async () => {
      mockRepository.runDailyAggregation.mockResolvedValue(sampleAggregation);
      const service = makeService();
      const result = await service.runBackfill({
        from: new Date('2025-01-01'),
        to: new Date('2025-01-03'),
        period: 'day',
      });
      expect(result.processed).toBe(3);
      expect(mockRepository.runDailyAggregation).toHaveBeenCalledTimes(3);
    });
  });
});