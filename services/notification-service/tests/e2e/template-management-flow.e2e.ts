import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('[E2E] Template Management Flow', () => {
  const BASE = '/api/v1/notifications/templates';
  let templateId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/notifications/templates', () => {
    it('should create a new email template', async () => {
      const payload = {
        name: 'Order Dispatched Email',
        channel: 'EMAIL',
        subject: 'Your Lomash Wood order has been dispatched!',
        body: '<p>Hi {{name}}, your order #{{orderId}} is on its way.</p>',
        variables: ['name', 'orderId'],
        isActive: true,
      };

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.channel).toBe('EMAIL');

      templateId = res.body.data.id;
    });

    it('should create an SMS template', async () => {
      const payload = {
        name: 'Appointment Reminder SMS',
        channel: 'SMS',
        subject: null,
        body: 'Reminder: Your Lomash Wood appointment is tomorrow at {{time}}.',
        variables: ['time'],
        isActive: true,
      };

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send(payload)
        .expect(201);

      expect(res.body.data.channel).toBe('SMS');
    });

    it('should reject template with missing body', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          name: 'Bad Template',
          channel: 'EMAIL',
          subject: 'Test',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate template name per channel', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          name: 'Welcome Email',  // already exists from seed
          channel: 'EMAIL',
          subject: 'Welcome!',
          body: '<p>Welcome {{name}}</p>',
          variables: ['name'],
        })
        .expect(409);

      expect(res.body.error.code).toBe('TEMPLATE_NAME_CONFLICT');
    });
  });

  describe('GET /api/v1/notifications/templates', () => {
    it('should list all templates with pagination', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(4); // 4 from seed
    });

    it('should filter templates by channel', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .query({ channel: 'SMS' })
        .expect(200);

      res.body.data.items.forEach((t: { channel: string }) => {
        expect(t.channel).toBe('SMS');
      });
    });
  });

  describe('GET /api/v1/notifications/templates/:id', () => {
    it('should return a single template by ID', async () => {
      const res = await request(app)
        .get(`${BASE}/${templateId}`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(templateId);
    });

    it('should return 404 for non-existent template', async () => {
      await request(app)
        .get(`${BASE}/tpl-nonexistent-99999`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/notifications/templates/:id', () => {
    it('should update a template', async () => {
      const res = await request(app)
        .patch(`${BASE}/${templateId}`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({
          subject: 'Updated: Your Lomash Wood order has been dispatched!',
        })
        .expect(200);

      expect(res.body.data.subject).toContain('Updated:');
    });

    it('should deactivate a template', async () => {
      const res = await request(app)
        .patch(`${BASE}/${templateId}`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/templates/:id/preview', () => {
    it('should render a template preview with variables', async () => {
      const res = await request(app)
        .post(`${BASE}/tpl-email-welcome/preview`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .send({ variables: { name: 'Preview User' } })
        .expect(200);

      expect(res.body.data.rendered).toContain('Preview User');
    });
  });

  describe('DELETE /api/v1/notifications/templates/:id', () => {
    it('should soft-delete a template', async () => {
      await request(app)
        .delete(`${BASE}/${templateId}`)
        .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
        .expect(200);

      const tpl = await prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });
      expect(tpl?.deletedAt).not.toBeNull();
    });
  });
});