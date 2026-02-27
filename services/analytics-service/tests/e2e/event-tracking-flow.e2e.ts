
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('[E2E] Event Tracking Flow', () => {
  const BASE = '/api/v1/analytics';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should track a product_viewed event end-to-end', async () => {
    const payload = {
      name: 'product_viewed',
      userId: 'e2e-user-001',
      sessionId: 'e2e-session-001',
      properties: { productId: 'prod-luna-001', category: 'kitchen', price: 4999.99 },
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send(payload)
      .expect(201);

    expect(res.body.data.name).toBe('product_viewed');

    const event = await prisma.analyticsEvent.findFirst({
      where: { name: 'product_viewed', userId: 'e2e-user-001' },
    });
    expect(event).not.toBeNull();
    expect(event?.properties).toMatchObject({ productId: 'prod-luna-001' });
  });

  it('should track multiple events in sequence and retrieve them', async () => {
    const events = [
      { name: 'page_viewed', sessionId: 'e2e-session-002', properties: { path: '/' }, timestamp: new Date().toISOString() },
      { name: 'product_viewed', sessionId: 'e2e-session-002', properties: { productId: 'prod-002' }, timestamp: new Date().toISOString() },
      { name: 'cta_clicked', sessionId: 'e2e-session-002', properties: { cta: 'book_consultation' }, timestamp: new Date().toISOString() },
      { name: 'booking_started', sessionId: 'e2e-session-002', properties: { type: 'HOME_MEASUREMENT' }, timestamp: new Date().toISOString() },
    ];

    for (const event of events) {
      await request(app)
        .post(`${BASE}/events`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(event)
        .expect(201);
    }

    const res = await request(app)
      .get(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ sessionId: 'e2e-session-002', page: 1, limit: 10 })
      .expect(200);

    expect(res.body.data.items.length).toBe(4);
  });

  it('should track a batch of events and confirm all are persisted', async () => {
    const batch = Array.from({ length: 10 }, (_, i) => ({
      name: 'batch_event',
      sessionId: `e2e-batch-session-${i}`,
      properties: { index: i },
      timestamp: new Date().toISOString(),
    }));

    const res = await request(app)
      .post(`${BASE}/events/batch`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ events: batch })
      .expect(202);

    expect(res.body.data.accepted).toBe(10);

    const count = await prisma.analyticsEvent.count({ where: { name: 'batch_event' } });
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it('should return 400 for event with missing name', async () => {
    const res = await request(app)
      .post(`${BASE}/events`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ sessionId: 'e2e-session-003', properties: {} })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 for unauthenticated event tracking', async () => {
    await request(app)
      .post(`${BASE}/events`)
      .send({ name: 'product_viewed', sessionId: 'e2e-session-004' })
      .expect(401);
  });
});