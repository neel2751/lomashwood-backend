import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FunnelRepository } from '../../app/funnels/funnel.repository';

const mockPrisma = {
  analyticsFunnel: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  analyticsEvent: {
    count: jest.fn(),
  },
};

const makeRepository = () => new FunnelRepository(mockPrisma as never);

const raw = {
  id: 'funnel-1',
  name: 'Booking Funnel',
  steps: [
    { order: 1, eventName: 'page_view', label: 'Homepage' },
    { order: 2, eventName: 'booking_created', label: 'Booking Complete' },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FunnelRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates funnel and returns mapped record', async () => {
      mockPrisma.analyticsFunnel.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.create({ name: 'Booking Funnel', steps: raw.steps });

      expect(result.id).toBe('funnel-1');
      expect(result.steps).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('returns mapped funnel when found', async () => {
      mockPrisma.analyticsFunnel.findUnique.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.findById('funnel-1');

      expect(result?.name).toBe('Booking Funnel');
    });

    it('returns null when not found', async () => {
      mockPrisma.analyticsFunnel.findUnique.mockResolvedValue(null);

      const repo = makeRepository();
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates funnel and returns mapped result', async () => {
      const updated = { ...raw, name: 'Updated Funnel' };
      mockPrisma.analyticsFunnel.update.mockResolvedValue(updated);

      const repo = makeRepository();
      const result = await repo.update('funnel-1', { name: 'Updated Funnel' });

      expect(result.name).toBe('Updated Funnel');
    });
  });

  describe('delete', () => {
    it('calls prisma.delete with correct id', async () => {
      mockPrisma.analyticsFunnel.delete.mockResolvedValue(raw);

      const repo = makeRepository();
      await repo.delete('funnel-1');

      expect(mockPrisma.analyticsFunnel.delete).toHaveBeenCalledWith({
        where: { id: 'funnel-1' },
      });
    });
  });

  describe('computeSteps', () => {
    it('computes step counts for each funnel step', async () => {
      mockPrisma.analyticsEvent.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(400);

      const repo = makeRepository();
      const result = await repo.computeSteps(raw, {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].count).toBe(1000);
      expect(result.steps[1].count).toBe(400);
    });

    it('sets overall conversion rate correctly', async () => {
      mockPrisma.analyticsEvent.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(50);

      const repo = makeRepository();
      const result = await repo.computeSteps(raw, {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      });

      expect(result.overallConversionRate).toBeCloseTo(0.05);
    });
  });
});