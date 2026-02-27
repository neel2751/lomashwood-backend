import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FunnelService } from '../../app/funnels/funnel.service';
import { FunnelRepository } from '../../app/funnels/funnel.repository';
import { AppError } from '../../shared/errors';

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  computeSteps: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () =>
  new FunnelService(mockRepository as unknown as FunnelRepository, mockLogger as never);

const sampleFunnel = {
  id: 'funnel-1',
  name: 'Booking Funnel',
  steps: [
    { order: 1, eventName: 'page_view', label: 'Homepage' },
    { order: 2, eventName: 'brochure_download', label: 'Brochure' },
    { order: 3, eventName: 'booking_started', label: 'Booking Start' },
    { order: 4, eventName: 'booking_created', label: 'Booking Complete' },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleAnalysis = {
  funnelId: 'funnel-1',
  steps: [
    { order: 1, label: 'Homepage', count: 1000, dropoff: 0, dropoffRate: 0 },
    { order: 2, label: 'Brochure', count: 400, dropoff: 600, dropoffRate: 0.6 },
    { order: 3, label: 'Booking Start', count: 80, dropoff: 320, dropoffRate: 0.8 },
    { order: 4, label: 'Booking Complete', count: 50, dropoff: 30, dropoffRate: 0.375 },
  ],
  overallConversionRate: 0.05,
  from: new Date('2025-01-01'),
  to: new Date('2025-01-31'),
};

describe('FunnelService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a funnel and returns it', async () => {
      mockRepository.create.mockResolvedValue(sampleFunnel);

      const service = makeService();
      const result = await service.create({
        name: 'Booking Funnel',
        steps: sampleFunnel.steps,
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Booking Funnel');
    });

    it('throws when steps are fewer than 2', async () => {
      const service = makeService();
      await expect(
        service.create({ name: 'Bad Funnel', steps: [{ order: 1, eventName: 'view', label: 'View' }] }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('getById', () => {
    it('returns funnel when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleFunnel);

      const service = makeService();
      const result = await service.getById('funnel-1');

      expect(result.id).toBe('funnel-1');
    });

    it('throws AppError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.getById('missing')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('analyse', () => {
    it('returns step-by-step funnel analysis with dropoff rates', async () => {
      mockRepository.findById.mockResolvedValue(sampleFunnel);
      mockRepository.computeSteps.mockResolvedValue(sampleAnalysis);

      const service = makeService();
      const result = await service.analyse('funnel-1', {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(result.steps).toHaveLength(4);
      expect(result.overallConversionRate).toBeGreaterThan(0);
      expect(result.overallConversionRate).toBeLessThanOrEqual(1);
    });

    it('throws when funnel not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(
        service.analyse('missing', { from: new Date(), to: new Date() }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('delete', () => {
    it('deletes funnel when it exists', async () => {
      mockRepository.findById.mockResolvedValue(sampleFunnel);
      mockRepository.delete.mockResolvedValue(undefined);

      const service = makeService();
      await expect(service.delete('funnel-1')).resolves.not.toThrow();

      expect(mockRepository.delete).toHaveBeenCalledWith('funnel-1');
    });

    it('throws when funnel not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.delete('missing')).rejects.toBeInstanceOf(AppError);
    });
  });
});