import { SmsProvider } from '../../app/sms/sms.provider';
import twilio from 'twilio';

jest.mock('twilio');

const mockMessages = {
  create: jest.fn(),
};

const mockClient = {
  messages: mockMessages,
};

(twilio as jest.MockedFunction<typeof twilio>).mockReturnValue(mockClient as any);

const provider = new SmsProvider({
  accountSid: 'ACtest123',
  authToken: 'auth-token-test',
  from: '+440000000000',
});

describe('SmsProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send', () => {
    it('sends sms and returns message info', async () => {
      const info = { sid: 'SM123', status: 'queued', to: '+441234567890' };
      mockMessages.create.mockResolvedValue(info);

      const result = await provider.send({
        to: '+441234567890',
        body: 'Confirmation message',
      });

      expect(mockMessages.create).toHaveBeenCalledWith({
        from: '+440000000000',
        to: '+441234567890',
        body: 'Confirmation message',
      });
      expect(result.sid).toBe('SM123');
    });

    it('throws when Twilio client throws', async () => {
      mockMessages.create.mockRejectedValue(new Error('Invalid phone number'));

      await expect(
        provider.send({ to: 'bad', body: 'Test' }),
      ).rejects.toThrow('Invalid phone number');
    });
  });
});