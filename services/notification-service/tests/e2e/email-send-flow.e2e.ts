import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL },
  },
});

describe('[E2E] Email Send Flow', () => {
  const BASE = '/api/v1/notifications/email';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/email/send', () => {
    it('should send a transactional email successfully', async () => {
      const payload = {
        to: 'customer@lomashwood-test.com',
        templateId: 'tpl-email-welcome',
        variables: { name: 'Alice' },
        metadata: { userId: 'e2e-user-001', source: 'e2e-test' },
      };

      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        channel: 'EMAIL',
        status: expect.stringMatching(/^(QUEUED|SENT)$/),
        recipient: payload.to,
      });

      const log = await prisma.notificationLog.findFirst({
        where: { recipient: payload.to, channel: 'EMAIL' },
      });
      expect(log).not.toBeNull();
      expect(log?.templateId).toBe('tpl-email-welcome');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({ to: 'customer@example.com' }) // missing templateId
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent template', async () => {
      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          to: 'customer@example.com',
          templateId: 'tpl-does-not-exist',
          variables: {},
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post(`${BASE}/send`)
        .send({
          to: 'customer@example.com',
          templateId: 'tpl-email-welcome',
          variables: { name: 'Bob' },
        })
        .expect(401);
    });

    it('should send booking confirmation email with correct variables', async () => {
      const payload = {
        to: 'booking-customer@lomashwood-test.com',
        templateId: 'tpl-email-booking',
        variables: {
          name: 'John Smith',
          date: '2026-03-15 at 10:00 AM',
        },
        metadata: { appointmentId: 'appt-001' },
      };

      const res = await request(app)
        .post(`${BASE}/send`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.data.channel).toBe('EMAIL');
      expect(res.body.data.recipient).toBe(payload.to);
    });

    it('should handle bulk email send', async () => {
      const payload = {
        recipients: [
          { to: 'user1@lomashwood-test.com', variables: { name: 'User 1' } },
          { to: 'user2@lomashwood-test.com', variables: { name: 'User 2' } },
          { to: 'user3@lomashwood-test.com', variables: { name: 'User 3' } },
        ],
        templateId: 'tpl-email-welcome',
        metadata: { batchId: 'batch-e2e-001' },
      };

      const res = await request(app)
        .post(`${BASE}/send/bulk`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.queued).toBe(3);
    });
  });

  describe('GET /api/v1/notifications/email/logs', () => {
    it('should return paginated email send logs', async () => {
      const res = await request(app)
        .get(`${BASE}/logs`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
    });

    it('should filter logs by status', async () => {
      const res = await request(app)
        .get(`${BASE}/logs`)
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .query({ status: 'SENT', page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.items.forEach((item: { status: string }) => {
        expect(item.status).toBe('SENT');
      });
    });
  });
});