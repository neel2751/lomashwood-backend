import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Campaign Run Flow', () => {
  const BASE = '/api/v1/notifications/campaigns';
  let campaignId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/campaigns', () => {
    it('should create a new notification campaign', async () => {
      const payload = {
        name: 'Summer Kitchen Sale 2026',
        channel: 'EMAIL',
        templateId: 'tpl-email-welcome',
        segment: { type: 'ALL_SUBSCRIBERS' },
        scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
        metadata: { promotionCode: 'SUMMER26' },
      };

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.status).toBe('SCHEDULED');

      campaignId = res.body.data.id;
    });

    it('should reject campaign without template', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          name: 'Invalid Campaign',
          channel: 'EMAIL',
          segment: { type: 'ALL_SUBSCRIBERS' },
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/notifications/campaigns', () => {
    it('should list all campaigns with pagination', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
    });

    it('should filter campaigns by status', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .query({ status: 'SCHEDULED', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((c: { status: string }) => {
        expect(c.status).toBe('SCHEDULED');
      });
    });
  });

  describe('GET /api/v1/notifications/campaigns/:id', () => {
    it('should return campaign details', async () => {
      const res = await request(app)
        .get(`${BASE}/${campaignId}`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(campaignId);
    });
  });

  describe('POST /api/v1/notifications/campaigns/:id/trigger', () => {
    it('should manually trigger a scheduled campaign', async () => {
      const res = await request(app)
        .post(`${BASE}/${campaignId}/trigger`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toMatch(/^(RUNNING|QUEUED)$/);
    });
  });

  describe('POST /api/v1/notifications/campaigns/:id/cancel', () => {
    it('should cancel a running campaign', async () => {
      const createRes = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          name: 'Campaign To Cancel',
          channel: 'SMS',
          templateId: 'tpl-sms-otp',
          segment: { type: 'ALL_SUBSCRIBERS' },
          scheduledAt: new Date(Date.now() + 7_200_000).toISOString(),
        });

      const cancelRes = await request(app)
        .post(`${BASE}/${createRes.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });
  });

  describe('GET /api/v1/notifications/campaigns/:id/stats', () => {
    it('should return campaign delivery statistics', async () => {
      const res = await request(app)
        .get(`${BASE}/${campaignId}/stats`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('sent');
      expect(res.body.data).toHaveProperty('delivered');
      expect(res.body.data).toHaveProperty('failed');
      expect(res.body.data).toHaveProperty('openRate');
    });
  });
});