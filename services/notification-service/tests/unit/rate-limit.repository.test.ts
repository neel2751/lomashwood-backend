import { RateLimitRepository } from '../../app/rate-limits/rate-limit.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { RateLimitChannel } from '../../app/rate-limits/rate-limit.types';
import { redis } from '../../infrastructure/cache/redis.client';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    rateLimitRule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../infrastructure/cache/redis.client', () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

const repo = new RateLimitRepository();

describe('RateLimitRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a rate limit rule', async () => {
      const input = {
        channel: RateLimitChannel.EMAIL,
        maxPerMinute: 60,
        maxPerHour: 500,
        maxPerDay: 2000,
      };
      const created = { id: 'rl-1', ...input };
      (prisma.rateLimitRule.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.rateLimitRule.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findByChannel', () => {
    it('returns rule when found', async () => {
      const rule = { id: 'rl-1', channel: RateLimitChannel.EMAIL };
      (prisma.rateLimitRule.findUnique as jest.Mock).mockResolvedValue(rule);

      const result = await repo.findByChannel(RateLimitChannel.EMAIL);

      expect(prisma.rateLimitRule.findUnique).toHaveBeenCalledWith({
        where: { channel: RateLimitChannel.EMAIL },
      });
      expect(result).toEqual(rule);
    });

    it('returns null when not found', async () => {
      (prisma.rateLimitRule.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findByChannel(RateLimitChannel.PUSH);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all rate limit rules', async () => {
      const rules = [{ id: 'rl-1' }, { id: 'rl-2' }];
      (prisma.rateLimitRule.findMany as jest.Mock).mockResolvedValue(rules);

      const result = await repo.findAll();

      expect(prisma.rateLimitRule.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getCurrentUsage', () => {
    it('returns current usage counters from Redis', async () => {
      (redis.get as jest.Mock)
        .mockResolvedValueOnce('10')
        .mockResolvedValueOnce('80')
        .mockResolvedValueOnce('300');

      const usage = await repo.getCurrentUsage(RateLimitChannel.EMAIL, 'user-1');

      expect(usage.perMinute).toBe(10);
      expect(usage.perHour).toBe(80);
      expect(usage.perDay).toBe(300);
    });

    it('returns zero when Redis key does not exist', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const usage = await repo.getCurrentUsage(RateLimitChannel.SMS, 'user-1');

      expect(usage.perMinute).toBe(0);
      expect(usage.perHour).toBe(0);
      expect(usage.perDay).toBe(0);
    });
  });

  describe('incrementUsage', () => {
    it('increments all three counters in Redis with TTL', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);

      await repo.incrementUsage(RateLimitChannel.EMAIL, 'user-1');

      expect(redis.incr).toHaveBeenCalledTimes(3);
      expect(redis.expire).toHaveBeenCalledTimes(3);
    });
  });

  describe('resetUsage', () => {
    it('deletes usage keys from Redis', async () => {
      (redis.del as jest.Mock).mockResolvedValue(3);

      await repo.resetUsage(RateLimitChannel.EMAIL, 'user-1');

      expect(redis.del).toHaveBeenCalledTimes(3);
    });
  });

  describe('update', () => {
    it('updates rate limit rule fields', async () => {
      const updated = { id: 'rl-1', maxPerMinute: 120 };
      (prisma.rateLimitRule.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.update('rl-1', { maxPerMinute: 120 });

      expect(prisma.rateLimitRule.update).toHaveBeenCalledWith({
        where: { id: 'rl-1' },
        data: { maxPerMinute: 120 },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes rate limit rule by id', async () => {
      (prisma.rateLimitRule.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('rl-1');

      expect(prisma.rateLimitRule.delete).toHaveBeenCalledWith({ where: { id: 'rl-1' } });
    });
  });
});