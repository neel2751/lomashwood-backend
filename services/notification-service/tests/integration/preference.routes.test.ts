import request from 'supertest';
import express from 'express';
import { preferenceRouter } from '../../app/preferences/preference.routes';
import { PreferenceService } from '../../app/preferences/preference.service';
import { NotificationType } from '../../app/notifications/notification.types';

jest.mock('../../app/preferences/preference.service');

const mockService = {
  upsert: jest.fn(),
  findByUserId: jest.fn(),
  isChannelEnabled: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<PreferenceService>;

const app = express();
app.use(express.json());
app.use('/v1/preferences', preferenceRouter(mockService));

describe('GET /v1/preferences/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with user preferences', async () => {
    const pref = { id: 'pref-1', userId: 'user-1', emailEnabled: true, smsEnabled: false, pushEnabled: true };
    mockService.findByUserId.mockResolvedValue(pref);

    const res = await request(app).get('/v1/preferences/user-1');

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe('user-1');
  });

  it('returns 404 when no preference found', async () => {
    mockService.findByUserId.mockResolvedValue(null);

    const res = await request(app).get('/v1/preferences/user-no-pref');

    expect(res.status).toBe(404);
  });
});

describe('PUT /v1/preferences/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful upsert', async () => {
    const payload = { emailEnabled: true, smsEnabled: false, pushEnabled: true };
    const upserted = { id: 'pref-1', userId: 'user-1', ...payload };
    mockService.upsert.mockResolvedValue(upserted);

    const res = await request(app).put('/v1/preferences/user-1').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.emailEnabled).toBe(true);
  });

  it('returns 400 when all fields are missing', async () => {
    const res = await request(app).put('/v1/preferences/user-1').send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when a field is not boolean', async () => {
    const res = await request(app)
      .put('/v1/preferences/user-1')
      .send({ emailEnabled: 'yes', smsEnabled: false });

    expect(res.status).toBe(400);
  });
});

describe('GET /v1/preferences/:userId/channel/:channel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with channel enabled status', async () => {
    mockService.isChannelEnabled.mockResolvedValue(true);

    const res = await request(app).get(`/v1/preferences/user-1/channel/${NotificationType.EMAIL}`);

    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(true);
  });

  it('returns 200 with enabled false when channel is disabled', async () => {
    mockService.isChannelEnabled.mockResolvedValue(false);

    const res = await request(app).get(`/v1/preferences/user-1/channel/${NotificationType.SMS}`);

    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(false);
  });

  it('returns 400 when channel is invalid', async () => {
    const res = await request(app).get('/v1/preferences/user-1/channel/PIGEON');

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/preferences/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 on successful delete', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/v1/preferences/user-1');

    expect(res.status).toBe(204);
  });

  it('returns 500 when service throws', async () => {
    mockService.delete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/v1/preferences/user-1');

    expect(res.status).toBe(500);
  });
});