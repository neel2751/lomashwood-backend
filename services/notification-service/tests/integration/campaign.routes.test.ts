import request from 'supertest';
import express from 'express';
import { campaignRouter } from '../../app/campaigns/campaign.routes';
import { CampaignService } from '../../app/campaigns/campaign.service';
import { CampaignStatus, CampaignChannel } from '../../app/campaigns/campaign.types';

jest.mock('../../app/campaigns/campaign.service');

const mockService = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  launch: jest.fn(),
  pause: jest.fn(),
  cancel: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<CampaignService>;

const app = express();
app.use(express.json());
app.use('/v1/campaigns', campaignRouter(mockService));

describe('GET /v1/campaigns', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with all campaigns', async () => {
    const campaigns = [{ id: 'camp-1' }, { id: 'camp-2' }];
    mockService.findAll.mockResolvedValue(campaigns);

    const res = await request(app).get('/v1/campaigns');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when none exist', async () => {
    mockService.findAll.mockResolvedValue([]);

    const res = await request(app).get('/v1/campaigns');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /v1/campaigns/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with campaign', async () => {
    const campaign = { id: 'camp-1', name: 'Summer Sale', status: CampaignStatus.DRAFT };
    mockService.findById.mockResolvedValue(campaign);

    const res = await request(app).get('/v1/campaigns/camp-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('camp-1');
  });

  it('returns 404 when not found', async () => {
    mockService.findById.mockResolvedValue(null);

    const res = await request(app).get('/v1/campaigns/missing');

    expect(res.status).toBe(404);
  });
});

describe('POST /v1/campaigns', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on successful creation', async () => {
    const payload = {
      name: 'Summer Sale 2026',
      channel: CampaignChannel.EMAIL,
      templateId: 'tpl-1',
      scheduledAt: new Date('2026-07-01T09:00:00Z').toISOString(),
    };
    const created = { id: 'camp-1', ...payload, status: CampaignStatus.DRAFT };
    mockService.create.mockResolvedValue(created);

    const res = await request(app).post('/v1/campaigns').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('camp-1');
    expect(res.body.data.status).toBe(CampaignStatus.DRAFT);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/v1/campaigns')
      .send({ channel: CampaignChannel.EMAIL, templateId: 'tpl-1' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when channel is invalid', async () => {
    const res = await request(app)
      .post('/v1/campaigns')
      .send({ name: 'Test', channel: 'BILLBOARD', templateId: 'tpl-1' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when templateId is missing', async () => {
    const res = await request(app)
      .post('/v1/campaigns')
      .send({ name: 'Test', channel: CampaignChannel.SMS });

    expect(res.status).toBe(400);
  });

  it('returns 400 when scheduledAt is not a valid date', async () => {
    const res = await request(app)
      .post('/v1/campaigns')
      .send({ name: 'Test', channel: CampaignChannel.EMAIL, templateId: 'tpl-1', scheduledAt: 'not-a-date' });

    expect(res.status).toBe(400);
  });
});

describe('POST /v1/campaigns/:id/launch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful launch', async () => {
    const launched = { id: 'camp-1', status: CampaignStatus.ACTIVE };
    mockService.launch.mockResolvedValue(launched);

    const res = await request(app).post('/v1/campaigns/camp-1/launch');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(CampaignStatus.ACTIVE);
  });

  it('returns 409 when campaign is already active', async () => {
    mockService.launch.mockRejectedValue({ statusCode: 409, message: 'Already active' });

    const res = await request(app).post('/v1/campaigns/camp-1/launch');

    expect(res.status).toBe(409);
  });
});

describe('POST /v1/campaigns/:id/pause', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful pause', async () => {
    const paused = { id: 'camp-1', status: CampaignStatus.PAUSED };
    mockService.pause.mockResolvedValue(paused);

    const res = await request(app).post('/v1/campaigns/camp-1/pause');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(CampaignStatus.PAUSED);
  });
});

describe('POST /v1/campaigns/:id/cancel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 on successful cancel', async () => {
    const cancelled = { id: 'camp-1', status: CampaignStatus.CANCELLED };
    mockService.cancel.mockResolvedValue(cancelled);

    const res = await request(app).post('/v1/campaigns/camp-1/cancel');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(CampaignStatus.CANCELLED);
  });
});

describe('DELETE /v1/campaigns/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 on successful delete', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/v1/campaigns/camp-1');

    expect(res.status).toBe(204);
  });

  it('returns 409 when trying to delete active campaign', async () => {
    mockService.delete.mockRejectedValue({ statusCode: 409, message: 'Cannot delete active campaign' });

    const res = await request(app).delete('/v1/campaigns/camp-1');

    expect(res.status).toBe(409);
  });
});