
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient({
  
  datasourceUrl: process.env.TEST_DATABASE_URL as string,
});

describe('[E2E] Dashboard View Flow', () => {
  const BASE = '/api/v1/analytics/dashboards';
  let dashboardId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a dashboard and retrieve its resolved widget data', async () => {
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        name: 'E2E Sales Dashboard',
        description: 'End-to-end sales dashboard',
        widgets: [
          { type: 'METRIC', title: 'Active Sessions', metric: 'sessions', period: '24h' },
          { type: 'METRIC', title: 'Total Conversions', metric: 'conversions', period: '7d' },
          { type: 'TIMESERIES', title: 'Weekly Events', metric: 'events', period: '7d', granularity: 'daily' },
          { type: 'TABLE', title: 'Top Pages', metric: 'top_pages', period: '7d', limit: 5 },
        ],
        isDefault: false,
      })
      .expect(201);

    dashboardId = createRes.body.data.id;
    expect(createRes.body.data.widgets).toHaveLength(4);

    const dataRes = await request(app)
      .get(`${BASE}/${dashboardId}/data`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(Array.isArray(dataRes.body.data.widgets)).toBe(true);
    expect(dataRes.body.data.widgets).toHaveLength(4);

    dataRes.body.data.widgets.forEach((w: { title: string; data: unknown }) => {
      expect(w).toHaveProperty('title');
      expect(w).toHaveProperty('data');
    });
  });

  it('should retrieve the default dashboard', async () => {
    const res = await request(app)
      .get(`${BASE}/default`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(res.body.data.isDefault).toBe(true);
  });

  it('should update dashboard widgets', async () => {
    const res = await request(app)
      .patch(`${BASE}/${dashboardId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        widgets: [
          { type: 'METRIC', title: 'Active Sessions', metric: 'sessions', period: '24h' },
          { type: 'METRIC', title: 'Revenue Today', metric: 'revenue', period: '24h' },
        ],
      })
      .expect(200);

    expect(res.body.data.widgets).toHaveLength(2);
  });

  it('should return 404 for non-existent dashboard data', async () => {
    await request(app)
      .get(`${BASE}/nonexistent-dashboard-id/data`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(404);
  });

  it('should delete dashboard and confirm it no longer exists', async () => {
    await request(app)
      .delete(`${BASE}/${dashboardId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    const dash = await prisma.analyticsDashboard.findUnique({ where: { id: dashboardId } });
    expect(dash?.deletedAt).not.toBeNull();
  });
});