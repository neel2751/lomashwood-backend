import request from 'supertest';
import express from 'express';
import { smsRouter } from '../../app/sms/sms.routes';
import { SmsService } from '../../app/sms/sms.service';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../app/sms/sms.service');

const mockService = {
  send: jest.fn(),
  sendBulk: jest.fn(),
  sendOtp: jest.fn(),
} as unknown as jest.Mocked<SmsService>;

const app = express();
app.use(express.json());
app.use('/v1/sms', smsRouter(mockService));

describe('POST /v1/sms/send', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful send', async () => {
    mockService.send.mockResolvedValue({ status: NotificationStatus.SENT, sid: 'SM123' });

    const res = await request(app)
      .post('/v1/sms/send')
      .send({ to: '+447911123456', body: 'Your booking is confirmed.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when to is missing', async () => {
    const res = await request(app)
      .post('/v1/sms/send')
      .send({ body: 'Your booking is confirmed.' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .post('/v1/sms/send')
      .send({ to: '+447911123456' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when phone number is not in E.164 format', async () => {
    const res = await request(app)
      .post('/v1/sms/send')
      .send({ to: '07911123456', body: 'Message' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body exceeds 160 characters', async () => {
    const res = await request(app)
      .post('/v1/sms/send')
      .send({ to: '+447911123456', body: 'a'.repeat(161) });

    expect(res.status).toBe(400);
  });

  it('returns 502 when provider fails', async () => {
    mockService.send.mockResolvedValue({ status: NotificationStatus.FAILED, error: 'Invalid number' });

    const res = await request(app)
      .post('/v1/sms/send')
      .send({ to: '+447911123456', body: 'Message' });

    expect(res.status).toBe(502);
  });
});

describe('POST /v1/sms/send-bulk', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with results array', async () => {
    const results = [{ status: NotificationStatus.SENT }, { status: NotificationStatus.SENT }];
    mockService.sendBulk.mockResolvedValue(results);

    const res = await request(app)
      .post('/v1/sms/send-bulk')
      .send({
        messages: [
          { to: '+441111111111', body: 'Msg 1' },
          { to: '+442222222222', body: 'Msg 2' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 400 when messages array is empty', async () => {
    const res = await request(app).post('/v1/sms/send-bulk').send({ messages: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when messages field is missing', async () => {
    const res = await request(app).post('/v1/sms/send-bulk').send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /v1/sms/send-otp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when OTP is sent successfully', async () => {
    mockService.sendOtp.mockResolvedValue({ status: NotificationStatus.SENT });

    const res = await request(app)
      .post('/v1/sms/send-otp')
      .send({ to: '+447911123456', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when code is missing', async () => {
    const res = await request(app)
      .post('/v1/sms/send-otp')
      .send({ to: '+447911123456' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when code is not 6 digits', async () => {
    const res = await request(app)
      .post('/v1/sms/send-otp')
      .send({ to: '+447911123456', code: '12345' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when phone number is missing', async () => {
    const res = await request(app)
      .post('/v1/sms/send-otp')
      .send({ code: '123456' });

    expect(res.status).toBe(400);
  });
});