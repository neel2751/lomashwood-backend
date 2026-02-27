import { PreferenceService } from '../../src/app/profiles/profile.service';
import { PreferenceRepository } from '../../src/app/profiles/profile.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/profiles/profile.repository');

const mockRepository = {
  findByCustomerId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('PreferenceService', () => {
  let service: PreferenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PreferenceService(mockRepository as unknown as PreferenceRepository);
  });

  describe('getByCustomerId', () => {
    it('should return preferences for customer', async () => {
      const preferences = {
        id: 'pref-1',
        customerId: 'cust-1',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false,
        newsletterSubscribed: true,
        preferredContactMethod: 'EMAIL',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findByCustomerId.mockResolvedValue(preferences);

      const result = await service.getByCustomerId('cust-1');

      expect(result).toEqual(preferences);
      expect(mockRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('should return null if no preferences set', async () => {
      mockRepository.findByCustomerId.mockResolvedValue(null);

      const result = await service.getByCustomerId('cust-no-prefs');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create preferences when none exist', async () => {
      const input = {
        customerId: 'cust-1',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingEmails: true,
        newsletterSubscribed: false,
        preferredContactMethod: 'EMAIL' as const,
      };
      const created = { id: 'pref-1', ...input, createdAt: new Date(), updatedAt: new Date() };
      mockRepository.findByCustomerId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(created);

      const result = await service.upsert(input);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should update preferences when they exist', async () => {
      const existing = {
        id: 'pref-1',
        customerId: 'cust-1',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingEmails: true,
        newsletterSubscribed: false,
        preferredContactMethod: 'EMAIL',
      };
      const updateInput = {
        customerId: 'cust-1',
        emailNotifications: false,
        smsNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        newsletterSubscribed: true,
        preferredContactMethod: 'SMS' as const,
      };
      const updated = { ...existing, ...updateInput };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.upsert(updateInput);

      expect(result.emailNotifications).toBe(false);
      expect(result.smsNotifications).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith('cust-1', updateInput);
    });
  });

  describe('updateNotificationPreference', () => {
    it('should update single notification preference', async () => {
      const existing = {
        id: 'pref-1',
        customerId: 'cust-1',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingEmails: true,
        newsletterSubscribed: false,
        preferredContactMethod: 'EMAIL',
      };
      const updated = { ...existing, emailNotifications: false };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.updateNotificationPreference('cust-1', 'emailNotifications', false);

      expect(result.emailNotifications).toBe(false);
    });

    it('should throw AppError when preferences not found', async () => {
      mockRepository.findByCustomerId.mockResolvedValue(null);

      await expect(
        service.updateNotificationPreference('cust-no-prefs', 'emailNotifications', false)
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError for invalid preference key', async () => {
      mockRepository.findByCustomerId.mockResolvedValue({ id: 'pref-1' });

      await expect(
        service.updateNotificationPreference('cust-1', 'invalidKey' as any, true)
      ).rejects.toThrow(AppError);
    });
  });

  describe('subscribeNewsletter', () => {
    it('should set newsletterSubscribed to true', async () => {
      const existing = {
        id: 'pref-1',
        customerId: 'cust-1',
        newsletterSubscribed: false,
      };
      const updated = { ...existing, newsletterSubscribed: true };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.subscribeNewsletter('cust-1');

      expect(result.newsletterSubscribed).toBe(true);
    });
  });

  describe('unsubscribeNewsletter', () => {
    it('should set newsletterSubscribed to false', async () => {
      const existing = {
        id: 'pref-1',
        customerId: 'cust-1',
        newsletterSubscribed: true,
      };
      const updated = { ...existing, newsletterSubscribed: false };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.unsubscribeNewsletter('cust-1');

      expect(result.newsletterSubscribed).toBe(false);
    });
  });
});