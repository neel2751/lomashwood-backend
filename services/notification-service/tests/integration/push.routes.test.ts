import request from 'supertest';
import express from 'express';
import { pushRouter } from '../../app/push/push.routes';
import { PushService } from '../../app/push/push.service';
import { NotificationStatus } from '../../app/notifications/notification.types';

jest.mock('../../app/push/push.service');

const mockService = {
  send: jest.fn(),
  sendToMultiple: jest.fn(),
  sendToTopic: jest.fn(),
} as unknown as jest.Mocked<PushService>;

const app = express();
app.use(express.json());
app.use('/v1/push', pushRouter(mockService));

describe('POST /v1/push/send', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful send', async () => {
    mockService.send.mockResolvedValue({ status: NotificationStatus.SENT });

    const res = await request(app)
      .post('/v1/push/send')
      .send({ token: 'device-token-abc', title: 'Booking Confirmed', body: 'Your slot is booked.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/v1/push/send')
      .send({ title: 'Alert', body: 'Message' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/v1/push/send')
      .send({ token: 'device-token-abc', body: 'Message' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .post('/v1/push/send')
      .send({ token: 'device-token-abc', title: 'Alert' });

    expect(res.status).toBe(400);
  });

  it('returns 502 when provider fails', async () => {
    mockService.send.mockResolvedValue({ status: NotificationStatus.FAILED, error: 'Invalid token' });

    const res = await request(app)
      .post('/v1/push/send')
      .send({ token: 'bad-token', title: 'Alert', body: 'Message' });

    expect(res.status).toBe(502);
  });
});

describe('POST /v1/push/send-multicast', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with success and failure counts', async () => {
    mockService.sendToMultiple.mockResolvedValue({ successCount: 2, failureCount: 0 });

    const res = await request(app)
      .post('/v1/push/send-multicast')
      .send({ tokens: ['token-1', 'token-2'], title: 'Offer', body: 'Big sale!' });

    expect(res.status).toBe(200);
    expect(res.body.data.successCount).toBe(2);
    expect(res.body.data.failureCount).toBe(0);
  });

  it('returns 400 when tokens array is empty', async () => {
    const res = await request(app)
      .post('/v1/push/send-multicast')
      .send({ tokens: [], title: 'Offer', body: 'Big sale!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when tokens field is missing', async () => {
    const res = await request(app)
      .post('/v1/push/send-multicast')
      .send({ title: 'Offer', body: 'Big sale!' });

    expect(res.status).toBe(400);
  });

  it('returns 200 with partial failure counts', async () => {
    mockService.sendToMultiple.mockResolvedValue({ successCount: 1, failureCount: 1 });

    const res = await request(app)
      .post('/v1/push/send-multicast')
      .send({ tokens: ['good-token', 'bad-token'], title: 'Alert', body: 'Message' });

    expect(res.status).toBe(200);
    expect(res.body.data.successCount).toBe(1);
    expect(res.body.data.failureCount).toBe(1);
  });
});

describe('POST /v1/push/send-topic', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when topic send succeeds', async () => {
    mockService.sendToTopic.mockResolvedValue({ status: NotificationStatus.SENT, messageId: 'msg-t1' });

    const res = await request(app)
      .post('/v1/push/send-topic')
      .send({ topic: 'promotions', title: 'New Offer', body: 'Check it out!' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when topic is missing', async () => {
    const res = await request(app)
      .post('/v1/push/send-topic')
      .send({ title: 'New Offer', body: 'Check it out!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/v1/push/send-topic')
      .send({ topic: 'promotions', body: 'Check it out!' });

    expect(res.status).toBe(400);
  });
});