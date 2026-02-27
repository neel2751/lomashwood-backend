
/// <reference types="jest" />
import request from 'supertest';
import app from '../../src/app';

describe('[E2E] Admin Analytics Flow', () => {
  const BASE = '/api/v1/analytics';

  it('should allow admin to access summary metrics', async () => {
    const res = await request(app)
      .get(`${BASE}/metrics/summary`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ period: '7d' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalSessions');
    expect(res.body.data).toHaveProperty('uniqueUsers');
    expect(res.body.data).toHaveProperty('pageViews');
    expect(res.body.data).toHaveProperty('bounceRate');
    expect(res.body.data).toHaveProperty('conversions');
  });

  it('should allow admin to access realtime active users', async () => {
    const res = await request(app)
      .get(`${BASE}/metrics/realtime`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('activeUsers');
  });

  it('should allow admin to access revenue metrics', async () => {
    const res = await request(app)
      .get(`${BASE}/metrics/revenue`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ period: '30d' })
      .expect(200);

    expect(res.body.data).toHaveProperty('totalRevenue');
    expect(res.body.data).toHaveProperty('averageOrderValue');
    expect(res.body.data).toHaveProperty('currency');
  });

  it('should deny non-admin access to admin analytics routes', async () => {
    await request(app)
      .get(`${BASE}/metrics/summary`)
      .set('Authorization', `Bearer ${process.env.E2E_SERVICE_TOKEN}`)
      .query({ period: '7d' })
      .expect(403);
  });

  it('should deny unauthenticated access to all analytics routes', async () => {
    await request(app).get(`${BASE}/metrics/summary`).query({ period: '7d' }).expect(401);
    await request(app).get(`${BASE}/events`).expect(401);
    await request(app).get(`${BASE}/sessions`).expect(401);
    await request(app).get(`${BASE}/funnels`).expect(401);
    await request(app).get(`${BASE}/dashboards`).expect(401);
  });

  it('should allow admin to list all funnels', async () => {
    const res = await request(app)
      .get(`${BASE}/funnels`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('should allow admin to list all cohorts', async () => {
    const res = await request(app)
      .get(`${BASE}/cohorts`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('should allow admin to list all dashboards', async () => {
    const res = await request(app)
      .get(`${BASE}/dashboards`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('should allow admin to list export jobs', async () => {
    const res = await request(app)
      .get(`${BASE}/exports`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('should allow admin to view ingestion pipeline status', async () => {
    const res = await request(app)
      .get(`${BASE}/ingest/status`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('queueDepth');
    expect(res.body.data).toHaveProperty('processingRate');
    expect(res.body.data).toHaveProperty('errorRate');
  });
});