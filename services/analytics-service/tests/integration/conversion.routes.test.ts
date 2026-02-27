
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

describe('Conversion Routes', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  describe('POST /api/v1/analytics/conversions', () => {
    it('should record a conversion and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/conversions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          sessionId: 'session-conv-001',
          userId: 'user-001',
          type: 'APPOINTMENT_BOOKED',
          value: 0,
          properties: { appointmentId: 'appt-001', type: 'HOME_MEASUREMENT' },
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('APPOINTMENT_BOOKED');
    });

    it('should record a purchase conversion with value', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/conversions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({
          sessionId: 'session-conv-002',
          userId: 'user-002',
          type: 'ORDER_PLACED',
          value: 5499.99,
          currency: 'GBP',
          properties: { orderId: 'ord-001' },
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.data.value).toBe(5499.99);
      expect(res.body.data.currency).toBe('GBP');
    });

    it('should return 400 for missing conversion type', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/conversions')
        .set('Authorization', `Bearer ${process.env.TEST_SERVICE_TOKEN}`)
        .send({ sessionId: 'session-conv-001', userId: 'user-001' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/analytics/conversions', () => {
    it('should return paginated conversions', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/conversions')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should filter conversions by type', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/conversions')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ type: 'APPOINTMENT_BOOKED', page: 1, limit: 10 })
        .expect(200);

      res.body.data.items.forEach((c: { type: string }) => {
        expect(c.type).toBe('APPOINTMENT_BOOKED');
      });
    });

    it('should filter conversions by date range', async () => {
      const from = new Date(Date.now() - 86_400_000).toISOString();
      const to = new Date().toISOString();

      const res = await request(app)
        .get('/api/v1/analytics/conversions')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ from, to, page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/conversions/rate', () => {
    it('should return conversion rate for a given period', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/conversions/rate')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .query({ period: '30d', type: 'APPOINTMENT_BOOKED' })
        .expect(200);

      expect(res.body.data).toHaveProperty('rate');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('converted');
    });
  });
});