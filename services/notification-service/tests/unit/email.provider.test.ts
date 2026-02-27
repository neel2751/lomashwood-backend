import { EmailProvider } from '../../app/email/email.provider';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
};

(nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

const provider = new EmailProvider({
  host: 'smtp.test.com',
  port: 587,
  auth: { user: 'user@test.com', pass: 'password' },
});

describe('EmailProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send', () => {
    it('sends email and returns message info', async () => {
      const info = { messageId: 'msg-1', accepted: ['to@example.com'], rejected: [] };
      mockTransporter.sendMail.mockResolvedValue(info);

      const result = await provider.send({
        to: 'to@example.com',
        subject: 'Hello',
        html: '<p>World</p>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@example.com',
          subject: 'Hello',
          html: '<p>World</p>',
        }),
      );
      expect(result.messageId).toBe('msg-1');
    });

    it('throws when sendMail fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Connection timeout'));

      await expect(
        provider.send({ to: 'to@example.com', subject: 'Hello', html: '<p>World</p>' }),
      ).rejects.toThrow('Connection timeout');
    });

    it('sends with CC and BCC when provided', async () => {
      const info = { messageId: 'msg-2', accepted: ['to@example.com'], rejected: [] };
      mockTransporter.sendMail.mockResolvedValue(info);

      await provider.send({
        to: 'to@example.com',
        subject: 'CC Test',
        html: '<p>Hi</p>',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: 'bcc@example.com',
        }),
      );
    });
  });

  describe('verify', () => {
    it('resolves when connection is healthy', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      await expect(provider.verify()).resolves.toBe(true);
    });

    it('throws when connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Auth failed'));

      await expect(provider.verify()).rejects.toThrow('Auth failed');
    });
  });
});