import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReportRepository } from '../../app/reports/report.repository';

const mockPrisma = {
  analyticsReport: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const makeRepository = () => new ReportRepository(mockPrisma as never);

const raw = {
  id: 'report-1',
  name: 'Monthly Overview',
  type: 'overview',
  filters: { from: '2025-01-01', to: '2025-01-31' },
  status: 'DRAFT',
  schedule: null,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ReportRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates report and returns mapped record', async () => {
      mockPrisma.analyticsReport.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.create({
        name: 'Monthly Overview',
        type: 'overview',
        filters: raw.filters,
        createdBy: 'user-1',
      });

      expect(result.id).toBe('report-1');
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('findById', () => {
    it('returns mapped report when found', async () => {
      mockPrisma.analyticsReport.findUnique.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.findById('report-1');

      expect(result?.name).toBe('Monthly Overview');
    });

    it('returns null when not found', async () => {
      mockPrisma.analyticsReport.findUnique.mockResolvedValue(null);

      const repo = makeRepository();
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findMany', () => {
    it('returns array of mapped reports', async () => {
      mockPrisma.analyticsReport.findMany.mockResolvedValue([raw]);

      const repo = makeRepository();
      const results = await repo.findMany({ page: 1, limit: 20 });

      expect(results).toHaveLength(1);
    });

    it('applies createdBy filter to where clause', async () => {
      mockPrisma.analyticsReport.findMany.mockResolvedValue([]);

      const repo = makeRepository();
      await repo.findMany({ createdBy: 'user-1', page: 1, limit: 20 });

      expect(mockPrisma.analyticsReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ createdBy: 'user-1' }),
        }),
      );
    });
  });

  describe('schedule', () => {
    it('updates schedule on report', async () => {
      const scheduled = { ...raw, schedule: { cron: '0 9 * * 1', timezone: 'UTC' } };
      mockPrisma.analyticsReport.update.mockResolvedValue(scheduled);

      const repo = makeRepository();
      const result = await repo.schedule('report-1', { cron: '0 9 * * 1', timezone: 'UTC' });

      expect(result.schedule).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('calls prisma.delete with correct id', async () => {
      mockPrisma.analyticsReport.delete.mockResolvedValue(raw);

      const repo = makeRepository();
      await repo.delete('report-1');

      expect(mockPrisma.analyticsReport.delete).toHaveBeenCalledWith({ where: { id: 'report-1' } });
    });
  });

  describe('findScheduled', () => {
    it('returns reports with non-null schedule', async () => {
      const scheduled = { ...raw, schedule: { cron: '0 9 * * 1', timezone: 'UTC' } };
      mockPrisma.analyticsReport.findMany.mockResolvedValue([scheduled]);

      const repo = makeRepository();
      const results = await repo.findScheduled();

      expect(results).toHaveLength(1);
      expect(results[0].schedule).not.toBeNull();
    });
  });
});