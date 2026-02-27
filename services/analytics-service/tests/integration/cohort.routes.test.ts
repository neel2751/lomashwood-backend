import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const app = createApp();

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
});

describe('Cohort Routes', () => {
  let cohortId: string;

  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/cohorts', () => {
    it('should create a new cohort and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/cohorts')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'January 2026 Signups',
          description: 'Users who registered in January 2026',
          criteria: {
            event: 'user_registered',
            from: '2026-01-01T00:00:00.000Z',
            to: '2026-01-31T23:59:59.999Z',
          },
          granularity: 'WEEKLY',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('January 2026 Signups');

      cohortId = res.body.data.id;
    });

    it('should return 400 for missing cohort criteria', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/cohorts')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ name: 'Invalid Cohort' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid granularity value', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/cohorts')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          name: 'Invalid Granularity Cohort',
          criteria: { event: 'user_registered', from: '2026-01-01', to: '2026-01-31' },
          granularity: 'INVALID_VALUE',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/analytics/cohorts', () => {
    it('should return paginated cohorts', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/cohorts')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/cohorts/:id', () => {
    it('should return cohort by id', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/cohorts/${cohortId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.id).toBe(cohortId);
    });

    it('should return 404 for non-existent cohort', async () => {
      await request(app)
        .get('/api/v1/analytics/cohorts/nonexistent-id')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/analytics/cohorts/:id/retention', () => {
    it('should return retention table for cohort', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/cohorts/${cohortId}/retention`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('cohortSize');
      expect(res.body.data).toHaveProperty('retentionTable');
      expect(Array.isArray(res.body.data.retentionTable)).toBe(true);
    });
  });

  describe('DELETE /api/v1/analytics/cohorts/:id', () => {
    it('should delete a cohort', async () => {
      await request(app)
        .delete(`/api/v1/analytics/cohorts/${cohortId}`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);
    });
  });
});