import request from 'supertest';
import express from 'express';
import { webhookRouter } from '../../app/webhooks/webhook.routes';
import { WebhookService } from '../../app/webhooks/webhook.service';
import { WebhookStatus } from '../../app/webhooks/webhook.types';

jest.mock('../../app/webhooks/webhook.service');

const mockService = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  dispatch: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<WebhookService>;

const app = express();
app.use(express.json());
app.use('/v1/webhooks', webhookRouter(mockService));

describe('GET /v1/webhooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with all webhooks', async () => {
    const webhooks = [{ id: 'wh-1' }, { id: 'wh-2' }];
    mockService.findAll.mockResolvedValue(webhooks);

    const res = await request(app).get('/v1/webhooks');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when none exist', async () => {
    mockService.findAll.mockResolvedValue([]);

    const res = await request(app).get('/v1/webhooks');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /v1/webhooks/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with webhook', async () => {
    const webhook = { id: 'wh-1', url: 'https://example.com/hook', status: WebhookStatus.ACTIVE };
    mockService.findById.mockResolvedValue(webhook);

    const res = await request(app).get('/v1/webhooks/wh-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('wh-1');
  });

  it('returns 404 when not found', async () => {
    mockService.findById.mockResolvedValue(null);

    const res = await request(app).get('/v1/webhooks/missing');

    expect(res.status).toBe(404);
  });
});

describe('POST /v1/webhooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on successful creation', async () => {
    const payload = { url: 'https://example.com/hook', event: 'booking.created', secret: 'sec' };
    const created = { id: 'wh-1', ...payload, status: WebhookStatus.ACTIVE };
    mockService.create.mockResolvedValue(created);

    const res = await request(app).post('/v1/webhooks').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('wh-1');
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(app)
      .post('/v1/webhooks')
      .send({ event: 'booking.created', secret: 'sec' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when url is not a valid URL', async () => {
    const res = await request(app)
      .post('/v1/webhooks')
      .send({ url: 'not-a-url', event: 'booking.created', secret: 'sec' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when event is missing', async () => {
    const res = await request(app)
      .post('/v1/webhooks')
      .send({ url: 'https://example.com/hook', secret: 'sec' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /v1/webhooks/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when status is updated', async () => {
    const updated = { id: 'wh-1', status: WebhookStatus.INACTIVE };
    mockService.updateStatus.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/v1/webhooks/wh-1/status')
      .send({ status: WebhookStatus.INACTIVE });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(WebhookStatus.INACTIVE);
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .patch('/v1/webhooks/wh-1/status')
      .send({ status: 'BROKEN' });

    expect(res.status).toBe(400);
  });
});

describe('POST /v1/webhooks/dispatch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful dispatch', async () => {
    mockService.dispatch.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/v1/webhooks/dispatch')
      .send({ event: 'booking.created', payload: { bookingId: 'b-1' } });

    expect(res.status).toBe(200);
  });

  it('returns 400 when event is missing', async () => {
    const res = await request(app)
      .post('/v1/webhooks/dispatch')
      .send({ payload: { bookingId: 'b-1' } });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/webhooks/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 on successful delete', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/v1/webhooks/wh-1');

    expect(res.status).toBe(204);
  });

  it('returns 500 when service throws', async () => {
    mockService.delete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/v1/webhooks/wh-1');

    expect(res.status).toBe(500);
  });
});