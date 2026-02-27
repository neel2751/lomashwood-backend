import { PushProvider } from '../../app/push/push.provider';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn(),
}));

const mockSend = jest.fn();
const mockSendMulticast = jest.fn();
const mockSendToTopic = jest.fn();

(admin.messaging as jest.Mock).mockReturnValue({
  send: mockSend,
  sendMulticast: mockSendMulticast,
  sendToTopic: mockSendToTopic,
});

const provider = new PushProvider({
  projectId: 'lomash-wood',
  clientEmail: 'firebase@lomash.iam.gserviceaccount.com',
  privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
});

describe('PushProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send', () => {
    it('sends push notification to a device token', async () => {
      mockSend.mockResolvedValue('projects/lomash-wood/messages/msg-1');

      const result = await provider.send({
        token: 'device-token-abc',
        title: 'Booking Confirmed',
        body: 'Your appointment is set.',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'device-token-abc',
          notification: { title: 'Booking Confirmed', body: 'Your appointment is set.' },
        }),
      );
      expect(result.messageId).toContain('messages/msg-1');
    });

    it('throws when firebase send fails', async () => {
      mockSend.mockRejectedValue(new Error('messaging/invalid-registration-token'));

      await expect(
        provider.send({ token: 'bad-token', title: 'Test', body: 'Test' }),
      ).rejects.toThrow('messaging/invalid-registration-token');
    });
  });

  describe('sendMulticast', () => {
    it('sends to multiple device tokens', async () => {
      mockSendMulticast.mockResolvedValue({ successCount: 2, failureCount: 0, responses: [] });

      const result = await provider.sendMulticast({
        tokens: ['token-1', 'token-2'],
        title: 'Promo',
        body: 'Big sale today!',
      });

      expect(mockSendMulticast).toHaveBeenCalledWith(
        expect.objectContaining({ tokens: ['token-1', 'token-2'] }),
      );
      expect(result.successCount).toBe(2);
    });
  });

  describe('sendToTopic', () => {
    it('sends notification to a subscribed topic', async () => {
      mockSendToTopic.mockResolvedValue('projects/lomash-wood/messages/topic-msg-1');

      const result = await provider.sendToTopic({
        topic: 'promotions',
        title: 'New Offer',
        body: 'Check it out!',
      });

      expect(mockSendToTopic).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'promotions' }),
      );
      expect(result.messageId).toContain('topic-msg-1');
    });
  });
});