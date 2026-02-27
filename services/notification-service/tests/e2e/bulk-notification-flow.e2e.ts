import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Bulk Notification Flow', () => {
  const BASE = '/api/v1/notifications';
  let bulkJobId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/bulk/email', () => {
    it('should queue a bulk email job successfully', async () => {
      const recipients = Array.from({ length: 50 }, (_, i) => ({
        to: `bulk-user-${i + 1}@lomashwood-test.com`,
        variables: { name: `Bulk User ${i + 1}` },
      }));

      const res = await request(app)
        .post(`${BASE}/bulk/email`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          templateId: 'tpl-email-welcome',
          recipients,
          metadata: { batchLabel: 'e2e-bulk-email-001' },
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobId).toBeDefined();
      expect(res.body.data.totalQueued).toBe(50);

      bulkJobId = res.body.data.jobId;
    });

    it('should reject bulk email with empty recipients array', async () => {
      const res = await request(app)
        .post(`${BASE}/bulk/email`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          templateId: 'tpl-email-welcome',
          recipients: [],
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject bulk email exceeding max recipients per request', async () => {
      const tooManyRecipients = Array.from({ length: 10_001 }, (_, i) => ({
        to: `overflow-${i}@lomashwood-test.com`,
        variables: { name: `User ${i}` },
      }));

      const res = await request(app)
        .post(`${BASE}/bulk/email`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          templateId: 'tpl-email-welcome',
          recipients: tooManyRecipients,
        })
        .expect(413);

      expect(res.body.error.code).toBe('RECIPIENT_LIMIT_EXCEEDED');
    });
  });

  describe('POST /api/v1/notifications/bulk/sms', () => {
    it('should queue a bulk SMS job', async () => {
      const recipients = [
        { to: '+441111000001', variables: { otp: '100001' } },
        { to: '+441111000002', variables: { otp: '100002' } },
        { to: '+441111000003', variables: { otp: '100003' } },
      ];

      const res = await request(app)
        .post(`${BASE}/bulk/sms`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          templateId: 'tpl-sms-otp',
          recipients,
        })
        .expect(202);

      expect(res.body.data.totalQueued).toBe(3);
    });
  });

  describe('GET /api/v1/notifications/bulk/jobs/:jobId', () => {
    it('should return bulk job status', async () => {
      const res = await request(app)
        .get(`${BASE}/bulk/jobs/${bulkJobId}`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.jobId).toBe(bulkJobId);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('totalQueued');
      expect(res.body.data).toHaveProperty('processed');
      expect(res.body.data).toHaveProperty('failed');
    });

    it('should return 404 for non-existent job', async () => {
      await request(app)
        .get(`${BASE}/bulk/jobs/nonexistent-job-id`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/notifications/bulk/jobs/:jobId/cancel', () => {
    it('should cancel a pending bulk job', async () => {
      // Create a new bulk job to cancel
      const createRes = await request(app)
        .post(`${BASE}/bulk/email`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          templateId: 'tpl-email-welcome',
          recipients: [{ to: 'cancel-target@lomashwood-test.com', variables: { name: 'Cancel Me' } }],
          scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
        });

      const newJobId = createRes.body.data.jobId;

      const cancelRes = await request(app)
        .post(`${BASE}/bulk/jobs/${newJobId}/cancel`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });
  });

  describe('Bulk Delivery Report', () => {
    it('should return delivery summary for a bulk job', async () => {
      const res = await request(app)
        .get(`${BASE}/bulk/jobs/${bulkJobId}/report`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('sent');
      expect(res.body.data).toHaveProperty('delivered');
      expect(res.body.data).toHaveProperty('bounced');
      expect(res.body.data).toHaveProperty('failed');
    });
  });
});