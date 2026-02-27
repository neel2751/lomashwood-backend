
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL as string,
});

describe('[E2E] Funnel Analysis Flow', () => {
  const BASE = '/api/v1/analytics/funnels';
  let funnelId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a funnel, populate events, and retrieve analysis', async () => {
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        name: 'E2E Kitchen Purchase Funnel',
        steps: [
          { name: 'Kitchen Page Viewed', eventName: 'kitchen_page_viewed', order: 1 },
          { name: 'Product Clicked', eventName: 'product_clicked', order: 2 },
          { name: 'Quote Requested', eventName: 'quote_requested', order: 3 },
          { name: 'Appointment Booked', eventName: 'appointment_booked', order: 4 },
        ],
      })
      .expect(201);

    funnelId = createRes.body.data.id;

    const funnelEvents = [
      'kitchen_page_viewed',
      'kitchen_page_viewed',
      'product_clicked',
      'quote_requested',
      'appointment_booked',
    ];

    for (const eventName of funnelEvents) {
      await request(app)
        .post('/api/v1/analytics/events')
        .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
        .send({
          name: eventName,
          sessionId: 'funnel-e2e-session-001',
          userId: 'funnel-e2e-user-001',
          properties: {},
          timestamp: new Date().toISOString(),
        });
    }

    const analysisRes = await request(app)
      .get(`${BASE}/${funnelId}/analysis`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ period: '30d' })
      .expect(200);

    expect(analysisRes.body.data).toHaveProperty('steps');
    expect(analysisRes.body.data).toHaveProperty('overallConversionRate');
    expect(Array.isArray(analysisRes.body.data.steps)).toBe(true);
    expect(analysisRes.body.data.steps).toHaveLength(4);

    analysisRes.body.data.steps.forEach((s: { name: string; dropOffRate: number }) => {
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('dropOffRate');
    });
  });

  it('should update funnel name and confirm persistence', async () => {
    const res = await request(app)
      .patch(`${BASE}/${funnelId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({ name: 'Updated E2E Kitchen Funnel' })
      .expect(200);

    expect(res.body.data.name).toBe('Updated E2E Kitchen Funnel');

    const funnel = await prisma.analyticsFunnel.findUnique({ where: { id: funnelId } });
    expect(funnel?.name).toBe('Updated E2E Kitchen Funnel');
  });

  it('should return 400 for funnel with only one step', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        name: 'Invalid Single Step Funnel',
        steps: [{ name: 'Only Step', eventName: 'only_event', order: 1 }],
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should soft-delete a funnel', async () => {
    await request(app)
      .delete(`${BASE}/${funnelId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    const funnel = await prisma.analyticsFunnel.findUnique({ where: { id: funnelId } });
    expect(funnel?.deletedAt).not.toBeNull();
  });
});