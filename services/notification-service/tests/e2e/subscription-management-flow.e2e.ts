import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Subscription Management Flow', () => {
  const BASE = '/api/v1/notifications/subscriptions';
  let subscriptionId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/subscriptions', () => {
    it('should subscribe a user to a notification channel', async () => {
      const payload = {
        userId: 'e2e-user-sub-001',
        email: 'subscriber@lomashwood-test.com',
        channels: ['EMAIL', 'SMS'],
        topics: ['promotions', 'appointments', 'orders'],
      };

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(201);

      expect(res.body.data.userId).toBe(payload.userId);
      expect(res.body.data.channels).toEqual(expect.arrayContaining(['EMAIL', 'SMS']));

      subscriptionId = res.body.data.id;
    });

    it('should reject subscription without userId or email', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({ channels: ['EMAIL'] })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should subscribe to newsletter (public endpoint)', async () => {
      const res = await request(app)
        .post(`${BASE}/newsletter`)
        .send({
          email: 'newsletter@lomashwood-test.com',
          name: 'Newsletter Subscriber',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('newsletter@lomashwood-test.com');
    });
  });

  describe('GET /api/v1/notifications/subscriptions/:userId', () => {
    it('should return user subscriptions', async () => {
      const res = await request(app)
        .get(`${BASE}/e2e-user-sub-001`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(200);

      expect(res.body.data.userId).toBe('e2e-user-sub-001');
      expect(Array.isArray(res.body.data.channels)).toBe(true);
    });

    it('should return 404 for non-existent subscriber', async () => {
      await request(app)
        .get(`${BASE}/nonexistent-user-99999`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/notifications/subscriptions/:id', () => {
    it('should update subscription channels', async () => {
      const res = await request(app)
        .patch(`${BASE}/${subscriptionId}`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({ channels: ['EMAIL'] }) // remove SMS
        .expect(200);

      expect(res.body.data.channels).toEqual(['EMAIL']);
      expect(res.body.data.channels).not.toContain('SMS');
    });

    it('should update subscription topics', async () => {
      const res = await request(app)
        .patch(`${BASE}/${subscriptionId}`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({ topics: ['appointments'] })
        .expect(200);

      expect(res.body.data.topics).toEqual(['appointments']);
    });
  });

  describe('DELETE /api/v1/notifications/subscriptions/:id (unsubscribe)', () => {
    it('should unsubscribe a user', async () => {
      await request(app)
        .delete(`${BASE}/${subscriptionId}`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(200);

      const sub = await prisma.notificationSubscription.findUnique({
        where: { id: subscriptionId },
      });
      expect(sub?.isActive).toBe(false);
    });

    it('should honour unsubscribe from newsletter via token link', async () => {
      const tokenRes = await request(app)
        .post(`${BASE}/newsletter/unsubscribe-token`)
        .send({ email: 'newsletter@lomashwood-test.com' });

      const token = tokenRes.body.data?.token ?? 'mock-unsub-token';

      const res = await request(app)
        .get(`${BASE}/newsletter/unsubscribe`)
        .query({ token })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});