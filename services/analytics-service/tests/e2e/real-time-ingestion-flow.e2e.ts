
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL as string,
});

describe('[E2E] Real-Time Ingestion Flow', () => {
  const BASE = '/api/v1/analytics/ingest';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should ingest a track event and persist it immediately', async () => {
    const messageId = `e2e-rt-msg-${Date.now()}`;

    const res = await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        type: 'track',
        event: 'kitchen_viewed',
        userId: 'e2e-rt-user-001',
        sessionId: 'e2e-rt-session-001',
        properties: { productId: 'kitchen-luna', color: 'white' },
        context: { userAgent: 'E2E/1.0', ip: '10.0.0.1' },
        timestamp: new Date().toISOString(),
        messageId,
      })
      .expect(202);

    expect(res.body.data.accepted).toBe(1);

    const event = await prisma.analyticsEvent.findFirst({
      where: { name: 'kitchen_viewed', userId: 'e2e-rt-user-001' },
    });
    expect(event).not.toBeNull();
  });

  it('should ingest an identify event and update user traits', async () => {
    const res = await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        type: 'identify',
        userId: 'e2e-rt-user-002',
        traits: { email: 'rt@lomashwood-test.com', name: 'RT User', postcode: 'E1 6AN' },
        timestamp: new Date().toISOString(),
        messageId: `e2e-identify-${Date.now()}`,
      })
      .expect(202);

    expect(res.body.data.accepted).toBe(1);
  });

  it('should ingest a page event', async () => {
    const res = await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        type: 'page',
        name: 'Kitchen Range Page',
        path: '/kitchens/range',
        userId: 'e2e-rt-user-001',
        sessionId: 'e2e-rt-session-001',
        properties: { title: 'Kitchen Range | Lomash Wood' },
        timestamp: new Date().toISOString(),
        messageId: `e2e-page-${Date.now()}`,
      })
      .expect(202);

    expect(res.body.data.accepted).toBe(1);
  });

  it('should reject duplicate messageId (idempotency)', async () => {
    const messageId = `idempotent-e2e-${Date.now()}`;
    const payload = {
      type: 'track',
      event: 'idempotency_check',
      sessionId: 'e2e-idemp-session',
      timestamp: new Date().toISOString(),
      messageId,
    };

    await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send(payload)
      .expect(202);

    const res = await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send(payload)
      .expect(202);

    expect(res.body.data.duplicate).toBe(true);
  });

  it('should ingest a batch of mixed event types', async () => {
    const res = await request(app)
      .post(`${BASE}/batch`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        batch: [
          { type: 'track', event: 'product_viewed', sessionId: 'e2e-batch-rt-001', properties: { productId: 'p1' }, timestamp: new Date().toISOString(), messageId: `b1-${Date.now()}` },
          { type: 'page', name: 'Home', path: '/', sessionId: 'e2e-batch-rt-001', timestamp: new Date().toISOString(), messageId: `b2-${Date.now()}` },
          { type: 'track', event: 'cta_clicked', sessionId: 'e2e-batch-rt-001', properties: { cta: 'brochure' }, timestamp: new Date().toISOString(), messageId: `b3-${Date.now()}` },
        ],
      })
      .expect(202);

    expect(res.body.data.accepted).toBe(3);
    expect(res.body.data.rejected).toBe(0);
  });

  it('should return ingestion pipeline status', async () => {
    const res = await request(app)
      .get(`${BASE}/status`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('queueDepth');
    expect(res.body.data).toHaveProperty('processingRate');
    expect(res.body.data).toHaveProperty('errorRate');
  });
});