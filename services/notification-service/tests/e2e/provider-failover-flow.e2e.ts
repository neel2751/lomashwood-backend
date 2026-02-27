import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Provider Failover Flow', () => {
  const BASE = '/api/v1/notifications';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Email Provider Failover', () => {
    it('should failover from SES to Nodemailer when SES is unavailable', async () => {
      // Trigger a send with the primary provider disabled via test header
      const res = await request(app)
        .post(`${BASE}/email/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .set('x-e2e-disable-provider', 'SES')
        .send({
          to: 'failover-test@lomashwood-test.com',
          templateId: 'tpl-email-welcome',
          variables: { name: 'Failover Test' },
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.providerUsed).toBe('NODEMAILER');
    });

    it('should return 503 when all email providers are unavailable', async () => {
      const res = await request(app)
        .post(`${BASE}/email/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .set('x-e2e-disable-provider', 'ALL_EMAIL')
        .send({
          to: 'failover-all-fail@lomashwood-test.com',
          templateId: 'tpl-email-welcome',
          variables: { name: 'All Fail Test' },
        })
        .expect(503);

      expect(res.body.error.code).toBe('ALL_PROVIDERS_UNAVAILABLE');
    });
  });

  describe('SMS Provider Failover', () => {
    it('should failover from Twilio to MSG91 when Twilio fails', async () => {
      const res = await request(app)
        .post(`${BASE}/sms/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .set('x-e2e-disable-provider', 'TWILIO')
        .send({
          to: '+441234567892',
          templateId: 'tpl-sms-otp',
          variables: { otp: '654321' },
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.providerUsed).toBe('MSG91');
    });
  });

  describe('Push Provider Failover', () => {
    it('should use webpush when Firebase is unavailable', async () => {
      const res = await request(app)
        .post(`${BASE}/push/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .set('x-e2e-disable-provider', 'FIREBASE')
        .send({
          userId: 'e2e-user-001',
          templateId: 'tpl-push-promo',
          variables: { discount: '15' },
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.providerUsed).toBe('WEBPUSH');
    });
  });

  describe('Provider Health Status', () => {
    it('should return health status of all providers', async () => {
      const res = await request(app)
        .get(`${BASE}/providers/health`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('sms');
      expect(res.body.data).toHaveProperty('push');

      expect(res.body.data.email).toHaveProperty('providers');
      expect(Array.isArray(res.body.data.email.providers)).toBe(true);
    });

    it('should list available providers per channel', async () => {
      const res = await request(app)
        .get(`${BASE}/providers`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('EMAIL');
      expect(res.body.data).toHaveProperty('SMS');
      expect(res.body.data).toHaveProperty('PUSH');
    });
  });

  describe('Retry on Failure', () => {
    it('should retry failed notification sends up to max retries', async () => {
      const res = await request(app)
        .post(`${BASE}/email/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .set('x-e2e-force-retry-scenario', 'true')
        .send({
          to: 'retry-test@lomashwood-test.com',
          templateId: 'tpl-email-welcome',
          variables: { name: 'Retry Test' },
        })
        .expect(202);

      expect(res.body.data).toHaveProperty('retryCount');
      expect(res.body.data.retryCount).toBeGreaterThan(0);
    });
  });
});