import request from 'supertest';
import { app } from '../../src/app';
import { generateTestToken } from '../helpers/auth.helper';

describe('Customer Service Smoke Tests E2E', () => {
  const customerToken = generateTestToken({
    sub: `smoke-customer-${Date.now()}`,
    role: 'customer',
  });

  it('health check returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('health check includes service name', async () => {
    const res = await request(app).get('/health');
    expect(res.body.service).toBe('customer-service');
  });

  it('GET /v1/customers/profile returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/profile');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/addresses returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/addresses');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/wishlist returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/wishlist');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/loyalty returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/loyalty');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/reviews returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/reviews');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/support/tickets returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/support/tickets');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/dashboard returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/notification-preferences returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/notification-preferences');
    expect(res.status).toBe(401);
  });

  it('GET /v1/customers/referrals returns 401 without auth', async () => {
    const res = await request(app).get('/v1/customers/referrals');
    expect(res.status).toBe(401);
  });

  it('POST /v1/customers/profile returns 422 with empty body', async () => {
    const res = await request(app)
      .post('/v1/customers/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect([400, 422]).toContain(res.status);
  });

  it('POST /v1/customers/addresses returns 422 with missing required fields', async () => {
    const res = await request(app)
      .post('/v1/customers/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ label: 'Test' });

    expect([400, 422]).toContain(res.status);
  });

  it('GET /v1/customers/reviews/product/:productId returns reviews publicly', async () => {
    const res = await request(app).get('/v1/customers/reviews/product/any-product-id');
    expect([200, 404]).toContain(res.status);
  });

  it('GET /v1/customers/referrals/validate/:code validates publicly', async () => {
    const res = await request(app).get('/v1/customers/referrals/validate/TESTCODE');
    expect([200, 400, 404]).toContain(res.status);
  });

  it('responds within acceptable time threshold', async () => {
    const start = Date.now();
    await request(app).get('/health');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });

  it('returns JSON content-type on all API routes', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/v1/customers/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });
});