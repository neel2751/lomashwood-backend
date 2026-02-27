import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReportService } from '../../app/reports/report.service';
import { ReportRepository } from '../../app/reports/report.repository';
import { AppError } from '../../shared/errors';

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  schedule: jest.fn(),
  findScheduled: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () =>
  new ReportService(mockRepository as unknown as ReportRepository, mockLogger as never);

const sampleReport = {
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

describe('ReportService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a report and returns it', async () => {
      mockRepository.create.mockResolvedValue(sampleReport);

      const service = makeService();
      const result = await service.create({
        name: 'Monthly Overview',
        type: 'overview',
        filters: { from: '2025-01-01', to: '2025-01-31' },
        createdBy: 'user-1',
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Monthly Overview');
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('getById', () => {
    it('returns report when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleReport);

      const service = makeService();
      const result = await service.getById('report-1');

      expect(result.id).toBe('report-1');
    });

    it('throws AppError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.getById('missing')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated reports', async () => {
      mockRepository.findMany.mockResolvedValue([sampleReport]);
      mockRepository.count.mockResolvedValue(1);

      const service = makeService();
      const result = await service.list({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by createdBy when provided', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const service = makeService();
      await service.list({ createdBy: 'user-1', page: 1, limit: 20 });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-1' }),
      );
    });
  });

  describe('scheduleReport', () => {
    it('sets schedule on a report', async () => {
      const scheduled = { ...sampleReport, schedule: { cron: '0 9 * * 1', timezone: 'UTC' } };
      mockRepository.findById.mockResolvedValue(sampleReport);
      mockRepository.schedule.mockResolvedValue(scheduled);

      const service = makeService();
      const result = await service.scheduleReport('report-1', {
        cron: '0 9 * * 1',
        timezone: 'UTC',
      });

      expect(result.schedule).not.toBeNull();
    });

    it('throws when report not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(
        service.scheduleReport('missing', { cron: '0 9 * * 1', timezone: 'UTC' }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('delete', () => {
    it('deletes report when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleReport);
      mockRepository.delete.mockResolvedValue(undefined);

      const service = makeService();
      await expect(service.delete('report-1')).resolves.not.toThrow();
    });

    it('throws when report not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.delete('missing')).rejects.toBeInstanceOf(AppError);
    });
  });
});