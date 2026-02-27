import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] SMS Send Flow', () => {
  const BASE = '/api/v1/notifications/sms';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/sms/send', () => {
    it('should send an SMS notification successfully', async () => {
      const payload = {
        to: '+441234567890',
        templateId: 'tpl-sms-otp',
        variables: { otp: '847392' },
        metadata: { userId: 'e2e-user-001' },
      };

      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.channel).toBe('SMS');
      expect(res.body.data.recipient).toBe(payload.to);

      const log = await prisma.notificationLog.findFirst({
        where: { recipient: payload.to, channel: 'SMS' },
      });
      expect(log).not.toBeNull();
    });

    it('should reject invalid phone number format', async () => {
      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          to: 'not-a-phone-number',
          templateId: 'tpl-sms-otp',
          variables: { otp: '123456' },
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when SMS template does not exist', async () => {
      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          to: '+441234567890',
          templateId: 'tpl-nonexistent-sms',
          variables: {},
        })
        .expect(404);

      expect(res.body.error.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should send a raw SMS message without template', async () => {
      const payload = {
        to: '+441234567891',
        message: 'Your Lomash Wood kitchen order has been dispatched.',
        metadata: { orderId: 'ord-e2e-001' },
      };

      const res = await request(app)
        .post(`${BASE}/send/raw`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.channel).toBe('SMS');
    });

    it('should handle bulk SMS send', async () => {
      const payload = {
        recipients: [
          { to: '+441111111111', variables: { otp: '111111' } },
          { to: '+442222222222', variables: { otp: '222222' } },
        ],
        templateId: 'tpl-sms-otp',
      };

      const res = await request(app)
        .post(`${BASE}/send/bulk`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.data.queued).toBe(2);
    });
  });

  describe('GET /api/v1/notifications/sms/logs', () => {
    it('should return paginated SMS logs', async () => {
      const res = await request(app)
        .get(`${BASE}/logs`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });
});