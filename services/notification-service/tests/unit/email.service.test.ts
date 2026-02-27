import { EmailService } from '../../app/email/email.service';
import { EmailProvider } from '../../app/email/email.provider';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../app/email/email.provider');

const mockProvider = new EmailProvider(null as any) as jest.Mocked<EmailProvider>;
const service = new EmailService(mockProvider);

describe('EmailService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send', () => {
    it('sends email successfully and returns sent status', async () => {
      mockProvider.send.mockResolvedValue({ messageId: 'msg-1', accepted: ['test@example.com'] });

      const result = await service.send({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      });

      expect(mockProvider.send).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      });
      expect(result.status).toBe(NotificationStatus.SENT);
    });

    it('returns failed status when provider throws', async () => {
      mockProvider.send.mockRejectedValue(new Error('SMTP connection refused'));

      const result = await service.send({
        to: 'test@example.com',
        subject: 'Fail Test',
        html: '<p>Hello</p>',
      });

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.error).toBe('SMTP connection refused');
    });
  });

  describe('sendBulk', () => {
    it('sends multiple emails and returns results', async () => {
      mockProvider.send.mockResolvedValue({ messageId: 'msg-x', accepted: ['a@a.com'] });

      const emails = [
        { to: 'a@a.com', subject: 'S1', html: '<p>1</p>' },
        { to: 'b@b.com', subject: 'S2', html: '<p>2</p>' },
      ];

      const results = await service.sendBulk(emails);

      expect(mockProvider.send).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it('handles partial failures in bulk send', async () => {
      mockProvider.send
        .mockResolvedValueOnce({ messageId: 'msg-ok', accepted: ['a@a.com'] })
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const emails = [
        { to: 'a@a.com', subject: 'S1', html: '<p>1</p>' },
        { to: 'b@b.com', subject: 'S2', html: '<p>2</p>' },
      ];

      const results = await service.sendBulk(emails);

      expect(results[0].status).toBe(NotificationStatus.SENT);
      expect(results[1].status).toBe(NotificationStatus.FAILED);
    });
  });

  describe('sendWithTemplate', () => {
    it('renders template and sends email', async () => {
      mockProvider.send.mockResolvedValue({ messageId: 'msg-t1', accepted: ['u@u.com'] });

      const result = await service.sendWithTemplate({
        to: 'u@u.com',
        templateId: 'welcome',
        variables: { name: 'Jake' },
      });

      expect(mockProvider.send).toHaveBeenCalled();
      expect(result.status).toBe(NotificationStatus.SENT);
    });
  });
});