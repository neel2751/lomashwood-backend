import { NotificationRepository } from '../../app/notifications/notification.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { NotificationStatus, NotificationType } from '../../app/notifications/notification.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const repo = new NotificationRepository();

describe('NotificationRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a notification in the database', async () => {
      const input = {
        userId: 'user-1',
        type: NotificationType.EMAIL,
        subject: 'Welcome',
        body: 'Hello!',
      };
      const created = { id: 'notif-1', ...input, status: NotificationStatus.PENDING };
      (prisma.notification.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.notification.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns notification when found', async () => {
      const notif = { id: 'notif-1', type: NotificationType.EMAIL };
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(notif);

      const result = await repo.findById('notif-1');

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(result).toEqual(notif);
    });

    it('returns null when not found', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all notifications for a user', async () => {
      const notifications = [{ id: 'n1' }, { id: 'n2' }];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(notifications);

      const result = await repo.findByUserId('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('updates status without error message', async () => {
      const updated = { id: 'notif-1', status: NotificationStatus.SENT };
      (prisma.notification.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('notif-1', NotificationStatus.SENT);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { status: NotificationStatus.SENT },
      });
      expect(result).toEqual(updated);
    });

    it('updates status with error message', async () => {
      const updated = { id: 'notif-1', status: NotificationStatus.FAILED, error: 'smtp error' };
      (prisma.notification.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('notif-1', NotificationStatus.FAILED, 'smtp error');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { status: NotificationStatus.FAILED, error: 'smtp error' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes notification by id', async () => {
      (prisma.notification.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('notif-1');

      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
    });
  });

  describe('findPending', () => {
    it('returns all pending notifications', async () => {
      const pending = [{ id: 'n1', status: NotificationStatus.PENDING }];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(pending);

      const result = await repo.findPending();

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.PENDING },
      });
      expect(result).toEqual(pending);
    });
  });
});