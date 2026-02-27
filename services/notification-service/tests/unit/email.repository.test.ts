import { EmailRepository } from '../../app/email/email.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    emailLog: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const repo = new EmailRepository();

describe('EmailRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates an email log record', async () => {
      const input = {
        to: 'test@example.com',
        subject: 'Subject',
        html: '<p>Body</p>',
        status: NotificationStatus.PENDING,
      };
      const created = { id: 'email-1', ...input };
      (prisma.emailLog.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.emailLog.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns email log when found', async () => {
      const log = { id: 'email-1', to: 'a@a.com' };
      (prisma.emailLog.findUnique as jest.Mock).mockResolvedValue(log);

      const result = await repo.findById('email-1');

      expect(result).toEqual(log);
    });

    it('returns null when not found', async () => {
      (prisma.emailLog.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findFailed', () => {
    it('returns all failed email logs', async () => {
      const failed = [{ id: 'e1', status: NotificationStatus.FAILED }];
      (prisma.emailLog.findMany as jest.Mock).mockResolvedValue(failed);

      const result = await repo.findFailed();

      expect(prisma.emailLog.findMany).toHaveBeenCalledWith({
        where: { status: NotificationStatus.FAILED },
      });
      expect(result).toEqual(failed);
    });
  });

  describe('updateStatus', () => {
    it('updates email log status', async () => {
      const updated = { id: 'email-1', status: NotificationStatus.SENT };
      (prisma.emailLog.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('email-1', NotificationStatus.SENT);

      expect(prisma.emailLog.update).toHaveBeenCalledWith({
        where: { id: 'email-1' },
        data: { status: NotificationStatus.SENT },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('countByStatus', () => {
    it('returns count of emails by status', async () => {
      (prisma.emailLog.count as jest.Mock).mockResolvedValue(5);

      const count = await repo.countByStatus(NotificationStatus.SENT);

      expect(prisma.emailLog.count).toHaveBeenCalledWith({
        where: { status: NotificationStatus.SENT },
      });
      expect(count).toBe(5);
    });
  });

  describe('delete', () => {
    it('deletes email log by id', async () => {
      (prisma.emailLog.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('email-1');

      expect(prisma.emailLog.delete).toHaveBeenCalledWith({ where: { id: 'email-1' } });
    });
  });
});