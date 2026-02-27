import request from 'supertest';
import express from 'express';
import { deliveryReportRouter } from '../../app/delivery-reports/delivery-report.routes';
import { DeliveryReportService } from '../../app/delivery-reports/delivery-report.service';
import { DeliveryStatus, DeliveryChannel } from '../../app/delivery-reports/delivery-report.types';

jest.mock('../../app/delivery-reports/delivery-report.service');

const mockService = {
  create: jest.fn(),
  findById: jest.fn(),
  findByNotificationId: jest.fn(),
  markDelivered: jest.fn(),
  markFailed: jest.fn(),
  getSummaryByChannel: jest.fn(),
  getDeliveryRate: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<DeliveryReportService>;

const app = express();
app.use(express.json());
app.use('/v1/delivery-reports', deliveryReportRouter(mockService));

describe('GET /v1/delivery-reports/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with delivery report', async () => {
    const report = { id: 'report-1', channel: DeliveryChannel.EMAIL, status: DeliveryStatus.DELIVERED };
    mockService.findById.mockResolvedValue(report);

    const res = await request(app).get('/v1/delivery-reports/report-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('report-1');
  });

  it('returns 404 when not found', async () => {
    mockService.findById.mockResolvedValue(null);

    const res = await request(app).get('/v1/delivery-reports/missing');

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/delivery-reports/notification/:notificationId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with reports for notification', async () => {
    const reports = [{ id: 'r1', notificationId: 'notif-1' }, { id: 'r2', notificationId: 'notif-1' }];
    mockService.findByNotificationId.mockResolvedValue(reports);

    const res = await request(app).get('/v1/delivery-reports/notification/notif-1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 200 with empty array when no reports', async () => {
    mockService.findByNotificationId.mockResolvedValue([]);

    const res = await request(app).get('/v1/delivery-reports/notification/notif-empty');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('POST /v1/delivery-reports', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on successful creation', async () => {
    const payload = {
      notificationId: 'notif-1',
      channel: DeliveryChannel.EMAIL,
      recipient: 'user@example.com',
      status: DeliveryStatus.DELIVERED,
    };
    const created = { id: 'report-1', ...payload };
    mockService.create.mockResolvedValue(created);

    const res = await request(app).post('/v1/delivery-reports').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('report-1');
  });

  it('returns 400 when notificationId is missing', async () => {
    const res = await request(app)
      .post('/v1/delivery-reports')
      .send({ channel: DeliveryChannel.EMAIL, recipient: 'user@example.com', status: DeliveryStatus.DELIVERED });

    expect(res.status).toBe(400);
  });

  it('returns 400 when channel is invalid', async () => {
    const res = await request(app)
      .post('/v1/delivery-reports')
      .send({ notificationId: 'notif-1', channel: 'FAX', recipient: 'user@example.com', status: DeliveryStatus.DELIVERED });

    expect(res.status).toBe(400);
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .post('/v1/delivery-reports')
      .send({ notificationId: 'notif-1', channel: DeliveryChannel.SMS, recipient: '+447911123456', status: 'TELEPORTED' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /v1/delivery-reports/:id/delivered', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when marked as delivered', async () => {
    const updated = { id: 'report-1', status: DeliveryStatus.DELIVERED };
    mockService.markDelivered.mockResolvedValue(updated);

    const res = await request(app).patch('/v1/delivery-reports/report-1/delivered');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(DeliveryStatus.DELIVERED);
  });

  it('returns 404 when report not found', async () => {
    mockService.markDelivered.mockRejectedValue({ statusCode: 404, message: 'Not found' });

    const res = await request(app).patch('/v1/delivery-reports/missing/delivered');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/delivery-reports/:id/failed', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when marked as failed with reason', async () => {
    const updated = { id: 'report-1', status: DeliveryStatus.FAILED, failureReason: 'Bounced' };
    mockService.markFailed.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/v1/delivery-reports/report-1/failed')
      .send({ reason: 'Bounced' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(DeliveryStatus.FAILED);
  });

  it('returns 400 when reason is missing', async () => {
    const res = await request(app)
      .patch('/v1/delivery-reports/report-1/failed')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /v1/delivery-reports/summary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with summary grouped by channel', async () => {
    const summary = [
      { channel: DeliveryChannel.EMAIL, delivered: 10, failed: 2, total: 12 },
      { channel: DeliveryChannel.SMS, delivered: 5, failed: 1, total: 6 },
    ];
    mockService.getSummaryByChannel.mockResolvedValue(summary);

    const res = await request(app).get('/v1/delivery-reports/summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /v1/delivery-reports/rate/:channel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with delivery rate for channel', async () => {
    mockService.getDeliveryRate.mockResolvedValue(85);

    const res = await request(app).get(`/v1/delivery-reports/rate/${DeliveryChannel.EMAIL}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rate).toBe(85);
  });

  it('returns 400 when channel is invalid', async () => {
    const res = await request(app).get('/v1/delivery-reports/rate/PIGEON');

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/delivery-reports/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 on successful delete', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const res = await request(app).delete('/v1/delivery-reports/report-1');

    expect(res.status).toBe(204);
  });

  it('returns 500 when service throws', async () => {
    mockService.delete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/v1/delivery-reports/report-1');

    expect(res.status).toBe(500);
  });
});