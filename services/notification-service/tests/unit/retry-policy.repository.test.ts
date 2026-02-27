import { RetryPolicyRepository } from '../../app/retry-policies/retry-policy.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { RetryStrategy } from '../../app/retry-policies/retry-policy.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    retryPolicy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const repo = new RetryPolicyRepository();

describe('RetryPolicyRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a retry policy record', async () => {
      const input = {
        name: 'default-sms-retry',
        maxAttempts: 3,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        initialDelayMs: 500,
      };
      const created = { id: 'rp-1', ...input };
      (prisma.retryPolicy.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.retryPolicy.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns policy when found', async () => {
      const policy = { id: 'rp-1', name: 'default-sms-retry' };
      (prisma.retryPolicy.findUnique as jest.Mock).mockResolvedValue(policy);

      const result = await repo.findById('rp-1');

      expect(prisma.retryPolicy.findUnique).toHaveBeenCalledWith({ where: { id: 'rp-1' } });
      expect(result).toEqual(policy);
    });

    it('returns null when not found', async () => {
      (prisma.retryPolicy.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns policy by unique name', async () => {
      const policy = { id: 'rp-1', name: 'default-sms-retry' };
      (prisma.retryPolicy.findUnique as jest.Mock).mockResolvedValue(policy);

      const result = await repo.findByName('default-sms-retry');

      expect(prisma.retryPolicy.findUnique).toHaveBeenCalledWith({
        where: { name: 'default-sms-retry' },
      });
      expect(result).toEqual(policy);
    });

    it('returns null when name does not exist', async () => {
      (prisma.retryPolicy.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all retry policies', async () => {
      const policies = [{ id: 'rp-1' }, { id: 'rp-2' }];
      (prisma.retryPolicy.findMany as jest.Mock).mockResolvedValue(policies);

      const result = await repo.findAll();

      expect(prisma.retryPolicy.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByStrategy', () => {
    it('returns policies matching a strategy', async () => {
      const policies = [{ id: 'rp-1', strategy: RetryStrategy.LINEAR }];
      (prisma.retryPolicy.findMany as jest.Mock).mockResolvedValue(policies);

      const result = await repo.findByStrategy(RetryStrategy.LINEAR);

      expect(prisma.retryPolicy.findMany).toHaveBeenCalledWith({
        where: { strategy: RetryStrategy.LINEAR },
      });
      expect(result).toEqual(policies);
    });
  });

  describe('update', () => {
    it('updates retry policy fields', async () => {
      const updated = { id: 'rp-1', maxAttempts: 5 };
      (prisma.retryPolicy.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.update('rp-1', { maxAttempts: 5 });

      expect(prisma.retryPolicy.update).toHaveBeenCalledWith({
        where: { id: 'rp-1' },
        data: { maxAttempts: 5 },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes retry policy by id', async () => {
      (prisma.retryPolicy.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('rp-1');

      expect(prisma.retryPolicy.delete).toHaveBeenCalledWith({ where: { id: 'rp-1' } });
    });
  });
});