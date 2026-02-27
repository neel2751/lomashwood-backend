import { PreferenceService } from '../../app/preferences/preference.service';
import { PreferenceRepository } from '../../app/preferences/preference.repository';
import { NotificationType } from '../../app/notifications/notification.types';

jest.mock('../../app/preferences/preference.repository');

const mockRepo = new PreferenceRepository() as jest.Mocked<PreferenceRepository>;
const service = new PreferenceService(mockRepo);

describe('PreferenceService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upsert', () => {
    it('creates preference when none exists', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      const created = { id: 'pref-1', userId: 'user-1', emailEnabled: true, smsEnabled: false };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.upsert('user-1', { emailEnabled: true, smsEnabled: false });

      expect(mockRepo.create).toHaveBeenCalledWith({ userId: 'user-1', emailEnabled: true, smsEnabled: false });
      expect(result).toEqual(created);
    });

    it('updates preference when one exists', async () => {
      const existing = { id: 'pref-1', userId: 'user-1', emailEnabled: false, smsEnabled: true };
      mockRepo.findByUserId.mockResolvedValue(existing);
      const updated = { ...existing, emailEnabled: true };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.upsert('user-1', { emailEnabled: true });

      expect(mockRepo.update).toHaveBeenCalledWith('pref-1', { emailEnabled: true });
      expect(result.emailEnabled).toBe(true);
    });
  });

  describe('findByUserId', () => {
    it('returns preference for user', async () => {
      const pref = { id: 'pref-1', userId: 'user-1', emailEnabled: true };
      mockRepo.findByUserId.mockResolvedValue(pref);

      const result = await service.findByUserId('user-1');

      expect(result).toEqual(pref);
    });

    it('returns null when no preference set', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      const result = await service.findByUserId('user-no-pref');

      expect(result).toBeNull();
    });
  });

  describe('isChannelEnabled', () => {
    it('returns true when email is enabled', async () => {
      const pref = { id: 'pref-1', userId: 'user-1', emailEnabled: true, smsEnabled: false, pushEnabled: false };
      mockRepo.findByUserId.mockResolvedValue(pref);

      const result = await service.isChannelEnabled('user-1', NotificationType.EMAIL);

      expect(result).toBe(true);
    });

    it('returns false when sms is disabled', async () => {
      const pref = { id: 'pref-1', userId: 'user-1', emailEnabled: true, smsEnabled: false, pushEnabled: false };
      mockRepo.findByUserId.mockResolvedValue(pref);

      const result = await service.isChannelEnabled('user-1', NotificationType.SMS);

      expect(result).toBe(false);
    });

    it('returns true by default when no preference exists', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      const result = await service.isChannelEnabled('user-1', NotificationType.EMAIL);

      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes preference by userId', async () => {
      const pref = { id: 'pref-1', userId: 'user-1' };
      mockRepo.findByUserId.mockResolvedValue(pref);
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('user-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('pref-1');
    });
  });
});