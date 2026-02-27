import { PushService } from '../../app/push/push.service';
import { PushProvider } from '../../app/push/push.provider';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../app/push/push.provider');

const mockProvider = new PushProvider(null as any) as jest.Mocked<PushProvider>;
const service = new PushService(mockProvider);

describe('PushService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send', () => {
    it('sends push notification successfully', async () => {
      mockProvider.send.mockResolvedValue({ messageId: 'push-msg-1', successCount: 1 });

      const result = await service.send({
        token: 'device-token-abc',
        title: 'New Booking',
        body: 'Your appointment is confirmed.',
      });

      expect(mockProvider.send).toHaveBeenCalledWith({
        token: 'device-token-abc',
        title: 'New Booking',
        body: 'Your appointment is confirmed.',
      });
      expect(result.status).toBe(NotificationStatus.SENT);
    });

    it('returns failed status when provider throws', async () => {
      mockProvider.send.mockRejectedValue(new Error('Invalid device token'));

      const result = await service.send({
        token: 'bad-token',
        title: 'Test',
        body: 'Test body',
      });

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.error).toBe('Invalid device token');
    });
  });

  describe('sendToMultiple', () => {
    it('sends to multiple device tokens', async () => {
      mockProvider.sendMulticast.mockResolvedValue({ successCount: 2, failureCount: 0 });

      const result = await service.sendToMultiple({
        tokens: ['token-1', 'token-2'],
        title: 'Offer Alert',
        body: 'Check out our new sale!',
      });

      expect(mockProvider.sendMulticast).toHaveBeenCalledWith(
        expect.objectContaining({ tokens: ['token-1', 'token-2'] }),
      );
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('reports partial failures', async () => {
      mockProvider.sendMulticast.mockResolvedValue({ successCount: 1, failureCount: 1 });

      const result = await service.sendToMultiple({
        tokens: ['token-good', 'token-bad'],
        title: 'Alert',
        body: 'Message',
      });

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('sendToTopic', () => {
    it('sends notification to a topic', async () => {
      mockProvider.sendToTopic.mockResolvedValue({ messageId: 'topic-msg-1' });

      const result = await service.sendToTopic({
        topic: 'all-users',
        title: 'Announcement',
        body: 'Big news!',
      });

      expect(mockProvider.sendToTopic).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'all-users' }),
      );
      expect(result.status).toBe(NotificationStatus.SENT);
    });
  });
});