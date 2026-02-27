import { RateLimitService } from '../../app/rate-limits/rate-limit.service';
import { RateLimitRepository } from '../../app/rate-limits/rate-limit.repository';
import { RateLimitChannel } from '../../app/rate-limits/rate-limit.types';

jest.mock('../../app/rate-limits/rate-limit.repository');

const mockRepo = new RateLimitRepository() as jest.Mocked<RateLimitRepository>;
const service = new RateLimitService(mockRepo);

describe('RateLimitService', () => {
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
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('findByChannel', () => {
    it('returns rate limit rule for a channel', async () => {
      const rule = { id: 'rl-1', channel: RateLimitChannel.EMAIL, maxPerMinute: 60 };
      mockRepo.findByChannel.mockResolvedValue(rule);

      const result = await service.findByChannel(RateLimitChannel.EMAIL);

      expect(mockRepo.findByChannel).toHaveBeenCalledWith(RateLimitChannel.EMAIL);
      expect(result).toEqual(rule);
    });

    it('returns null when no rule configured for channel', async () => {
      mockRepo.findByChannel.mockResolvedValue(null);

      const result = await service.findByChannel(RateLimitChannel.PUSH);

      expect(result).toBeNull();
    });
  });

  describe('isAllowed', () => {
    it('returns true when usage is within limits', async () => {
      const rule = { id: 'rl-1', channel: RateLimitChannel.EMAIL, maxPerMinute: 60, maxPerHour: 500, maxPerDay: 2000 };
      mockRepo.findByChannel.mockResolvedValue(rule);
      mockRepo.getCurrentUsage.mockResolvedValue({ perMinute: 10, perHour: 100, perDay: 500 });

      const result = await service.isAllowed(RateLimitChannel.EMAIL, 'user-1');

      expect(result).toBe(true);
    });

    it('returns false when per-minute limit is exceeded', async () => {
      const rule = { id: 'rl-1', channel: RateLimitChannel.EMAIL, maxPerMinute: 60, maxPerHour: 500, maxPerDay: 2000 };
      mockRepo.findByChannel.mockResolvedValue(rule);
      mockRepo.getCurrentUsage.mockResolvedValue({ perMinute: 60, perHour: 100, perDay: 500 });

      const result = await service.isAllowed(RateLimitChannel.EMAIL, 'user-1');

      expect(result).toBe(false);
    });

    it('returns false when per-hour limit is exceeded', async () => {
      const rule = { id: 'rl-1', channel: RateLimitChannel.EMAIL, maxPerMinute: 60, maxPerHour: 500, maxPerDay: 2000 };
      mockRepo.findByChannel.mockResolvedValue(rule);
      mockRepo.getCurrentUsage.mockResolvedValue({ perMinute: 5, perHour: 500, perDay: 800 });

      const result = await service.isAllowed(RateLimitChannel.EMAIL, 'user-1');

      expect(result).toBe(false);
    });

    it('returns false when per-day limit is exceeded', async () => {
      const rule = { id: 'rl-1', channel: RateLimitChannel.EMAIL, maxPerMinute: 60, maxPerHour: 500, maxPerDay: 2000 };
      mockRepo.findByChannel.mockResolvedValue(rule);
      mockRepo.getCurrentUsage.mockResolvedValue({ perMinute: 5, perHour: 100, perDay: 2000 });

      const result = await service.isAllowed(RateLimitChannel.EMAIL, 'user-1');

      expect(result).toBe(false);
    });

    it('returns true when no rule is configured for channel', async () => {
      mockRepo.findByChannel.mockResolvedValue(null);

      const result = await service.isAllowed(RateLimitChannel.PUSH, 'user-1');

      expect(result).toBe(true);
    });
  });

  describe('incrementUsage', () => {
    it('increments usage counters for a user and channel', async () => {
      mockRepo.incrementUsage.mockResolvedValue(undefined);

      await service.incrementUsage(RateLimitChannel.SMS, 'user-1');

      expect(mockRepo.incrementUsage).toHaveBeenCalledWith(RateLimitChannel.SMS, 'user-1');
    });
  });

  describe('resetUsage', () => {
    it('resets usage counters for a user and channel', async () => {
      mockRepo.resetUsage.mockResolvedValue(undefined);

      await service.resetUsage(RateLimitChannel.EMAIL, 'user-1');

      expect(mockRepo.resetUsage).toHaveBeenCalledWith(RateLimitChannel.EMAIL, 'user-1');
    });
  });

  describe('update', () => {
    it('updates rate limit rule', async () => {
      const updated = { id: 'rl-1', maxPerMinute: 100 };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('rl-1', { maxPerMinute: 100 });

      expect(mockRepo.update).toHaveBeenCalledWith('rl-1', { maxPerMinute: 100 });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes a rate limit rule', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('rl-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('rl-1');
    });
  });
});