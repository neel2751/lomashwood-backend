
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Dashboard Routes', () => {
  let dashboardId: string;

  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/dashboards', () => {
    it('should create a dashboard and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/dashboards')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'Sales Overview',
          description: 'Top-level sales and booking metrics',
          widgets: [
            { type: 'METRIC', title: 'Total Sessions', metric: 'sessions', period: '7d' },
            { type: 'TIMESERIES', title: 'Daily Pageviews', metric: 'pageviews', period: '30d' },
            { type: 'TABLE', title: 'Top Pages', metric: 'top_pages', period: '7d' },
          ],
          isDefault: false,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sales Overview');
      expect(res.body.data.widgets).toHaveLength(3);

      dashboardId = res.body.data.id;
    });

    it('should return 400 for dashboard without name', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/dashboards')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ widgets: [] })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/analytics/dashboards', () => {
    it('should return all dashboards', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboards')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/dashboards/:id', () => {
    it('should return dashboard by id', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/dashboards/${dashboardId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(dashboardId);
    });

    it('should return 404 for non-existent dashboard', async () => {
      await request(app)
        .get('/api/v1/analytics/dashboards/does-not-exist')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/analytics/dashboards/:id/data', () => {
    it('should return resolved widget data for dashboard', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/dashboards/${dashboardId}/data`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(Array.isArray(res.body.data.widgets)).toBe(true);
      res.body.data.widgets.forEach((w: { title: string; data: unknown }) => {
        expect(w).toHaveProperty('title');
        expect(w).toHaveProperty('data');
      });
    });
  });

  describe('PATCH /api/v1/analytics/dashboards/:id', () => {
    it('should update a dashboard', async () => {
      const res = await request(app)
        .patch(`/api/v1/analytics/dashboards/${dashboardId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(res.body.data.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/v1/analytics/dashboards/:id', () => {
    it('should delete a dashboard', async () => {
      await request(app)
        .delete(`/api/v1/analytics/dashboards/${dashboardId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      const dash = await prisma.analyticsDashboard.findUnique({ where: { id: dashboardId } });
      expect(dash?.deletedAt).not.toBeNull();
    });
  });
});