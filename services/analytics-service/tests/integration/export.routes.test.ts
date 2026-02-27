
import request from 'supertest';
import app from '../../src/app';

describe('Export Routes', () => {
  let exportJobId: string;

  describe('POST /api/v1/analytics/exports', () => {
    it('should queue an export job and return 202', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/exports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          entity: 'EVENTS',
          format: 'CSV',
          filters: { from: '2026-01-01', to: '2026-01-31' },
          columns: ['id', 'name', 'userId', 'sessionId', 'timestamp'],
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('jobId');
      expect(res.body.data.status).toMatch(/^(QUEUED|PROCESSING)$/);

      exportJobId = res.body.data.jobId;
    });

    it('should queue an export for sessions', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/exports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({
          entity: 'SESSIONS',
          format: 'JSON',
          filters: { from: '2026-01-01', to: '2026-01-31' },
        })
        .expect(202);

      expect(res.body.data.entity).toBe('SESSIONS');
    });

    it('should return 400 for unsupported entity', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/exports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ entity: 'UNSUPPORTED_ENTITY', format: 'CSV', filters: {} })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for unsupported export format', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/exports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ entity: 'EVENTS', format: 'XML', filters: {} })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/v1/analytics/exports')
        .send({ entity: 'EVENTS', format: 'CSV', filters: {} })
        .expect(401);
    });
  });

  describe('GET /api/v1/analytics/exports/:jobId/status', () => {
    it('should return export job status', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/exports/${exportJobId}/status`)
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data.jobId).toBe(exportJobId);
      expect(res.body.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent export job', async () => {
      await request(app)
        .get('/api/v1/analytics/exports/nonexistent-job/status')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/analytics/exports', () => {
    it('should list all export jobs', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/exports')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });
});