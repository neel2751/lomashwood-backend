import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';

interface CohortData {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface RetentionWeek {
  week: number;
  retained: number;
  retentionRate: number;
}

interface RetentionData {
  cohortId: string;
  cohortSize: number;
  weeks: RetentionWeek[];
}

interface CohortRepository {
  create: jest.MockedFunction<(data: { name: string; criteria: Record<string, unknown> }) => Promise<CohortData>>;
  findById: jest.MockedFunction<(id: string) => Promise<CohortData | null>>;
  findMany: jest.MockedFunction<() => Promise<CohortData[]>>;
  count: jest.MockedFunction<() => Promise<number>>;
  update: jest.MockedFunction<(id: string, data: Partial<CohortData>) => Promise<CohortData>>;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
  computeRetention: jest.MockedFunction<(id: string, options: { weeks: number }) => Promise<RetentionData>>;
}

interface Logger {
  info: jest.MockedFunction<(...args: unknown[]) => void>;
  warn: jest.MockedFunction<(...args: unknown[]) => void>;
  error: jest.MockedFunction<(...args: unknown[]) => void>;
}

class AppError extends Error {
  constructor(message: string, public code: string = 'ERROR') {
    super(message);
    this.name = 'AppError';
  }
}

class CohortService {
  constructor(private repository: CohortRepository, private logger: Logger) {}

  async create(data: { name: string; criteria: Record<string, unknown> }) {
    return this.repository.create(data);
  }

  async getById(id: string) {
    const cohort = await this.repository.findById(id);
    if (!cohort) throw new AppError('Cohort not found', 'NOT_FOUND');
    return cohort;
  }

  async retention(id: string, options: { weeks: number }) {
    const cohort = await this.repository.findById(id);
    if (!cohort) throw new AppError('Cohort not found', 'NOT_FOUND');

    const retention = await this.repository.computeRetention(id, options);
    return retention;
  }

  async delete(id: string) {
    const cohort = await this.repository.findById(id);
    if (!cohort) throw new AppError('Cohort not found', 'NOT_FOUND');
    await this.repository.delete(id);
  }
}

const mockRepository: CohortRepository = {
  create: jest.fn<CohortRepository['create']>(),
  findById: jest.fn<CohortRepository['findById']>(),
  findMany: jest.fn<CohortRepository['findMany']>(),
  count: jest.fn<CohortRepository['count']>(),
  update: jest.fn<CohortRepository['update']>(),
  delete: jest.fn<CohortRepository['delete']>(),
  computeRetention: jest.fn<CohortRepository['computeRetention']>(),
};

const mockLogger: Logger = {
  info: jest.fn<Logger['info']>(),
  warn: jest.fn<Logger['warn']>(),
  error: jest.fn<Logger['error']>(),
};

const makeService = () => new CohortService(mockRepository, mockLogger);

const sampleCohort: CohortData = {
  id: 'cohort-1',
  name: 'January 2025 Bookings',
  description: 'Users who booked in January 2025',
  criteria: { event: 'booking_created', from: '2025-01-01', to: '2025-01-31' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleRetention: RetentionData = {
  cohortId: 'cohort-1',
  cohortSize: 120,
  weeks: [
    { week: 0, retained: 120, retentionRate: 1 },
    { week: 1, retained: 80, retentionRate: 0.667 },
    { week: 2, retained: 60, retentionRate: 0.5 },
    { week: 4, retained: 40, retentionRate: 0.333 },
  ],
};

describe('CohortService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('create', () => {
    it('creates a cohort and returns it', async () => {
      mockRepository.create.mockResolvedValue(sampleCohort);

      const service = makeService();
      const result = await service.create({
        name: 'January 2025 Bookings',
        criteria: sampleCohort.criteria,
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('January 2025 Bookings');
    });
  });

  describe('getById', () => {
    it('returns cohort when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleCohort);

      const service = makeService();
      const result = await service.getById('cohort-1');

      expect(result.id).toBe('cohort-1');
    });

    it('throws AppError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.getById('missing')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('retention', () => {
    it('returns week-by-week retention data', async () => {
      mockRepository.findById.mockResolvedValue(sampleCohort);
      mockRepository.computeRetention.mockResolvedValue(sampleRetention);

      const service = makeService();
      const result = await service.retention('cohort-1', { weeks: 4 });

      expect(result.weeks).toHaveLength(4);
      expect(result.weeks[0].retentionRate).toBe(1);
      expect(result.cohortSize).toBe(120);
    });

    it('throws when cohort not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.retention('missing', { weeks: 4 })).rejects.toBeInstanceOf(AppError);
    });

    it('ensures week-0 retention rate is always 1', async () => {
      mockRepository.findById.mockResolvedValue(sampleCohort);
      mockRepository.computeRetention.mockResolvedValue(sampleRetention);

      const service = makeService();
      const result = await service.retention('cohort-1', { weeks: 4 });

      const week0 = result.weeks.find((w) => w.week === 0);
      expect(week0?.retentionRate).toBe(1);
    });
  });

  describe('delete', () => {
    it('deletes cohort when it exists', async () => {
      mockRepository.findById.mockResolvedValue(sampleCohort);
      mockRepository.delete.mockResolvedValue(undefined);

      const service = makeService();
      await expect(service.delete('cohort-1')).resolves.not.toThrow();
    });

    it('throws when cohort not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.delete('missing')).rejects.toBeInstanceOf(AppError);
    });
  });
});