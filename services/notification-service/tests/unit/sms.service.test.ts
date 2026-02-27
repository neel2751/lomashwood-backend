import { SmsService } from '../../app/sms/sms.service';
import { SmsProvider } from '../../app/sms/sms.provider';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../app/sms/sms.provider');

const mockProvider = new SmsProvider(null as any) as jest.Mocked<SmsProvider>;
const service = new SmsService(mockProvider);

describe('SmsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send', () => {
    it('sends sms successfully', async () => {
      mockProvider.send.mockResolvedValue({ sid: 'SM123', status: 'queued' });

      const result = await service.send({
        to: '+441234567890',
        body: 'Your booking is confirmed.',
      });

      expect(mockProvider.send).toHaveBeenCalledWith({
        to: '+441234567890',
        body: 'Your booking is confirmed.',
      });
      expect(result.status).toBe(NotificationStatus.SENT);
    });

    it('returns failed status when provider throws', async () => {
      mockProvider.send.mockRejectedValue(new Error('Invalid phone number'));

      const result = await service.send({
        to: 'bad-number',
        body: 'Test',
      });

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.error).toBe('Invalid phone number');
    });
  });

  describe('sendBulk', () => {
    it('sends to multiple recipients', async () => {
      mockProvider.send.mockResolvedValue({ sid: 'SM-ok', status: 'queued' });

      const messages = [
        { to: '+441111111111', body: 'Msg 1' },
        { to: '+442222222222', body: 'Msg 2' },
      ];

      const results = await service.sendBulk(messages);

      expect(mockProvider.send).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.status === NotificationStatus.SENT)).toBe(true);
    });

    it('handles partial failures', async () => {
      mockProvider.send
        .mockResolvedValueOnce({ sid: 'SM-ok', status: 'queued' })
        .mockRejectedValueOnce(new Error('Network error'));

      const messages = [
        { to: '+441111111111', body: 'Msg 1' },
        { to: '+442222222222', body: 'Msg 2' },
      ];

      const results = await service.sendBulk(messages);

      expect(results[0].status).toBe(NotificationStatus.SENT);
      expect(results[1].status).toBe(NotificationStatus.FAILED);
    });
  });

  describe('sendOtp', () => {
    it('formats and sends OTP message', async () => {
      mockProvider.send.mockResolvedValue({ sid: 'SM-otp', status: 'queued' });

      const result = await service.sendOtp('+441234567890', '123456');

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+441234567890',
          body: expect.stringContaining('123456'),
        }),
      );
      expect(result.status).toBe(NotificationStatus.SENT);
    });
  });
});