import { PushRepository } from '../../app/push/push.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    pushLog: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const repo = new PushRepository();

describe('PushRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a push log record', async () => {
      const input = {
        token: 'device-token-abc',
        title: 'Alert',
        body: 'Message',
        status: NotificationStatus.PENDING,
      };
      const created = { id: 'push-1', ...input };
      (prisma.pushLog.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.pushLog.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns push log when found', async () => {
      const log = { id: 'push-1', token: 'device-token-abc' };
      (prisma.pushLog.findUnique as jest.Mock).mockResolvedValue(log);

      const result = await repo.findById('push-1');

      expect(result).toEqual(log);
    });

    it('returns null when not found', async () => {
      (prisma.pushLog.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findFailed', () => {
    it('returns all failed push logs', async () => {
      const failed = [{ id: 'push-1', status: NotificationStatus.FAILED }];
      (prisma.pushLog.findMany as jest.Mock).mockResolvedValue(failed);

      const result = await repo.findFailed();

      expect(prisma.pushLog.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.FAILED },
      });
      expect(result).toEqual(failed);
    });
  });

  describe('updateStatus', () => {
    it('updates push log status', async () => {
      const updated = { id: 'push-1', status: NotificationStatus.SENT };
      (prisma.pushLog.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('push-1', NotificationStatus.SENT);

      expect(prisma.pushLog.update).toHaveBeenCalledWith({
        where: { id: 'push-1' },
        data: { status: NotificationStatus.SENT },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('countByStatus', () => {
    it('returns count of push logs by status', async () => {
      (prisma.pushLog.count as jest.Mock).mockResolvedValue(7);

      const count = await repo.countByStatus(NotificationStatus.SENT);

      expect(prisma.pushLog.count).toHaveBeenCalledWith({
        where: { status: NotificationStatus.SENT },
      });
      expect(count).toBe(7);
    });
  });

  describe('delete', () => {
    it('deletes push log by id', async () => {
      (prisma.pushLog.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('push-1');

      expect(prisma.pushLog.delete).toHaveBeenCalledWith({ where: { id: 'push-1' } });
    });
  });
});