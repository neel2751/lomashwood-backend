import { SubscriptionRepository } from '../../app/subscriptions/subscription.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { SubscriptionChannel, SubscriptionStatus } from '../../app/subscriptions/subscription.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    subscription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const repo = new SubscriptionRepository();

describe('SubscriptionRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a subscription record', async () => {
      const input = { userId: 'user-1', channel: SubscriptionChannel.EMAIL, topic: 'promotions' };
      const created = { id: 'sub-1', ...input, status: SubscriptionStatus.ACTIVE };
      (prisma.subscription.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.subscription.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns subscription when found', async () => {
      const sub = { id: 'sub-1', userId: 'user-1' };
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(sub);

      const result = await repo.findById('sub-1');

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({ where: { id: 'sub-1' } });
      expect(result).toEqual(sub);
    });

    it('returns null when not found', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all subscriptions for a user', async () => {
      const subs = [{ id: 'sub-1', userId: 'user-1' }, { id: 'sub-2', userId: 'user-1' }];
      (prisma.subscription.findMany as jest.Mock).mockResolvedValue(subs);

      const result = await repo.findByUserId('user-1');

      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByTopic', () => {
    it('returns active subscriptions for a topic', async () => {
      const subs = [{ id: 'sub-1', topic: 'promotions', status: SubscriptionStatus.ACTIVE }];
      (prisma.subscription.findMany as jest.Mock).mockResolvedValue(subs);

      const result = await repo.findByTopic('promotions');

      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: { topic: 'promotions', status: SubscriptionStatus.ACTIVE },
      });
      expect(result).toEqual(subs);
    });
  });

  describe('findByUserAndTopic', () => {
    it('returns subscription matching user and topic', async () => {
      const sub = { id: 'sub-1', userId: 'user-1', topic: 'promotions' };
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(sub);

      const result = await repo.findByUserAndTopic('user-1', 'promotions');

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId_topic: { userId: 'user-1', topic: 'promotions' } },
      });
      expect(result).toEqual(sub);
    });

    it('returns null when no match', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findByUserAndTopic('user-1', 'unknown-topic');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('updates subscription status', async () => {
      const updated = { id: 'sub-1', status: SubscriptionStatus.INACTIVE };
      (prisma.subscription.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('sub-1', SubscriptionStatus.INACTIVE);

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubscriptionStatus.INACTIVE },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes subscription by id', async () => {
      (prisma.subscription.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('sub-1');

      expect(prisma.subscription.delete).toHaveBeenCalledWith({ where: { id: 'sub-1' } });
    });
  });
});