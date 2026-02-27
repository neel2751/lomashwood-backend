import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

// Prisma 5+ expects `datasourceUrl` instead of the older `datasources` property.
const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL as string,
});

describe('[E2E] Conversion Tracking Flow', () => {
  const BASE = '/api/v1/analytics/conversions';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should record an appointment booking conversion end-to-end', async () => {
    const payload = {
      sessionId: 'e2e-conv-session-001',
      userId: 'e2e-conv-user-001',
      type: 'APPOINTMENT_BOOKED',
      value: 0,
      currency: 'GBP',
      properties: { appointmentId: 'appt-e2e-001', appointmentType: 'HOME_MEASUREMENT' },
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send(payload)
      .expect(201);

    expect(res.body.data.type).toBe('APPOINTMENT_BOOKED');

    // Fix 2: Use the correct Prisma model name — check your schema.prisma for the exact model name.
    // Common alternatives: analyticsConversion, analytics_conversion, AnalyticsConversion
    // Replace 'analyticsConversion' below with whatever is defined in your schema.prisma
    const conv = await (prisma as any).analyticsConversion.findFirst({
      where: { userId: 'e2e-conv-user-001', type: 'APPOINTMENT_BOOKED' },
    });
    expect(conv).not.toBeNull();
  });

  it('should record an order conversion with monetary value', async () => {
    const payload = {
      sessionId: 'e2e-conv-session-002',
      userId: 'e2e-conv-user-002',
      type: 'ORDER_PLACED',
      value: 8750.00,
      currency: 'GBP',
      properties: { orderId: 'ord-e2e-001', items: 3 },
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send(payload)
      .expect(201);

    expect(res.body.data.value).toBe(8750.00);
  });

  it('should record a brochure request conversion', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .send({
        sessionId: 'e2e-conv-session-003',
        type: 'BROCHURE_REQUESTED',
        value: 0,
        properties: { postcode: 'SW1A 1AA' },
        timestamp: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.data.type).toBe('BROCHURE_REQUESTED');
  });

  it('should retrieve conversion rate for APPOINTMENT_BOOKED over 30d', async () => {
    const res = await request(app)
      .get(`${BASE}/rate`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ period: '30d', type: 'APPOINTMENT_BOOKED' })
      .expect(200);

    expect(res.body.data).toHaveProperty('rate');
    expect(res.body.data).toHaveProperty('converted');
    expect(res.body.data).toHaveProperty('total');
  });

  it('should list all conversions filtered by type', async () => {
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ type: 'APPOINTMENT_BOOKED', page: 1, limit: 10 })
      .expect(200);

    res.body.data.items.forEach((c: { type: string }) => {
      expect(c.type).toBe('APPOINTMENT_BOOKED');
    });
  });
});