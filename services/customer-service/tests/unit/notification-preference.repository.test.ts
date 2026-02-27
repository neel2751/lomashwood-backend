import { NotificationPreferenceRepository } from '../../src/app/notification-preference/notification-preference.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('NotificationPreferenceRepository', () => {
  let repository: NotificationPreferenceRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new NotificationPreferenceRepository(prisma);
  });

  describe('findByCustomerId', () => {
    it('should find notification preferences by customerId', async () => {
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
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(prefs);

      const result = await repository.findByCustomerId('cust-1');

      expect(result).toEqual(prefs);
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
    });

    it('should return null when preferences not found', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByCustomerId('cust-no-prefs');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create preferences with defaults if not exists', async () => {
      const input = { orderUpdates: true, promotions: false };
      const created = {
        id: 'npref-new',
        customerId: 'cust-1',
        orderUpdates: true,
        promotions: false,
        appointmentReminders: true,
        deliveryAlerts: true,
        reviewRequests: true,
        loyaltyUpdates: true,
        channels: { email: true, sms: false, push: false },
      };
      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(created);

      const result = await repository.upsert('cust-1', input);

      expect(result).toEqual(created);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        update: input,
        create: expect.objectContaining({ customerId: 'cust-1', ...input }),
      });
    });

    it('should update existing preferences on conflict', async () => {
      const input = { promotions: true };
      const updated = { id: 'npref-1', customerId: 'cust-1', promotions: true };
      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(updated);

      const result = await repository.upsert('cust-1', input);

      expect(result.promotions).toBe(true);
    });
  });

  describe('update', () => {
    it('should update specific preference fields', async () => {
      const updateData = { orderUpdates: false, smsChannel: true };
      const updated = { id: 'npref-1', customerId: 'cust-1', orderUpdates: false };
      (prisma.notificationPreference.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('cust-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: updateData,
      });
    });

    it('should support partial updates', async () => {
      const updated = { id: 'npref-1', customerId: 'cust-1', loyaltyUpdates: false };
      (prisma.notificationPreference.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('cust-1', { loyaltyUpdates: false });

      expect(result.loyaltyUpdates).toBe(false);
      expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: { loyaltyUpdates: false },
      });
    });
  });
});