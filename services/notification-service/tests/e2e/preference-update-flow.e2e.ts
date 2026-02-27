import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Notification Preference Update Flow', () => {
  const BASE = '/api/v1/notifications/preferences';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/notifications/preferences/:userId', () => {
    it('should return preferences for an existing user', async () => {
      const res = await request(app)
        .get(`${BASE}/e2e-user-001`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(200);

      expect(res.body.data.userId).toBe('e2e-user-001');
      expect(res.body.data).toHaveProperty('emailEnabled');
      expect(res.body.data).toHaveProperty('smsEnabled');
      expect(res.body.data).toHaveProperty('pushEnabled');
      expect(res.body.data).toHaveProperty('marketingEnabled');
    });

    it('should return 404 for user with no preferences record', async () => {
      await request(app)
        .get(`${BASE}/user-no-prefs-99999`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/notifications/preferences/:userId', () => {
    it('should update user notification preferences', async () => {
      const update = {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        marketingEnabled: false,
      };

      const res = await request(app)
        .put(`${BASE}/e2e-user-001`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(update)
        .expect(200);

      expect(res.body.data.smsEnabled).toBe(false);
      expect(res.body.data.marketingEnabled).toBe(false);
      expect(res.body.data.emailEnabled).toBe(true);
    });

    it('should create preferences if they do not exist (upsert)', async () => {
      const res = await request(app)
        .put(`${BASE}/new-user-upsert-001`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: false,
          marketingEnabled: false,
        })
        .expect(200);

      expect(res.body.data.userId).toBe('new-user-upsert-001');

      const pref = await prisma.notificationPreference.findFirst({
        where: { userId: 'new-user-upsert-001' },
      });
      expect(pref).not.toBeNull();
    });

    it('should reject preference update with invalid boolean value', async () => {
      const res = await request(app)
        .put(`${BASE}/e2e-user-001`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({ emailEnabled: 'yes' }) // should be boolean
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject preference update without authentication', async () => {
      await request(app)
        .put(`${BASE}/e2e-user-001`)
        .send({ emailEnabled: false })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/notifications/preferences/:userId/opt-out', () => {
    it('should opt out user from all notifications', async () => {
      const res = await request(app)
        .patch(`${BASE}/e2e-user-001/opt-out`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(200);

      expect(res.body.data.emailEnabled).toBe(false);
      expect(res.body.data.smsEnabled).toBe(false);
      expect(res.body.data.pushEnabled).toBe(false);
      expect(res.body.data.marketingEnabled).toBe(false);
    });

    it('should opt user back in to all notifications', async () => {
      const res = await request(app)
        .patch(`${BASE}/e2e-user-001/opt-in`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(200);

      expect(res.body.data.emailEnabled).toBe(true);
      expect(res.body.data.smsEnabled).toBe(true);
      expect(res.body.data.pushEnabled).toBe(true);
    });
  });
});