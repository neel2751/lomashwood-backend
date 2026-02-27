import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExportService } from '../../app/exports/export.service';
import { ExportRepository } from '../../app/exports/export.repository';
import { AppError } from '../../shared/errors';

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeService = () =>
  new ExportService(mockRepository as unknown as ExportRepository, mockLogger as never);

const sampleExport = {
  id: 'export-1',
  reportId: 'report-1',
  format: 'CSV',
  status: 'PENDING',
  fileUrl: null,
  fileSizeBytes: null,
  requestedBy: 'user-1',
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ExportService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('request', () => {
    it('creates an export request with PENDING status', async () => {
      mockRepository.create.mockResolvedValue(sampleExport);

      const service = makeService();
      const result = await service.request({
        reportId: 'report-1',
        format: 'CSV',
        requestedBy: 'user-1',
      });

      expect(result.status).toBe('PENDING');
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('accepts PDF and XLSX formats', async () => {
      for (const format of ['PDF', 'XLSX'] as const) {
        mockRepository.create.mockResolvedValue({ ...sampleExport, format });

        const service = makeService();
        const result = await service.request({ reportId: 'report-1', format, requestedBy: 'user-1' });

        expect(result.format).toBe(format);
      }
    });
  });

  describe('getById', () => {
    it('returns export when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleExport);

      const service = makeService();
      const result = await service.getById('export-1');

      expect(result.id).toBe('export-1');
    });

    it('throws AppError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(service.getById('missing')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('markComplete', () => {
    it('updates status to COMPLETED with file url', async () => {
      const completed = { ...sampleExport, status: 'COMPLETED', fileUrl: 'https://s3.example.com/report.csv', completedAt: new Date() };
      mockRepository.findById.mockResolvedValue(sampleExport);
      mockRepository.updateStatus.mockResolvedValue(completed);

      const service = makeService();
      const result = await service.markComplete('export-1', {
        fileUrl: 'https://s3.example.com/report.csv',
        fileSizeBytes: 4096,
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.fileUrl).toBeDefined();
    });

    it('throws when export not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const service = makeService();
      await expect(
        service.markComplete('missing', { fileUrl: 'url', fileSizeBytes: 0 }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('markFailed', () => {
    it('updates status to FAILED', async () => {
      const failed = { ...sampleExport, status: 'FAILED' };
      mockRepository.findById.mockResolvedValue(sampleExport);
      mockRepository.updateStatus.mockResolvedValue(failed);

      const service = makeService();
      const result = await service.markFailed('export-1', 'Generation timeout');

      expect(result.status).toBe('FAILED');
    });
  });

  describe('list', () => {
    it('returns paginated exports', async () => {
      mockRepository.findMany.mockResolvedValue([sampleExport]);
      mockRepository.count.mockResolvedValue(1);

      const service = makeService();
      const result = await service.list({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});