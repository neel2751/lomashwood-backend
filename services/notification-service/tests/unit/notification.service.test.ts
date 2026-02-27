import { NotificationService } from '../../app/notifications/notification.service';
import { NotificationRepository } from '../../app/notifications/notification.repository';
import { NotificationStatus, NotificationType } from '../../app/notifications/notification.types';

jest.mock('../../app/notifications/notification.repository');

const mockRepo = new NotificationRepository() as jest.Mocked<NotificationRepository>;

const service = new NotificationService(mockRepo);

describe('NotificationService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a notification record', async () => {
      const payload = {
        userId: 'user-1',
        type: NotificationType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
      };
      const expected = { id: 'notif-1', ...payload, status: NotificationStatus.PENDING };
      mockRepo.create.mockResolvedValue(expected);

      const result = await service.create(payload);

      expect(mockRepo.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('returns a notification by id', async () => {
      const notif = { id: 'notif-1', status: NotificationStatus.SENT };
      mockRepo.findById.mockResolvedValue(notif);

      const result = await service.findById('notif-1');

      expect(result).toEqual(notif);
    });

    it('returns null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('updates notification status', async () => {
      const updated = { id: 'notif-1', status: NotificationStatus.SENT };
      mockRepo.updateStatus.mockResolvedValue(updated);

      const result = await service.updateStatus('notif-1', NotificationStatus.SENT);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('notif-1', NotificationStatus.SENT);
      expect(result).toEqual(updated);
    });
  });

  describe('findByUserId', () => {
    it('returns all notifications for a user', async () => {
      const notifications = [
        { id: 'n1', userId: 'user-1' },
        { id: 'n2', userId: 'user-1' },
      ];
      mockRepo.findByUserId.mockResolvedValue(notifications);

      const result = await service.findByUserId('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('markAsFailed', () => {
    it('marks a notification as failed with error', async () => {
      const updated = { id: 'notif-1', status: NotificationStatus.FAILED, error: 'timeout' };
      mockRepo.updateStatus.mockResolvedValue(updated);

      const result = await service.markAsFailed('notif-1', 'timeout');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('notif-1', NotificationStatus.FAILED, 'timeout');
      expect(result.status).toBe(NotificationStatus.FAILED);
    });
  });

  describe('delete', () => {
    it('deletes a notification', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('notif-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('notif-1');
    });
  });
});