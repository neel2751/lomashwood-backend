import { DeliveryReportService } from '../../app/delivery-reports/delivery-report.service';
import { DeliveryReportRepository } from '../../app/delivery-reports/delivery-report.repository';
import { DeliveryStatus, DeliveryChannel } from '../../app/delivery-reports/delivery-report.types';

jest.mock('../../app/delivery-reports/delivery-report.repository');

const mockRepo = new DeliveryReportRepository() as jest.Mocked<DeliveryReportRepository>;
const service = new DeliveryReportService(mockRepo);

describe('DeliveryReportService', () => {
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
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns delivery report when found', async () => {
      const report = { id: 'report-1', notificationId: 'notif-1' };
      mockRepo.findById.mockResolvedValue(report);

      const result = await service.findById('report-1');

      expect(result).toEqual(report);
    });

    it('returns null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByNotificationId', () => {
    it('returns all reports for a notification', async () => {
      const reports = [
        { id: 'report-1', notificationId: 'notif-1' },
        { id: 'report-2', notificationId: 'notif-1' },
      ];
      mockRepo.findByNotificationId.mockResolvedValue(reports);

      const result = await service.findByNotificationId('notif-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('markDelivered', () => {
    it('updates report status to delivered', async () => {
      const updated = { id: 'report-1', status: DeliveryStatus.DELIVERED, deliveredAt: new Date() };
      mockRepo.updateStatus.mockResolvedValue(updated);

      const result = await service.markDelivered('report-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'report-1',
        DeliveryStatus.DELIVERED,
        expect.any(Date),
      );
      expect(result.status).toBe(DeliveryStatus.DELIVERED);
    });
  });

  describe('markFailed', () => {
    it('updates report status to failed with reason', async () => {
      const updated = { id: 'report-1', status: DeliveryStatus.FAILED, failureReason: 'Bounced' };
      mockRepo.updateStatus.mockResolvedValue(updated);

      const result = await service.markFailed('report-1', 'Bounced');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'report-1',
        DeliveryStatus.FAILED,
        undefined,
        'Bounced',
      );
      expect(result.status).toBe(DeliveryStatus.FAILED);
    });
  });

  describe('getSummaryByChannel', () => {
    it('returns delivery summary grouped by channel', async () => {
      const summary = [
        { channel: DeliveryChannel.EMAIL, delivered: 10, failed: 2, total: 12 },
        { channel: DeliveryChannel.SMS, delivered: 5, failed: 1, total: 6 },
      ];
      mockRepo.getSummaryByChannel.mockResolvedValue(summary);

      const result = await service.getSummaryByChannel();

      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe(DeliveryChannel.EMAIL);
    });
  });

  describe('getDeliveryRate', () => {
    it('calculates delivery rate for a channel', async () => {
      mockRepo.countByStatus.mockImplementation(async (channel, status) => {
        if (status === DeliveryStatus.DELIVERED) return 80;
        if (status === DeliveryStatus.FAILED) return 20;
        return 0;
      });

      const rate = await service.getDeliveryRate(DeliveryChannel.EMAIL);

      expect(rate).toBe(80);
    });

    it('returns 0 when no deliveries recorded', async () => {
      mockRepo.countByStatus.mockResolvedValue(0);

      const rate = await service.getDeliveryRate(DeliveryChannel.EMAIL);

      expect(rate).toBe(0);
    });
  });

  describe('delete', () => {
    it('deletes a delivery report', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('report-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('report-1');
    });
  });
});