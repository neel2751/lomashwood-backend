import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Webhook Delivery Flow', () => {
  const BASE = '/api/v1/notifications/webhooks';
  const WEBHOOK_SECRET = 'e2e-webhook-secret-abc123';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildWebhookSignature(payload: object, secret: string): string {
    const body = JSON.stringify(payload);
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  }

  describe('POST /api/v1/notifications/webhooks', () => {
    it('should register a new webhook endpoint', async () => {
      const payload = {
        url: 'https://lomashwood-partner.com/notify',
        events: ['notification.sent', 'notification.failed'],
        description: 'Partner notification webhook',
      };

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send(payload)
        .expect(201);

      expect(res.body.data.url).toBe(payload.url);
      expect(res.body.data).toHaveProperty('secret');
      expect(res.body.data.events).toEqual(expect.arrayContaining(payload.events));
    });

    it('should reject duplicate webhook URL', async () => {
      const payload = {
        url: 'http://localhost:9999/webhook-receiver',
        events: ['notification.sent'],
      };

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send(payload)
        .expect(409);

      expect(res.body.error.code).toBe('WEBHOOK_URL_CONFLICT');
    });
  });

  describe('GET /api/v1/notifications/webhooks', () => {
    it('should list all webhook endpoints', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/notifications/webhooks/receive (inbound verification)', () => {
    it('should accept a correctly signed inbound webhook', async () => {
      const eventPayload = {
        event: 'notification.sent',
        notificationId: 'notif-e2e-001',
        channel: 'EMAIL',
        recipient: 'customer@lomashwood-test.com',
        timestamp: new Date().toISOString(),
      };

      const signature = buildWebhookSignature(eventPayload, WEBHOOK_SECRET);

      const res = await request(app)
        .post(`${BASE}/receive`)
        .set('x-webhook-signature', signature)
        .send(eventPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject webhook with invalid signature', async () => {
      const eventPayload = {
        event: 'notification.sent',
        notificationId: 'notif-e2e-002',
        channel: 'EMAIL',
        timestamp: new Date().toISOString(),
      };

      const res = await request(app)
        .post(`${BASE}/receive`)
        .set('x-webhook-signature', 'sha256=invalidsignature')
        .send(eventPayload)
        .expect(401);

      expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });

    it('should reject webhook with missing signature header', async () => {
      await request(app)
        .post(`${BASE}/receive`)
        .send({ event: 'notification.sent' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/notifications/webhooks/:id', () => {
    it('should deactivate a webhook endpoint', async () => {
      const res = await request(app)
        .delete(`${BASE}/wh-e2e-001`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const wh = await prisma.webhookEndpoint.findUnique({
        where: { id: 'wh-e2e-001' },
      });
      expect(wh?.isActive).toBe(false);
    });
  });
});