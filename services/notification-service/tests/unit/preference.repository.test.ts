import { PreferenceRepository } from '../../app/preferences/preference.repository';
import { prisma } from '../../infrastructure/db/prisma.client';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    notificationPreference: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const repo = new PreferenceRepository();

describe('PreferenceRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a preference record', async () => {
      const input = { userId: 'user-1', emailEnabled: true, smsEnabled: false, pushEnabled: true };
      const created = { id: 'pref-1', ...input };
      (prisma.notificationPreference.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findByUserId', () => {
    it('returns preference when found', async () => {
      const pref = { id: 'pref-1', userId: 'user-1' };
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(pref);

      const result = await repo.findByUserId('user-1');

      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual(pref);
    });

    it('returns null when not found', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findByUserId('missing');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates preference fields', async () => {
      const updated = { id: 'pref-1', emailEnabled: false, smsEnabled: true };
      (prisma.notificationPreference.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.update('pref-1', { emailEnabled: false, smsEnabled: true });

      expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { id: 'pref-1' },
        data: { emailEnabled: false, smsEnabled: true },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes preference by id', async () => {
      (prisma.notificationPreference.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('pref-1');

      expect(prisma.notificationPreference.delete).toHaveBeenCalledWith({ where: { id: 'pref-1' } });
    });
  });
});