import { RetryPolicyService } from '../../app/retry-policies/retry-policy.service';
import { RetryPolicyRepository } from '../../app/retry-policies/retry-policy.repository';
import { RetryStrategy } from '../../app/retry-policies/retry-policy.types';

jest.mock('../../app/retry-policies/retry-policy.repository');

const mockRepo = new RetryPolicyRepository() as jest.Mocked<RetryPolicyRepository>;
const service = new RetryPolicyService(mockRepo);

describe('RetryPolicyService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a retry policy', async () => {
      const input = {
        name: 'default-email-retry',
        maxAttempts: 3,
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        initialDelayMs: 1000,
      };
      const created = { id: 'rp-1', ...input };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns policy when found', async () => {
      const policy = { id: 'rp-1', name: 'default-email-retry' };
      mockRepo.findById.mockResolvedValue(policy);

      const result = await service.findById('rp-1');

      expect(result).toEqual(policy);
    });

    it('returns null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns policy by name', async () => {
      const policy = { id: 'rp-1', name: 'default-email-retry' };
      mockRepo.findByName.mockResolvedValue(policy);

      const result = await service.findByName('default-email-retry');

      expect(mockRepo.findByName).toHaveBeenCalledWith('default-email-retry');
      expect(result).toEqual(policy);
    });
  });

  describe('computeNextDelay', () => {
    it('computes linear delay correctly', async () => {
      const policy = {
        id: 'rp-1',
        strategy: RetryStrategy.LINEAR,
        initialDelayMs: 2000,
        maxAttempts: 5,
      };
      mockRepo.findById.mockResolvedValue(policy);

      const delay = await service.computeNextDelay('rp-1', 1);

      expect(delay).toBe(2000);
    });

    it('computes exponential backoff delay correctly', async () => {
      const policy = {
        id: 'rp-1',
        strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        initialDelayMs: 1000,
        maxAttempts: 5,
      };
      mockRepo.findById.mockResolvedValue(policy);

      const delayAttempt1 = await service.computeNextDelay('rp-1', 1);
      const delayAttempt2 = await service.computeNextDelay('rp-1', 2);
      const delayAttempt3 = await service.computeNextDelay('rp-1', 3);

      expect(delayAttempt1).toBe(1000);
      expect(delayAttempt2).toBe(2000);
      expect(delayAttempt3).toBe(4000);
    });

    it('throws when policy not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.computeNextDelay('missing', 1)).rejects.toThrow();
    });
  });

  describe('shouldRetry', () => {
    it('returns true when attempt is below maxAttempts', async () => {
      const policy = { id: 'rp-1', maxAttempts: 3 };
      mockRepo.findById.mockResolvedValue(policy);

      const result = await service.shouldRetry('rp-1', 2);

      expect(result).toBe(true);
    });

    it('returns false when attempt equals maxAttempts', async () => {
      const policy = { id: 'rp-1', maxAttempts: 3 };
      mockRepo.findById.mockResolvedValue(policy);

      const result = await service.shouldRetry('rp-1', 3);

      expect(result).toBe(false);
    });

    it('returns false when attempt exceeds maxAttempts', async () => {
      const policy = { id: 'rp-1', maxAttempts: 3 };
      mockRepo.findById.mockResolvedValue(policy);

      const result = await service.shouldRetry('rp-1', 5);

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('updates a retry policy', async () => {
      const updated = { id: 'rp-1', maxAttempts: 5 };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('rp-1', { maxAttempts: 5 });

      expect(mockRepo.update).toHaveBeenCalledWith('rp-1', { maxAttempts: 5 });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes a retry policy', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('rp-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('rp-1');
    });
  });
});