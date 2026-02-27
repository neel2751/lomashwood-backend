
import request from 'supertest';
import app from '../../src/app';

describe('Ingestion Routes', () => {
  describe('POST /api/v1/analytics/ingest/events', () => {
    it('should ingest a single event payload', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ingest/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          type: 'track',
          event: 'product_viewed',
          userId: 'user-ingest-001',
          sessionId: 'session-ingest-001',
          properties: { productId: 'prod-001', category: 'kitchen' },
          context: { userAgent: 'Mozilla/5.0', ip: '10.0.0.1' },
          timestamp: new Date().toISOString(),
          messageId: 'msg-ingest-001',
        })
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accepted).toBe(1);
    });

    it('should ingest a batch of mixed event types', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ingest/batch')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          batch: [
            { type: 'track', event: 'product_viewed', sessionId: 'session-ingest-002', properties: {}, timestamp: new Date().toISOString(), messageId: 'msg-001' },
            { type: 'page', name: 'Home', path: '/', sessionId: 'session-ingest-002', timestamp: new Date().toISOString(), messageId: 'msg-002' },
            { type: 'identify', userId: 'user-ingest-002', traits: { email: 'x@test.com' }, timestamp: new Date().toISOString(), messageId: 'msg-003' },
          ],
        })
        .expect(202);

      expect(res.body.data.accepted).toBe(3);
      expect(res.body.data.rejected).toBe(0);
    });

    it('should partially accept batch with some invalid payloads', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ingest/batch')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          batch: [
            { type: 'track', event: 'valid_event', sessionId: 'session-ingest-003', timestamp: new Date().toISOString(), messageId: 'msg-valid-001' },
            { type: 'UNKNOWN_TYPE', sessionId: 'session-ingest-003', timestamp: new Date().toISOString(), messageId: 'msg-invalid-001' },
          ],
        })
        .expect(202);

      expect(res.body.data.accepted).toBe(1);
      expect(res.body.data.rejected).toBe(1);
    });

    it('should return 400 for empty batch', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ingest/batch')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ batch: [] })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 413 for batch exceeding max size', async () => {
      const oversizedBatch = Array.from({ length: 1001 }, (_, i) => ({
        type: 'track',
        event: 'overflow_event',
        sessionId: `session-overflow-${i}`,
        timestamp: new Date().toISOString(),
        messageId: `msg-overflow-${i}`,
      }));

      const res = await request(app)
        .post('/api/v1/analytics/ingest/batch')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ batch: oversizedBatch })
        .expect(413);

      expect(res.body.error.code).toBe('BATCH_SIZE_EXCEEDED');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/v1/analytics/ingest/events')
        .send({ type: 'track', event: 'test', sessionId: 'x', timestamp: new Date().toISOString(), messageId: 'x' })
        .expect(401);
    });

    it('should be idempotent for duplicate messageId', async () => {
      const payload = {
        type: 'track',
        event: 'idempotency_test',
        sessionId: 'session-idemp-001',
        timestamp: new Date().toISOString(),
        messageId: 'idempotent-msg-001',
      };

      await request(app)
        .post('/api/v1/analytics/ingest/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      const res = await request(app)
        .post('/api/v1/analytics/ingest/events')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send(payload)
        .expect(202);

      expect(res.body.data.duplicate).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/ingest/status', () => {
    it('should return ingestion pipeline status', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/ingest/status')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('queueDepth');
      expect(res.body.data).toHaveProperty('processingRate');
      expect(res.body.data).toHaveProperty('errorRate');
    });
  });
});