import { AggregationRepository } from '../../src/app/aggregation/aggregation.repository';
const mockPrisma = {
  analyticsAggregation: {
    upsert: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  analyticsSession: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  analyticsPageview: {
    count: jest.fn(),
  },
  analyticsConversion: {
    count: jest.fn(),
  },
};

const makeRepository = () => new AggregationRepository(mockPrisma as never);

const raw = {
  id: 'agg-1',
  period: 'day',
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

describe('AggregationRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('runDailyAggregation', () => {
    it('queries raw data and upserts aggregated record', async () => {
      mockPrisma.analyticsSession.count.mockResolvedValue(220);
      mockPrisma.analyticsSession.aggregate.mockResolvedValue({ _avg: { duration: 190 } });
      mockPrisma.analyticsPageview.count.mockResolvedValue(940);
      mockPrisma.analyticsConversion.count.mockResolvedValue(7);
      mockPrisma.analyticsSession.findMany.mockResolvedValue([]);
      mockPrisma.analyticsAggregation.upsert.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.runDailyAggregation(new Date('2025-01-15'));

      expect(result.sessions).toBe(220);
      expect(result.pageviews).toBe(940);
      expect(mockPrisma.analyticsAggregation.upsert).toHaveBeenCalledTimes(1);
    });

    it('sets conversionRate to 0 when sessions are 0', async () => {
      mockPrisma.analyticsSession.count.mockResolvedValue(0);
      mockPrisma.analyticsSession.aggregate.mockResolvedValue({ _avg: { duration: null } });
      mockPrisma.analyticsPageview.count.mockResolvedValue(0);
      mockPrisma.analyticsConversion.count.mockResolvedValue(0);
      mockPrisma.analyticsSession.findMany.mockResolvedValue([]);
      mockPrisma.analyticsAggregation.upsert.mockResolvedValue({ ...raw, sessions: 0, conversionRate: 0 });

      const repo = makeRepository();
      const result = await repo.runDailyAggregation(new Date('2025-01-15'));

      expect(result.conversionRate).toBe(0);
    });
  });

  describe('getAggregatedMetrics', () => {
    it('returns aggregations filtered by period and date range', async () => {
      mockPrisma.analyticsAggregation.findMany.mockResolvedValue([raw]);

      const repo = makeRepository();
      const results = await repo.getAggregatedMetrics({
        period: 'day',
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(results).toHaveLength(1);
      expect(mockPrisma.analyticsAggregation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ period: 'day' }),
        }),
      );
    });

    it('returns empty array when no records match', async () => {
      mockPrisma.analyticsAggregation.findMany.mockResolvedValue([]);

      const repo = makeRepository();
      const results = await repo.getAggregatedMetrics({
        period: 'month',
        from: new Date('2020-01-01'),
        to: new Date('2020-12-31'),
      });

      expect(results).toHaveLength(0);
    });
  });

  describe('upsertAggregation', () => {
    it('upserts with correct where clause', async () => {
      mockPrisma.analyticsAggregation.upsert.mockResolvedValue(raw);

      const repo = makeRepository();
      await repo.upsertAggregation({
        period: 'day',
        date: new Date('2025-01-15'),
        sessions: 220,
        pageviews: 940,
        conversions: 7,
        conversionRate: 0.032,
        avgSessionDuration: 190,
        bounceRate: 0.38,
      });

      expect(mockPrisma.analyticsAggregation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ period: 'day' }),
        }),
      );
    });
  });
});