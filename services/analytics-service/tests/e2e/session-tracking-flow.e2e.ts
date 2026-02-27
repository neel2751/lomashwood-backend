
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL as string,
});

describe('[E2E] Session Tracking Flow', () => {
  const BASE = '/api/v1/analytics/sessions';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a session, track events, then end the session', async () => {
    const sessionId = 'e2e-full-session-001';

    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        sessionId,
        userId: 'e2e-user-session-001',
        userAgent: 'Mozilla/5.0 (E2E Test)',
        ipAddress: '10.0.0.1',
        referrer: 'https://google.com',
        landingPage: '/kitchens',
        startedAt: new Date().toISOString(),
      })
      .expect(201);

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          name: 'page_viewed',
          sessionId,
          userId: 'e2e-user-session-001',
          properties: { path: `/kitchens/page-${i}` },
          timestamp: new Date().toISOString(),
        });
    }

    const endRes = await request(app)
      .patch(`${BASE}/${sessionId}/end`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ endedAt: new Date().toISOString(), pageViews: 3, duration: 180 })
      .expect(200);

    expect(endRes.body.data.endedAt).not.toBeNull();
    expect(endRes.body.data.pageViews).toBe(3);

    const session = await prisma.analyticsSession.findFirst({ where: { sessionId } });
    expect(session?.endedAt).not.toBeNull();
  });

  it('should create an anonymous session and identify it later', async () => {
    const sessionId = 'e2e-anon-session-001';

    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ sessionId, landingPage: '/bedrooms', startedAt: new Date().toISOString() })
      .expect(201);

    const identifyRes = await request(app)
      .patch(`${BASE}/${sessionId}/identify`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ userId: 'e2e-user-identified-001' })
      .expect(200);

    expect(identifyRes.body.data.userId).toBe('e2e-user-identified-001');
  });

  it('should retrieve session details with associated events', async () => {
    const res = await request(app)
      .get(`${BASE}/e2e-full-session-001`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(res.body.data.sessionId).toBe('e2e-full-session-001');
    expect(res.body.data).toHaveProperty('events');
  });

  it('should return 409 for duplicate sessionId', async () => {
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({ sessionId: 'e2e-full-session-001', startedAt: new Date().toISOString() })
      .expect(409);
  });
});