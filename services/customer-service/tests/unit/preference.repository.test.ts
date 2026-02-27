import { PreferenceRepository } from '../../src/app/profiles/profile.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    customerPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('PreferenceRepository', () => {
  let repository: PreferenceRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    repository = new PreferenceRepository(prisma);
  });

  describe('findByCustomerId', () => {
    it('should find preferences by customerId', async () => {
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
      (prisma.customerPreference.findUnique as jest.Mock).mockResolvedValue(preferences);

      const result = await repository.findByCustomerId('cust-1');

      expect(result).toEqual(preferences);
      expect(prisma.customerPreference.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
      });
    });

    it('should return null when no preferences found', async () => {
      (prisma.customerPreference.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByCustomerId('cust-no-prefs');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a preference record with defaults', async () => {
      const input = {
        customerId: 'cust-2',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingEmails: true,
        newsletterSubscribed: false,
        preferredContactMethod: 'EMAIL',
      };
      const created = { id: 'pref-2', ...input, createdAt: new Date(), updatedAt: new Date() };
      (prisma.customerPreference.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create(input);

      expect(result).toEqual(created);
      expect(prisma.customerPreference.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update preferences by customerId', async () => {
      const updateData = { emailNotifications: false, smsNotifications: true };
      const updated = {
        id: 'pref-1',
        customerId: 'cust-1',
        emailNotifications: false,
        smsNotifications: true,
        pushNotifications: false,
        marketingEmails: true,
        newsletterSubscribed: false,
        preferredContactMethod: 'SMS',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.customerPreference.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('cust-1', updateData);

      expect(result).toEqual(updated);
      expect(prisma.customerPreference.update).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        data: updateData,
      });
    });
  });

  describe('upsert', () => {
    it('should upsert preference record', async () => {
      const input = {
        customerId: 'cust-3',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingEmails: false,
        newsletterSubscribed: true,
        preferredContactMethod: 'EMAIL',
      };
      const upserted = { id: 'pref-3', ...input, createdAt: new Date(), updatedAt: new Date() };
      (prisma.customerPreference.upsert as jest.Mock).mockResolvedValue(upserted);

      const result = await repository.upsert(input);

      expect(result).toEqual(upserted);
      expect(prisma.customerPreference.upsert).toHaveBeenCalledWith({
        where: { customerId: 'cust-3' },
        update: input,
        create: input,
      });
    });

    it('should handle newsletter subscription update via upsert', async () => {
      const input = {
        customerId: 'cust-1',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false,
        newsletterSubscribed: true,
        preferredContactMethod: 'EMAIL',
      };
      const upserted = { id: 'pref-1', ...input };
      (prisma.customerPreference.upsert as jest.Mock).mockResolvedValue(upserted);

      const result = await repository.upsert(input);

      expect(result.newsletterSubscribed).toBe(true);
    });
  });
});