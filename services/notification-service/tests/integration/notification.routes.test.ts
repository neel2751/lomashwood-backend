import request from 'supertest';
import express from 'express';
import { notificationRouter } from '../../app/notifications/notification.routes';
import { NotificationService } from '../../app/notifications/notification.service';
import { NotificationStatus, NotificationType } from '../../app/notifications/notification.types';

jest.mock('../../app/notifications/notification.service');

const mockService = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<NotificationService>;

const app = express();
app.use(express.json());
app.use('/v1/notifications', notificationRouter(mockService));

describe('GET /v1/notifications/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with notification', async () => {
    const notif = { id: 'notif-1', type: NotificationType.EMAIL, status: NotificationStatus.SENT };
    mockService.findById.mockResolvedValue(notif);

    const res = await request(app).get('/v1/notifications/notif-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('notif-1');
  });

  it('returns 404 when not found', async () => {
    mockService.findById.mockResolvedValue(null);

    const res = await request(app).get('/v1/notifications/missing');

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/notifications/user/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with list of notifications', async () => {
    const notifications = [{ id: 'n1', userId: 'user-1' }, { id: 'n2', userId: 'user-1' }];
    mockService.findByUserId.mockResolvedValue(notifications);

    const res = await request(app).get('/v1/notifications/user/user-1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when user has no notifications', async () => {
    mockService.findByUserId.mockResolvedValue([]);

    const res = await request(app).get('/v1/notifications/user/user-empty');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('POST /v1/notifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on successful creation', async () => {
    const payload = { userId: 'user-1', type: NotificationType.EMAIL, subject: 'Hello', body: 'World' };
    const created = { id: 'notif-1', ...payload, status: NotificationStatus.PENDING };
    mockService.create.mockResolvedValue(created);

    const res = await request(app).post('/v1/notifications').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('notif-1');
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/v1/notifications')
      .send({ type: NotificationType.EMAIL, subject: 'Hi', body: 'Body' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .post('/v1/notifications')
      .send({ userId: 'user-1', type: 'FAX', subject: 'Hi', body: 'Body' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .post('/v1/notifications')
      .send({ userId: 'user-1', type: NotificationType.SMS, subject: 'Hi' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /v1/notifications/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on status update', async () => {
    const updated = { id: 'notif-1', status: NotificationStatus.SENT };
    mockService.updateStatus.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/v1/notifications/notif-1/status')
      .send({ status: NotificationStatus.SENT });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(NotificationStatus.SENT);
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .patch('/v1/notifications/notif-1/status')
      .send({ status: 'UNKNOWN' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/notifications/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 on successful delete', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/v1/notifications/notif-1');

    expect(res.status).toBe(204);
  });

  it('returns 500 when service throws', async () => {
    mockService.delete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/v1/notifications/notif-1');

    expect(res.status).toBe(500);
  });
});