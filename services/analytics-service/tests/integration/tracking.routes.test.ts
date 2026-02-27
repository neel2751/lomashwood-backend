
import request from 'supertest';
import app from '../../src/app';

describe('Tracking Routes', () => {
  describe('POST /api/v1/analytics/tracking/identify', () => {
    it('should identify a user and return 200', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/identify')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          userId: 'user-track-001',
          anonymousId: 'anon-track-001',
          traits: { email: 'track@lomashwood-test.com', name: 'Track User', plan: 'customer' },
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing userId and anonymousId', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/identify')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ traits: { email: 'test@test.com' } })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/analytics/tracking/track', () => {
    it('should track a custom event and return 200', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/track')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          userId: 'user-track-001',
          event: 'brochure_requested',
          properties: { postcode: 'SW1A 1AA' },
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing event name', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/track')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ userId: 'user-track-001', properties: {} })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/analytics/tracking/page', () => {
    it('should track a page view and return 200', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/page')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          userId: 'user-track-001',
          sessionId: 'session-track-001',
          name: 'Kitchen Detail Page',
          path: '/kitchens/luna',
          properties: { title: 'Luna Kitchen | Lomash Wood' },
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/analytics/tracking/alias', () => {
    it('should alias anonymous id to user id', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/alias')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          previousId: 'anon-track-001',
          userId: 'user-track-001',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing previousId', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/tracking/alias')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ userId: 'user-track-001' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});