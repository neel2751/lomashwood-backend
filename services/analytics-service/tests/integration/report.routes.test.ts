
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Report Routes', () => {
  let reportId: string;

  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/reports', () => {
    it('should create and queue a report and return 202', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/reports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'Monthly Conversion Report',
          type: 'CONVERSION',
          period: { from: '2026-01-01', to: '2026-01-31' },
          filters: { type: 'APPOINTMENT_BOOKED' },
          format: 'CSV',
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toMatch(/^(QUEUED|PROCESSING)$/);

      reportId = res.body.data.id;
    });

    it('should return 400 for missing period', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/reports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ name: 'Bad Report', type: 'CONVERSION', format: 'CSV' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for unsupported format', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/reports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'Bad Format Report',
          type: 'CONVERSION',
          period: { from: '2026-01-01', to: '2026-01-31' },
          format: 'DOCX',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/analytics/reports', () => {
    it('should return paginated reports', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/reports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should filter reports by status', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/reports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ status: 'QUEUED', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((r: { status: string }) => {
        expect(r.status).toBe('QUEUED');
      });
    });
  });

  describe('GET /api/v1/analytics/reports/:id', () => {
    it('should return report by id', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/reports/${reportId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(reportId);
    });

    it('should return 404 for non-existent report', async () => {
      await request(app)
        .get('/api/v1/analytics/reports/nonexistent-report-id')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/analytics/reports/:id', () => {
    it('should delete a report', async () => {
      await request(app)
        .delete(`/api/v1/analytics/reports/${reportId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);
    });
  });
});