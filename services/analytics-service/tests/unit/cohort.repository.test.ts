import { CohortRepository } from '../../src/app/cohorts/cohort.repository';

const mockPrisma = {
  analyticsCohort: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  analyticsEvent: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const makeRepository = () => new CohortRepository(mockPrisma as never);

const raw = {
  id: 'cohort-1',
  name: 'January 2025 Bookings',
  description: 'Users who booked in January 2025',
  criteria: { event: 'booking_created', from: '2025-01-01', to: '2025-01-31' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CohortRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates cohort and returns mapped record', async () => {
      mockPrisma.analyticsCohort.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.create({
        name: raw.name,
        criteria: raw.criteria,
      });

      expect(result.id).toBe('cohort-1');
      expect(result.name).toBe('January 2025 Bookings');
    });
  });

  describe('findById', () => {
    it('returns mapped cohort when found', async () => {
      mockPrisma.analyticsCohort.findUnique.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.findById('cohort-1');

      expect(result?.id).toBe('cohort-1');
    });

    it('returns null when not found', async () => {
      mockPrisma.analyticsCohort.findUnique.mockResolvedValue(null);

      const repo = makeRepository();
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates cohort and returns mapped result', async () => {
      const updated = { ...raw, name: 'Q1 2025 Bookings' };
      mockPrisma.analyticsCohort.update.mockResolvedValue(updated);

      const repo = makeRepository();
      const result = await repo.update('cohort-1', { name: 'Q1 2025 Bookings' });

      expect(result.name).toBe('Q1 2025 Bookings');
    });
  });

  describe('delete', () => {
    it('calls prisma.delete with correct id', async () => {
      mockPrisma.analyticsCohort.delete.mockResolvedValue(raw);

      const repo = makeRepository();
      await repo.delete('cohort-1');

      expect(mockPrisma.analyticsCohort.delete).toHaveBeenCalledWith({
        where: { id: 'cohort-1' },
      });
    });
  });

  describe('computeRetention', () => {
    it('returns retention data for each requested week', async () => {
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        { userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' },
      ]);
      mockPrisma.analyticsEvent.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const repo = makeRepository();
      const result = await repo.computeRetention(raw, { weeks: 2 });

      expect(result.cohortSize).toBe(3);
      expect(result.weeks).toHaveLength(3);
    });

    it('returns empty weeks when cohort has no users', async () => {
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      const repo = makeRepository();
      const result = await repo.computeRetention(raw, { weeks: 4 });

      expect(result.cohortSize).toBe(0);
    });
  });
});