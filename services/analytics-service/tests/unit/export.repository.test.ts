import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExportRepository } from '../../app/exports/export.repository';

const mockPrisma = {
  analyticsExport: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const makeRepository = () => new ExportRepository(mockPrisma as never);

const raw = {
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

describe('ExportRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates export and returns mapped record', async () => {
      mockPrisma.analyticsExport.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.create({ reportId: 'report-1', format: 'CSV', requestedBy: 'user-1' });

      expect(result.id).toBe('export-1');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('findById', () => {
    it('returns mapped export when found', async () => {
      mockPrisma.analyticsExport.findUnique.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.findById('export-1');

      expect(result?.format).toBe('CSV');
    });

    it('returns null when not found', async () => {
      mockPrisma.analyticsExport.findUnique.mockResolvedValue(null);

      const repo = makeRepository();
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findMany', () => {
    it('returns array of mapped exports', async () => {
      mockPrisma.analyticsExport.findMany.mockResolvedValue([raw]);

      const repo = makeRepository();
      const results = await repo.findMany({ page: 1, limit: 20 });

      expect(results).toHaveLength(1);
    });

    it('applies status filter to where clause', async () => {
      mockPrisma.analyticsExport.findMany.mockResolvedValue([]);

      const repo = makeRepository();
      await repo.findMany({ status: 'COMPLETED', page: 1, limit: 20 });

      expect(mockPrisma.analyticsExport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates export status and returns mapped record', async () => {
      const updated = { ...raw, status: 'COMPLETED', fileUrl: 'https://s3.example.com/r.csv', completedAt: new Date() };
      mockPrisma.analyticsExport.update.mockResolvedValue(updated);

      const repo = makeRepository();
      const result = await repo.updateStatus('export-1', {
        status: 'COMPLETED',
        fileUrl: 'https://s3.example.com/r.csv',
        completedAt: updated.completedAt,
      });

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('delete', () => {
    it('calls prisma.delete with correct id', async () => {
      mockPrisma.analyticsExport.delete.mockResolvedValue(raw);

      const repo = makeRepository();
      await repo.delete('export-1');

      expect(mockPrisma.analyticsExport.delete).toHaveBeenCalledWith({ where: { id: 'export-1' } });
    });
  });
});