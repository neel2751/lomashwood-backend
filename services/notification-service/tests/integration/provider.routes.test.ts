import request from 'supertest';
import express from 'express';
import { providerRouter } from '../../app/providers/provider.routes';
import { ProviderService } from '../../app/providers/provider.service';
import { ProviderType, ProviderStatus } from '../../app/providers/provider.types';

jest.mock('../../app/providers/provider.service');

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByType: jest.fn(),
  setActive: jest.fn(),
  setInactive: jest.fn(),
  checkHealth: jest.fn(),
  checkAllHealth: jest.fn(),
} as unknown as jest.Mocked<ProviderService>;

const app = express();
app.use(express.json());
app.use('/v1/providers', providerRouter(mockService));

describe('GET /v1/providers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with all providers', async () => {
    const providers = [
      { id: 'prov-1', name: 'NODEMAILER', type: ProviderType.EMAIL, status: ProviderStatus.ACTIVE },
      { id: 'prov-2', name: 'TWILIO', type: ProviderType.SMS, status: ProviderStatus.ACTIVE },
    ];
    mockService.findAll.mockResolvedValue(providers);

    const res = await request(app).get('/v1/providers');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when no providers configured', async () => {
    mockService.findAll.mockResolvedValue([]);

    const res = await request(app).get('/v1/providers');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /v1/providers/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with provider', async () => {
    const provider = { id: 'prov-1', name: 'NODEMAILER', type: ProviderType.EMAIL, status: ProviderStatus.ACTIVE };
    mockService.findById.mockResolvedValue(provider);

    const res = await request(app).get('/v1/providers/prov-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('prov-1');
  });

  it('returns 404 when not found', async () => {
    mockService.findById.mockResolvedValue(null);

    const res = await request(app).get('/v1/providers/missing');

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/providers/type/:type', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with providers of given type', async () => {
    const providers = [
      { id: 'prov-1', name: 'NODEMAILER', type: ProviderType.EMAIL },
      { id: 'prov-3', name: 'SES', type: ProviderType.EMAIL },
    ];
    mockService.findByType.mockResolvedValue(providers);

    const res = await request(app).get(`/v1/providers/type/${ProviderType.EMAIL}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 400 when provider type is invalid', async () => {
    const res = await request(app).get('/v1/providers/type/CARRIER_PIGEON');

    expect(res.status).toBe(400);
  });

  it('returns 200 with empty array when no providers of type', async () => {
    mockService.findByType.mockResolvedValue([]);

    const res = await request(app).get(`/v1/providers/type/${ProviderType.PUSH}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('PATCH /v1/providers/:id/activate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when provider is activated', async () => {
    const updated = { id: 'prov-1', status: ProviderStatus.ACTIVE };
    mockService.setActive.mockResolvedValue(updated);

    const res = await request(app).patch('/v1/providers/prov-1/activate');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(ProviderStatus.ACTIVE);
  });

  it('returns 404 when provider not found', async () => {
    mockService.setActive.mockRejectedValue({ statusCode: 404, message: 'Not found' });

    const res = await request(app).patch('/v1/providers/missing/activate');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/providers/:id/deactivate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when provider is deactivated', async () => {
    const updated = { id: 'prov-1', status: ProviderStatus.INACTIVE };
    mockService.setInactive.mockResolvedValue(updated);

    const res = await request(app).patch('/v1/providers/prov-1/deactivate');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(ProviderStatus.INACTIVE);
  });

  it('returns 404 when provider not found', async () => {
    mockService.setInactive.mockRejectedValue({ statusCode: 404, message: 'Not found' });

    const res = await request(app).patch('/v1/providers/missing/deactivate');

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/providers/:id/health', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when provider is healthy', async () => {
    mockService.checkHealth.mockResolvedValue({ id: 'prov-1', healthy: true, latencyMs: 42 });

    const res = await request(app).get('/v1/providers/prov-1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.healthy).toBe(true);
    expect(res.body.data.latencyMs).toBe(42);
  });

  it('returns 200 with healthy false when provider is down', async () => {
    mockService.checkHealth.mockResolvedValue({ id: 'prov-1', healthy: false, error: 'Connection refused' });

    const res = await request(app).get('/v1/providers/prov-1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.healthy).toBe(false);
    expect(res.body.data.error).toBe('Connection refused');
  });

  it('returns 404 when provider not found', async () => {
    mockService.checkHealth.mockRejectedValue({ statusCode: 404, message: 'Not found' });

    const res = await request(app).get('/v1/providers/missing/health');

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/providers/health/all', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with health status for all providers', async () => {
    const healthStatuses = [
      { id: 'prov-1', name: 'NODEMAILER', healthy: true },
      { id: 'prov-2', name: 'TWILIO', healthy: true },
      { id: 'prov-3', name: 'FIREBASE', healthy: false, error: 'Auth expired' },
    ];
    mockService.checkAllHealth.mockResolvedValue(healthStatuses);

    const res = await request(app).get('/v1/providers/health/all');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[2].healthy).toBe(false);
  });
});