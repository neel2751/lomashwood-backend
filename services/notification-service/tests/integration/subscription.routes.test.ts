import request from 'supertest';
import express from 'express';
import { subscriptionRouter } from '../../app/subscriptions/subscription.routes';
import { SubscriptionService } from '../../app/subscriptions/subscription.service';
import { SubscriptionChannel, SubscriptionStatus } from '../../app/subscriptions/subscription.types';

jest.mock('../../app/subscriptions/subscription.service');

const mockService = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  findByUserId: jest.fn(),
  findByTopic: jest.fn(),
  isSubscribed: jest.fn(),
} as unknown as jest.Mocked<SubscriptionService>;

const app = express();
app.use(express.json());
app.use('/v1/subscriptions', subscriptionRouter(mockService));

describe('POST /v1/subscriptions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on successful subscription', async () => {
    const payload = { userId: 'user-1', channel: SubscriptionChannel.EMAIL, topic: 'promotions' };
    const created = { id: 'sub-1', ...payload, status: SubscriptionStatus.ACTIVE };
    mockService.subscribe.mockResolvedValue(created);

    const res = await request(app).post('/v1/subscriptions').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/v1/subscriptions')
      .send({ channel: SubscriptionChannel.EMAIL, topic: 'promotions' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when channel is invalid', async () => {
    const res = await request(app)
      .post('/v1/subscriptions')
      .send({ userId: 'user-1', channel: 'PIGEON', topic: 'promotions' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when topic is missing', async () => {
    const res = await request(app)
      .post('/v1/subscriptions')
      .send({ userId: 'user-1', channel: SubscriptionChannel.SMS });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/subscriptions/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful unsubscribe', async () => {
    const updated = { id: 'sub-1', status: SubscriptionStatus.INACTIVE };
    mockService.unsubscribe.mockResolvedValue(updated);

    const res = await request(app).delete('/v1/subscriptions/sub-1');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(SubscriptionStatus.INACTIVE);
  });

  it('returns 500 when service throws', async () => {
    mockService.unsubscribe.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/v1/subscriptions/sub-1');

    expect(res.status).toBe(500);
  });
});

describe('GET /v1/subscriptions/user/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with user subscriptions', async () => {
    const subs = [{ id: 'sub-1', userId: 'user-1' }, { id: 'sub-2', userId: 'user-1' }];
    mockService.findByUserId.mockResolvedValue(subs);

    const res = await request(app).get('/v1/subscriptions/user/user-1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when no subscriptions', async () => {
    mockService.findByUserId.mockResolvedValue([]);

    const res = await request(app).get('/v1/subscriptions/user/user-empty');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /v1/subscriptions/topic/:topic', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with topic subscribers', async () => {
    const subs = [{ id: 'sub-1', topic: 'promotions' }];
    mockService.findByTopic.mockResolvedValue(subs);

    const res = await request(app).get('/v1/subscriptions/topic/promotions');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /v1/subscriptions/check', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with isSubscribed true', async () => {
    mockService.isSubscribed.mockResolvedValue(true);

    const res = await request(app)
      .get('/v1/subscriptions/check')
      .query({ userId: 'user-1', topic: 'promotions' });

    expect(res.status).toBe(200);
    expect(res.body.data.isSubscribed).toBe(true);
  });

  it('returns 200 with isSubscribed false', async () => {
    mockService.isSubscribed.mockResolvedValue(false);

    const res = await request(app)
      .get('/v1/subscriptions/check')
      .query({ userId: 'user-1', topic: 'unknown' });

    expect(res.status).toBe(200);
    expect(res.body.data.isSubscribed).toBe(false);
  });

  it('returns 400 when userId query param is missing', async () => {
    const res = await request(app)
      .get('/v1/subscriptions/check')
      .query({ topic: 'promotions' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when topic query param is missing', async () => {
    const res = await request(app)
      .get('/v1/subscriptions/check')
      .query({ userId: 'user-1' });

    expect(res.status).toBe(400);
  });
});