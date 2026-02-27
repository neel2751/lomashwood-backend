
import request from 'supertest';
import app from '../../src/app';

describe('Metric Routes', () => {
  describe('GET /api/v1/analytics/metrics/summary', () => {
    it('should return summary metrics for a period', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics/summary')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ period: '7d' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSessions');
      expect(res.body.data).toHaveProperty('uniqueUsers');
      expect(res.body.data).toHaveProperty('pageViews');
      expect(res.body.data).toHaveProperty('bounceRate');
      expect(res.body.data).toHaveProperty('avgSessionDuration');
      expect(res.body.data).toHaveProperty('conversions');
    });

    it('should return 400 for invalid period', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics/summary')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ period: 'bad-period' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/v1/analytics/metrics/summary')
        .query({ period: '7d' })
        .expect(401);
    });
  });

  describe('GET /api/v1/analytics/metrics/timeseries', () => {
    it('should return time-series metric data', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics/timeseries')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ metric: 'sessions', period: '30d', granularity: 'daily' })
        .expect(200);

      expect(Array.isArray(res.body.data.series)).toBe(true);
      res.body.data.series.forEach((point: { date: string; value: number }) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('value');
      });
    });

    it('should return 400 for unsupported metric name', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics/timeseries')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ metric: 'unsupported_metric', period: '7d' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/analytics/metrics/realtime', () => {
    it('should return realtime active users count', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics/realtime')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('activeUsers');
      expect(typeof res.body.data.activeUsers).toBe('number');
    });
  });

  describe('GET /api/v1/analytics/metrics/revenue', () => {
    it('should return revenue metrics for a period', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics/revenue')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ period: '30d' })
        .expect(200);

      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('averageOrderValue');
      expect(res.body.data).toHaveProperty('currency');
    });
  });
});