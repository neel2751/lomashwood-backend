import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Push Notification Send Flow', () => {
  const BASE = '/api/v1/notifications/push';

  let deviceToken: string;

  beforeAll(async () => {
    // Register a test device token
    const res = await request(app)
      .post(`${BASE}/tokens`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        userId: 'e2e-user-001',
        token: 'fcm-test-device-token-e2e-abc123xyz',
        platform: 'ANDROID',
      });
    deviceToken = res.body.data?.token ?? 'fcm-test-device-token-e2e-abc123xyz';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/push/send', () => {
    it('should send a push notification by userId', async () => {
      const payload = {
        userId: 'e2e-user-001',
        templateId: 'tpl-push-promo',
        variables: { discount: '25' },
        metadata: { campaignId: 'camp-e2e-001' },
      };

      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.channel).toBe('PUSH');
    });

    it('should send a push notification by device token', async () => {
      const payload = {
        token: deviceToken,
        templateId: 'tpl-push-promo',
        variables: { discount: '30' },
      };

      const res = await request(app)
        .post(`${BASE}/send/token`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.channel).toBe('PUSH');
    });

    it('should return 422 when user has no registered device tokens', async () => {
      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          userId: 'user-with-no-tokens-9999',
          templateId: 'tpl-push-promo',
          variables: { discount: '10' },
        })
        .expect(422);

      expect(res.body.error.code).toBe('NO_DEVICE_TOKENS');
    });

    it('should handle broadcast push to all subscribers', async () => {
      const res = await request(app)
        .post(`${BASE}/broadcast`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          templateId: 'tpl-push-promo',
          variables: { discount: '20' },
          segment: 'all',
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('queued');
    });

    it('should reject push without authentication', async () => {
      await request(app)
        .post(`${BASE}/send`)
        .send({
          userId: 'e2e-user-001',
          templateId: 'tpl-push-promo',
          variables: { discount: '15' },
        })
        .expect(401);
    });
  });

  describe('Device Token Management', () => {
    it('should register a new device token', async () => {
      const res = await request(app)
        .post(`${BASE}/tokens`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          userId: 'e2e-user-002',
          token: 'apns-test-token-ios-e2e-xyz987',
          platform: 'IOS',
        })
        .expect(201);

      expect(res.body.data.platform).toBe('IOS');
    });

    it('should deregister a device token', async () => {
      await request(app)
        .delete(`${BASE}/tokens/fcm-test-device-token-e2e-abc123xyz`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .expect(200);
    });
  });
});