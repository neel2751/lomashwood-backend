import { SmsRepository } from '../../app/sms/sms.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    smsLog: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const repo = new SmsRepository();

describe('SmsRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates an sms log record', async () => {
      const input = { to: '+441234567890', body: 'Test SMS', status: NotificationStatus.PENDING };
      const created = { id: 'sms-1', ...input };
      (prisma.smsLog.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.smsLog.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns sms log when found', async () => {
      const log = { id: 'sms-1', to: '+441234567890' };
      (prisma.smsLog.findUnique as jest.Mock).mockResolvedValue(log);

      const result = await repo.findById('sms-1');

      expect(result).toEqual(log);
    });

    it('returns null when not found', async () => {
      (prisma.smsLog.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findFailed', () => {
    it('returns all failed sms logs', async () => {
      const failed = [{ id: 'sms-1', status: NotificationStatus.FAILED }];
      (prisma.smsLog.findMany as jest.Mock).mockResolvedValue(failed);

      const result = await repo.findFailed();

      expect(prisma.smsLog.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.FAILED },
      });
      expect(result).toEqual(failed);
    });
  });

  describe('updateStatus', () => {
    it('updates sms log status', async () => {
      const updated = { id: 'sms-1', status: NotificationStatus.SENT };
      (prisma.smsLog.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('sms-1', NotificationStatus.SENT);

      expect(prisma.smsLog.update).toHaveBeenCalledWith({
        where: { id: 'sms-1' },
        data: { status: NotificationStatus.SENT },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('countByStatus', () => {
    it('returns count of sms by status', async () => {
      (prisma.smsLog.count as jest.Mock).mockResolvedValue(3);

      const count = await repo.countByStatus(NotificationStatus.SENT);

      expect(prisma.smsLog.count).toHaveBeenCalledWith({
        where: { status: NotificationStatus.SENT },
      });
      expect(count).toBe(3);
    });
  });

  describe('delete', () => {
    it('deletes sms log by id', async () => {
      (prisma.smsLog.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('sms-1');

      expect(prisma.smsLog.delete).toHaveBeenCalledWith({ where: { id: 'sms-1' } });
    });
  });
});