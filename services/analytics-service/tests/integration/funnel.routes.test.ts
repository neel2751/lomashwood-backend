
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Funnel Routes', () => {
  let funnelId: string;

  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/funnels', () => {
    it('should create a new funnel and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/funnels')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'Appointment Booking Funnel',
          description: 'Tracks users from product view to appointment booked',
          steps: [
            { name: 'Product Viewed', eventName: 'product_viewed', order: 1 },
            { name: 'CTA Clicked', eventName: 'cta_clicked', order: 2 },
            { name: 'Booking Started', eventName: 'booking_started', order: 3 },
            { name: 'Appointment Booked', eventName: 'appointment_booked', order: 4 },
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Appointment Booking Funnel');
      expect(res.body.data.steps).toHaveLength(4);

      funnelId = res.body.data.id;
    });

    it('should return 400 for funnel with fewer than 2 steps', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/funnels')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'Invalid Funnel',
          steps: [{ name: 'Step One', eventName: 'some_event', order: 1 }],
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing funnel name', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/funnels')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          steps: [
            { name: 'Step One', eventName: 'event_one', order: 1 },
            { name: 'Step Two', eventName: 'event_two', order: 2 },
          ],
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/analytics/funnels', () => {
    it('should return paginated funnels', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/funnels')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/funnels/:id', () => {
    it('should return funnel by id', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/funnels/${funnelId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(funnelId);
    });

    it('should return 404 for non-existent funnel', async () => {
      await request(app)
        .get('/api/v1/analytics/funnels/nonexistent-funnel-id')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/analytics/funnels/:id/analysis', () => {
    it('should return funnel analysis with drop-off rates', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/funnels/${funnelId}/analysis`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ period: '30d' })
        .expect(200);

      expect(res.body.data).toHaveProperty('steps');
      expect(res.body.data).toHaveProperty('overallConversionRate');
      expect(Array.isArray(res.body.data.steps)).toBe(true);

      res.body.data.steps.forEach((s: { name: string; users: number; dropOffRate: number }) => {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('users');
        expect(s).toHaveProperty('dropOffRate');
      });
    });
  });

  describe('PATCH /api/v1/analytics/funnels/:id', () => {
    it('should update a funnel', async () => {
      const res = await request(app)
        .patch(`/api/v1/analytics/funnels/${funnelId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ description: 'Updated funnel description' })
        .expect(200);

      expect(res.body.data.description).toBe('Updated funnel description');
    });
  });

  describe('DELETE /api/v1/analytics/funnels/:id', () => {
    it('should soft-delete a funnel', async () => {
      await request(app)
        .delete(`/api/v1/analytics/funnels/${funnelId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      const funnel = await prisma.analyticsFunnel.findUnique({ where: { id: funnelId } });
      expect(funnel?.deletedAt).not.toBeNull();
    });
  });
});