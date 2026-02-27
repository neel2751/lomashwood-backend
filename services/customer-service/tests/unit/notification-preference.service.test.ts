import { NotificationPreferenceService } from '../../src/app/notification-preference/notification-preference.service';
import { NotificationPreferenceRepository } from '../../src/app/notification-preference/notification-preference.repository';
import { AppError } from '../../src/shared/errors';

jest.mock('../../src/app/notification-preference/notification-preference.repository');

const mockRepository = {
  findByCustomerId: jest.fn(),
  upsert: jest.fn(),
  update: jest.fn(),
};

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationPreferenceService(mockRepository as unknown as NotificationPreferenceRepository);
  });

  describe('getPreferences', () => {
    it('should return preferences when they exist', async () => {
      const prefs = {
        id: 'npref-1',
        customerId: 'cust-1',
        orderUpdates: true,
        promotions: false,
        appointmentReminders: true,
        deliveryAlerts: true,
        reviewRequests: false,
        loyaltyUpdates: true,
        channels: { email: true, sms: false, push: true },
      };
      mockRepository.findByCustomerId.mockResolvedValue(prefs);

      const result = await service.getPreferences('cust-1');

      expect(result).toEqual(prefs);
      expect(mockRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('should throw AppError 404 when preferences not found', async () => {
      mockRepository.findByCustomerId.mockResolvedValue(null);

      await expect(service.getPreferences('cust-no-prefs')).rejects.toThrow(AppError);
      await expect(service.getPreferences('cust-no-prefs')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('upsertPreferences', () => {
    it('should create preferences when none exist', async () => {
      const input = { orderUpdates: true, promotions: true, appointmentReminders: true, deliveryAlerts: false, reviewRequests: true, loyaltyUpdates: false };
      const created = { id: 'npref-new', customerId: 'cust-1', ...input, channels: { email: true, sms: false, push: false } };

      mockRepository.findByCustomerId.mockResolvedValue(null);
      mockRepository.upsert.mockResolvedValue(created);

      const result = await service.upsertPreferences('cust-1', input);

      expect(result).toEqual(created);
      expect(mockRepository.upsert).toHaveBeenCalledWith('cust-1', input);
    });

    it('should update preferences when they exist', async () => {
      const existing = { id: 'npref-1', customerId: 'cust-1', promotions: false };
      const updated = { ...existing, promotions: true };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.upsert.mockResolvedValue(updated);

      const result = await service.upsertPreferences('cust-1', { promotions: true });

      expect(result.promotions).toBe(true);
    });
  });

  describe('updateChannel', () => {
    it('should enable a notification channel', async () => {
      const existing = { id: 'npref-1', customerId: 'cust-1', channels: { email: false, sms: false, push: false } };
      const updated = { ...existing, channels: { email: true, sms: false, push: false } };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.updateChannel('cust-1', 'email', true);

      expect(result.channels.email).toBe(true);
    });

    it('should disable a notification channel', async () => {
      const existing = { id: 'npref-1', customerId: 'cust-1', channels: { email: true, sms: true, push: true } };
      const updated = { ...existing, channels: { email: true, sms: false, push: true } };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.updateChannel('cust-1', 'sms', false);

      expect(result.channels.sms).toBe(false);
    });

    it('should throw AppError 400 when channel name is invalid', async () => {
      mockRepository.findByCustomerId.mockResolvedValue({ id: 'npref-1', customerId: 'cust-1' });

      await expect(service.updateChannel('cust-1', 'telegram' as never, true)).rejects.toThrow(AppError);
      await expect(service.updateChannel('cust-1', 'telegram' as never, true)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw AppError 404 when preferences not found', async () => {
      mockRepository.findByCustomerId.mockResolvedValue(null);

      await expect(service.updateChannel('cust-no-prefs', 'email', true)).rejects.toThrow(AppError);
    });
  });

  describe('muteAll', () => {
    it('should disable all notification types', async () => {
      const existing = { id: 'npref-1', customerId: 'cust-1', orderUpdates: true, promotions: true, appointmentReminders: true };
      const muted = { ...existing, orderUpdates: false, promotions: false, appointmentReminders: false, deliveryAlerts: false, reviewRequests: false, loyaltyUpdates: false };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(muted);

      const result = await service.muteAll('cust-1');

      expect(result.orderUpdates).toBe(false);
      expect(result.promotions).toBe(false);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'cust-1',
        expect.objectContaining({ orderUpdates: false, promotions: false, appointmentReminders: false })
      );
    });
  });

  describe('enableAll', () => {
    it('should enable all notification types', async () => {
      const existing = { id: 'npref-1', customerId: 'cust-1', orderUpdates: false, promotions: false };
      const enabled = { ...existing, orderUpdates: true, promotions: true, appointmentReminders: true, deliveryAlerts: true, reviewRequests: true, loyaltyUpdates: true };

      mockRepository.findByCustomerId.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(enabled);

      const result = await service.enableAll('cust-1');

      expect(result.orderUpdates).toBe(true);
      expect(result.promotions).toBe(true);
    });
  });
});