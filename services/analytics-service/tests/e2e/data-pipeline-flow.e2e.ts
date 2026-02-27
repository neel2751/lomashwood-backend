
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL as string,
});

describe('[E2E] Data Pipeline Flow', () => {
  const BASE = '/api/v1/analytics';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should ingest events, process them, and surface in metrics', async () => {
    const sessionId = 'e2e-pipeline-session-001';
    const userId = 'e2e-pipeline-user-001';

    await request(app)
      .post(`${BASE}/sessions`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ sessionId, userId, landingPage: '/kitchens', startedAt: new Date().toISOString() });

    const pipelineEvents = [
      { name: 'page_viewed', properties: { path: '/kitchens' } },
      { name: 'product_viewed', properties: { productId: 'prod-luna-001' } },
      { name: 'cta_clicked', properties: { cta: 'book_consultation' } },
      { name: 'appointment_booked', properties: { type: 'HOME_MEASUREMENT' } },
    ];

    for (const ev of pipelineEvents) {
      await request(app)
        .post(`${BASE}/events`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({ ...ev, sessionId, userId, timestamp: new Date().toISOString() });
    }

    await request(app)
      .post(`${BASE}/conversions`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        sessionId,
        userId,
        type: 'APPOINTMENT_BOOKED',
        value: 0,
        properties: { appointmentType: 'HOME_MEASUREMENT' },
        timestamp: new Date().toISOString(),
      });

    await request(app)
      .patch(`${BASE}/sessions/${sessionId}/end`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ endedAt: new Date().toISOString(), pageViews: 2, duration: 240 });

    const eventCount = await prisma.analyticsEvent.count({ where: { sessionId } });
    expect(eventCount).toBe(4);

    const convCount = await prisma.analyticsConversion.count({ where: { sessionId } });
    expect(convCount).toBe(1);

    const session = await prisma.analyticsSession.findFirst({ where: { sessionId } });
    expect(session?.endedAt).not.toBeNull();
  });

  it('should surface pipeline data in summary metrics', async () => {
    const res = await request(app)
      .get(`${BASE}/metrics/summary`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ period: '1d' })
      .expect(200);

    expect(res.body.data).toHaveProperty('totalSessions');
    expect(res.body.data).toHaveProperty('pageViews');
    expect(res.body.data).toHaveProperty('conversions');
    expect(res.body.data.totalSessions).toBeGreaterThan(0);
  });

  it('should surface pipeline data in timeseries', async () => {
    const res = await request(app)
      .get(`${BASE}/metrics/timeseries`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ metric: 'events', period: '1d', granularity: 'hourly' })
      .expect(200);

    expect(Array.isArray(res.body.data.series)).toBe(true);
  });

  it('should reflect pipeline data in top pages', async () => {
    const res = await request(app)
      .get(`${BASE}/pageviews/top`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ period: '1d', limit: 5 })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});