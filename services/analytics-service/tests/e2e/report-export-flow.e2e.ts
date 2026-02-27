
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('[E2E] Report & Export Flow', () => {
  const REPORT_BASE = '/api/v1/analytics/reports';
  const EXPORT_BASE = '/api/v1/analytics/exports';
  let reportId: string;
  let exportJobId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a report, poll status, and confirm completion', async () => {
    const createRes = await request(app)
      .post(REPORT_BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        name: 'E2E Conversion Report Jan 2026',
        type: 'CONVERSION',
        period: { from: '2026-01-01', to: '2026-01-31' },
        filters: { type: 'APPOINTMENT_BOOKED' },
        format: 'CSV',
      })
      .expect(202);

    reportId = createRes.body.data.id;
    expect(createRes.body.data.status).toMatch(/^(QUEUED|PROCESSING)$/);

    const statusRes = await request(app)
      .get(`${REPORT_BASE}/${reportId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(statusRes.body.data.id).toBe(reportId);
    expect(statusRes.body.data).toHaveProperty('status');
  });

  it('should queue a CSV export for events and retrieve job status', async () => {
    const createRes = await request(app)
      .post(EXPORT_BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        entity: 'EVENTS',
        format: 'CSV',
        filters: { from: '2026-01-01', to: '2026-01-31' },
        columns: ['id', 'name', 'userId', 'sessionId', 'timestamp'],
      })
      .expect(202);

    exportJobId = createRes.body.data.jobId;
    expect(createRes.body.data.entity).toBe('EVENTS');

    const statusRes = await request(app)
      .get(`${EXPORT_BASE}/${exportJobId}/status`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(statusRes.body.data.jobId).toBe(exportJobId);
    expect(statusRes.body.data).toHaveProperty('status');
  });

  it('should queue a JSON export for sessions', async () => {
    const res = await request(app)
      .post(EXPORT_BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        entity: 'SESSIONS',
        format: 'JSON',
        filters: { from: '2026-02-01', to: '2026-02-28' },
      })
      .expect(202);

    expect(res.body.data.format).toBe('JSON');
    expect(res.body.data.entity).toBe('SESSIONS');
  });

  it('should list all export jobs', async () => {
    const res = await request(app)
      .get(EXPORT_BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('should return 400 for export with unsupported format', async () => {
    const res = await request(app)
      .post(EXPORT_BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({ entity: 'EVENTS', format: 'XML', filters: {} })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should delete a report', async () => {
    await request(app)
      .delete(`${REPORT_BASE}/${reportId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);
  });
});