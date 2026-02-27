import { ConversionService } from '../../src/app/conversions/conversion.service';
import { ConversionRepository } from '../../src/app/conversions/conversion.repository';
import { AppError } from '../../src/shared/errors';

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  countByGoal: jest.fn(),
  conversionRate: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () =>
  new ConversionService(mockRepository as unknown as ConversionRepository, mockLogger as never);

const sampleConversion = {
  id: 'conv-1',
  sessionId: 'sess-1',
  userId: 'user-1',
  goal: 'booking_created',
  value: 1500,
  currency: 'GBP',
  properties: {},
  createdAt: new Date(),
};

describe('ConversionService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('record', () => {
    it('creates a conversion and returns it', async () => {
      mockRepository.create.mockResolvedValue(sampleConversion);

      const service = makeService();
      const result = await service.record({
        sessionId: 'sess-1',
        userId: 'user-1',
        goal: 'booking_created',
        value: 1500,
        currency: 'GBP',
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.goal).toBe('booking_created');
    });

    it('allows recording conversion without value', async () => {
      const noValue = { ...sampleConversion, value: null, currency: null };
      mockRepository.create.mockResolvedValue(noValue);

      const service = makeService();
      const result = await service.record({
        sessionId: 'sess-1',
        goal: 'newsletter_signup',
      });

      expect(result.value).toBeNull();
    });
  });

  describe('getById', () => {
    it('returns conversion when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleConversion);

      const service = makeService();
      const result = await service.getById('conv-1');

      expect(result).toEqual(sampleConversion);
    });

    it('throws AppError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.getById('missing')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated conversions', async () => {
      mockRepository.findMany.mockResolvedValue([sampleConversion]);
      mockRepository.count.mockResolvedValue(1);

      const service = makeService();
      const result = await service.list({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by goal when provided', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const service = makeService();
      await service.list({ goal: 'booking_created', page: 1, limit: 20 });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'booking_created' }),
      );
    });
  });

  describe('getConversionRate', () => {
    it('returns rate between 0 and 1', async () => {
      mockRepository.conversionRate.mockResolvedValue(0.032);

      const service = makeService();
      const rate = await service.getConversionRate({
        goal: 'booking_created',
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });
  });
});