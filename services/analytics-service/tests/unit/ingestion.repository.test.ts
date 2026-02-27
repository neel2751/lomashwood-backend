import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { IngestionRepository } from '../../app/ingestion/ingestion.repository';

const mockPrisma = {
  analyticsIngestion: {
    create: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
};

const makeRepository = () => new IngestionRepository(mockPrisma as never);

const raw = {
  id: 'ingest-1',
  source: 'web-sdk',
  payload: { type: 'event', name: 'page_view', sessionId: 'sess-1', properties: {} },
  status: 'PENDING',
  processedAt: null,
  failureReason: null,
  createdAt: new Date(),
};

describe('IngestionRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('ingest', () => {
    it('creates ingestion record and returns mapped result', async () => {
      mockPrisma.analyticsIngestion.create.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.ingest({ source: 'web-sdk', payload: raw.payload });

      expect(result.id).toBe('ingest-1');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('ingestBatch', () => {
    it('calls createMany and returns count', async () => {
      mockPrisma.analyticsIngestion.createMany.mockResolvedValue({ count: 3 });

      const repo = makeRepository();
      const result = await repo.ingestBatch([
        { source: 'web-sdk', payload: raw.payload },
        { source: 'web-sdk', payload: raw.payload },
        { source: 'web-sdk', payload: raw.payload },
      ]);

      expect(result.count).toBe(3);
      expect(mockPrisma.analyticsIngestion.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns mapped record when found', async () => {
      mockPrisma.analyticsIngestion.findUnique.mockResolvedValue(raw);

      const repo = makeRepository();
      const result = await repo.findById('ingest-1');

      expect(result?.source).toBe('web-sdk');
    });

    it('returns null when not found', async () => {
      mockPrisma.analyticsIngestion.findUnique.mockResolvedValue(null);

      const repo = makeRepository();
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('markProcessed', () => {
    it('sets status to PROCESSED and processedAt timestamp', async () => {
      const processedAt = new Date();
      const updated = { ...raw, status: 'PROCESSED', processedAt };
      mockPrisma.analyticsIngestion.update.mockResolvedValue(updated);

      const repo = makeRepository();
      const result = await repo.markProcessed('ingest-1');

      expect(result.status).toBe('PROCESSED');
      expect(result.processedAt).not.toBeNull();
    });
  });

  describe('markFailed', () => {
    it('sets status to FAILED with failure reason', async () => {
      const updated = { ...raw, status: 'FAILED', failureReason: 'Unknown event type' };
      mockPrisma.analyticsIngestion.update.mockResolvedValue(updated);

      const repo = makeRepository();
      const result = await repo.markFailed('ingest-1', 'Unknown event type');

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toBe('Unknown event type');
    });
  });

  describe('findUnprocessed', () => {
    it('returns PENDING records up to given limit', async () => {
      mockPrisma.analyticsIngestion.findMany.mockResolvedValue([raw]);

      const repo = makeRepository();
      const results = await repo.findUnprocessed({ limit: 50 });

      expect(results).toHaveLength(1);
      expect(mockPrisma.analyticsIngestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });
});