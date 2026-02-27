import { DeliveryReportRepository } from '../../app/delivery-reports/delivery-report.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { DeliveryStatus, DeliveryChannel } from '../../app/delivery-reports/delivery-report.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    deliveryReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const repo = new DeliveryReportRepository();

describe('DeliveryReportRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a delivery report record', async () => {
      const input = {
        notificationId: 'notif-1',
        channel: DeliveryChannel.EMAIL,
        recipient: 'user@example.com',
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
      };
      const created = { id: 'report-1', ...input };
      (prisma.deliveryReport.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.deliveryReport.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns report when found', async () => {
      const report = { id: 'report-1', notificationId: 'notif-1' };
      (prisma.deliveryReport.findUnique as jest.Mock).mockResolvedValue(report);

      const result = await repo.findById('report-1');

      expect(prisma.deliveryReport.findUnique).toHaveBeenCalledWith({ where: { id: 'report-1' } });
      expect(result).toEqual(report);
    });

    it('returns null when not found', async () => {
      (prisma.deliveryReport.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByNotificationId', () => {
    it('returns all reports for a notification', async () => {
      const reports = [{ id: 'r1', notificationId: 'notif-1' }, { id: 'r2', notificationId: 'notif-1' }];
      (prisma.deliveryReport.findMany as jest.Mock).mockResolvedValue(reports);

      const result = await repo.findByNotificationId('notif-1');

      expect(prisma.deliveryReport.findMany).toHaveBeenCalledWith({
        where: { notificationId: 'notif-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByChannel', () => {
    it('returns reports filtered by channel', async () => {
      const reports = [{ id: 'r1', channel: DeliveryChannel.SMS }];
      (prisma.deliveryReport.findMany as jest.Mock).mockResolvedValue(reports);

      const result = await repo.findByChannel(DeliveryChannel.SMS);

      expect(prisma.deliveryReport.findMany).toHaveBeenCalledWith({
        where: { channel: DeliveryChannel.SMS },
      });
      expect(result).toEqual(reports);
    });
  });

  describe('updateStatus', () => {
    it('updates status with deliveredAt timestamp', async () => {
      const now = new Date();
      const updated = { id: 'report-1', status: DeliveryStatus.DELIVERED, deliveredAt: now };
      (prisma.deliveryReport.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('report-1', DeliveryStatus.DELIVERED, now);

      expect(prisma.deliveryReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: DeliveryStatus.DELIVERED, deliveredAt: now },
      });
      expect(result).toEqual(updated);
    });

    it('updates status with failureReason', async () => {
      const updated = { id: 'report-1', status: DeliveryStatus.FAILED, failureReason: 'Bounced' };
      (prisma.deliveryReport.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('report-1', DeliveryStatus.FAILED, undefined, 'Bounced');

      expect(prisma.deliveryReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: DeliveryStatus.FAILED, failureReason: 'Bounced' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('countByStatus', () => {
    it('returns count of reports by channel and status', async () => {
      (prisma.deliveryReport.count as jest.Mock).mockResolvedValue(15);

      const count = await repo.countByStatus(DeliveryChannel.EMAIL, DeliveryStatus.DELIVERED);

      expect(prisma.deliveryReport.count).toHaveBeenCalledWith({
        where: { channel: DeliveryChannel.EMAIL, status: DeliveryStatus.DELIVERED },
      });
      expect(count).toBe(15);
    });
  });

  describe('getSummaryByChannel', () => {
    it('returns grouped summary by channel', async () => {
      const grouped = [
        { channel: DeliveryChannel.EMAIL, _count: { id: 12 } },
        { channel: DeliveryChannel.SMS, _count: { id: 6 } },
      ];
      (prisma.deliveryReport.groupBy as jest.Mock).mockResolvedValue(grouped);

      const result = await repo.getSummaryByChannel();

      expect(prisma.deliveryReport.groupBy).toHaveBeenCalledWith({
        by: ['channel'],
        _count: { id: true },
      });
      expect(result).toEqual(grouped);
    });
  });

  describe('delete', () => {
    it('deletes delivery report by id', async () => {
      (prisma.deliveryReport.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('report-1');

      expect(prisma.deliveryReport.delete).toHaveBeenCalledWith({ where: { id: 'report-1' } });
    });
  });
});