import { SubscriptionService } from '../../app/subscriptions/subscription.service';
import { SubscriptionRepository } from '../../app/subscriptions/subscription.repository';
import { SubscriptionChannel, SubscriptionStatus } from '../../app/subscriptions/subscription.types';

jest.mock('../../app/subscriptions/subscription.repository');

const mockRepo = new SubscriptionRepository() as jest.Mocked<SubscriptionRepository>;
const service = new SubscriptionService(mockRepo);

describe('SubscriptionService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('subscribe', () => {
    it('creates a new subscription', async () => {
      const input = { userId: 'user-1', channel: SubscriptionChannel.EMAIL, topic: 'promotions' };
      const created = { id: 'sub-1', ...input, status: SubscriptionStatus.ACTIVE };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.subscribe(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('reactivates an existing inactive subscription', async () => {
      const existing = { id: 'sub-1', userId: 'user-1', channel: SubscriptionChannel.EMAIL, topic: 'promotions', status: SubscriptionStatus.INACTIVE };
      mockRepo.findByUserAndTopic.mockResolvedValue(existing);
      const reactivated = { ...existing, status: SubscriptionStatus.ACTIVE };
      mockRepo.updateStatus.mockResolvedValue(reactivated);

      const result = await service.subscribe({
        userId: 'user-1',
        channel: SubscriptionChannel.EMAIL,
        topic: 'promotions',
      });

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('sub-1', SubscriptionStatus.ACTIVE);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('unsubscribe', () => {
    it('sets subscription status to inactive', async () => {
      const updated = { id: 'sub-1', status: SubscriptionStatus.INACTIVE };
      mockRepo.updateStatus.mockResolvedValue(updated);

      const result = await service.unsubscribe('sub-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('sub-1', SubscriptionStatus.INACTIVE);
      expect(result.status).toBe(SubscriptionStatus.INACTIVE);
    });
  });

  describe('findByUserId', () => {
    it('returns all subscriptions for a user', async () => {
      const subs = [{ id: 'sub-1', userId: 'user-1' }, { id: 'sub-2', userId: 'user-1' }];
      mockRepo.findByUserId.mockResolvedValue(subs);

      const result = await service.findByUserId('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('findByTopic', () => {
    it('returns all active subscriptions for a topic', async () => {
      const subs = [{ id: 'sub-1', topic: 'promotions', status: SubscriptionStatus.ACTIVE }];
      mockRepo.findByTopic.mockResolvedValue(subs);

      const result = await service.findByTopic('promotions');

      expect(mockRepo.findByTopic).toHaveBeenCalledWith('promotions');
      expect(result).toEqual(subs);
    });
  });

  describe('isSubscribed', () => {
    it('returns true when active subscription exists', async () => {
      const sub = { id: 'sub-1', status: SubscriptionStatus.ACTIVE };
      mockRepo.findByUserAndTopic.mockResolvedValue(sub);

      const result = await service.isSubscribed('user-1', 'promotions');

      expect(result).toBe(true);
    });

    it('returns false when no subscription exists', async () => {
      mockRepo.findByUserAndTopic.mockResolvedValue(null);

      const result = await service.isSubscribed('user-1', 'missing-topic');

      expect(result).toBe(false);
    });

    it('returns false when subscription is inactive', async () => {
      const sub = { id: 'sub-1', status: SubscriptionStatus.INACTIVE };
      mockRepo.findByUserAndTopic.mockResolvedValue(sub);

      const result = await service.isSubscribed('user-1', 'promotions');

      expect(result).toBe(false);
    });
  });
});