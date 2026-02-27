import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';

/**
 * E2E: Smoke Tests
 *
 * Quick sanity checks confirming:
 *   - The service process is alive (liveness probe)
 *   - Database connection is healthy (readiness probe)
 *   - All major route groups respond (not 404/500)
 *   - Auth guard is active on protected routes
 *   - Admin-only routes reject regular users
 *   - Stripe webhook endpoint is reachable
 */

describe('E2E — Smoke Tests', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;
  });

  // ── Service health ─────────────────────────────────────────────────────────

  describe('Service Health', () => {
    it('GET /health — should return 200 with status UP', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('order-payment-service');
    });

    it('GET /health/live — should return 200 (liveness)', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
    });

    it('GET /health/ready — should return 200 when DB is connected (readiness)', async () => {
      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.ready).toBe(true);
    });

    it('GET /health/db — should confirm database connectivity with latency', async () => {
      const res = await request(app).get('/health/db');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(typeof res.body.latencyMs).toBe('number');
    });

    it('GET /health/cache — should confirm Redis connectivity', async () => {
      const res = await request(app).get('/health/cache');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  // ── Auth guard smoke ───────────────────────────────────────────────────────

  describe('Auth Guard', () => {
    const protectedRoutes = [
      { method: 'get', path: '/v1/orders' },
      { method: 'get', path: '/v1/payments' },
      { method: 'get', path: '/v1/refunds' },
      { method: 'get', path: '/v1/invoices' },
      { method: 'get', path: '/v1/coupons' },
      { method: 'get', path: '/v1/tax-rules' },
      { method: 'get', path: '/v1/shipping' },
    ];

    protectedRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} — should return 401 without auth token`, async () => {
        const res = await (request(app) as any)[method](path);

        expect(res.status).toBe(401);
      });
    });
  });

  // ── Admin-only route guard smoke ───────────────────────────────────────────

  describe('Admin Guard', () => {
    const adminRoutes = [
      { method: 'get', path: '/v1/payments' },
      { method: 'get', path: '/v1/refunds' },
      { method: 'get', path: '/v1/invoices' },
      { method: 'get', path: '/v1/coupons' },
      { method: 'get', path: '/v1/tax-rules' },
      { method: 'get', path: '/v1/shipping' },
    ];

    adminRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} — should return 403 for non-admin users`, async () => {
        const res = await (request(app) as any)
          [method](path)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
      });
    });
  });

  // ── Route existence (non-404) ──────────────────────────────────────────────

  describe('Route Existence', () => {
    const adminAccessibleRoutes = [
      { method: 'get', path: '/v1/orders' },
      { method: 'get', path: '/v1/payments' },
      { method: 'get', path: '/v1/refunds' },
      { method: 'get', path: '/v1/invoices' },
      { method: 'get', path: '/v1/coupons' },
      { method: 'get', path: '/v1/tax-rules' },
      { method: 'get', path: '/v1/shipping' },
      { method: 'get', path: '/v1/shipping/rates' },
    ];

    adminAccessibleRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} — should respond (not 404) for admin`, async () => {
        const res = await (request(app) as any)
          [method](path)
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, limit: 5, country: 'GB' });

        expect(res.status).not.toBe(404);
        expect(res.status).not.toBe(500);
      });
    });
  });

  // ── Webhook endpoint smoke ─────────────────────────────────────────────────

  describe('Webhook Endpoint', () => {
    it('POST /v1/webhooks/stripe — should be reachable and reject missing signature with 400', async () => {
      const res = await request(app)
        .post('/v1/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send('{}');

      expect(res.status).toBe(400);
      expect(res.status).not.toBe(404);
    });
  });

  // ── Validation smoke ───────────────────────────────────────────────────────

  describe('Input Validation', () => {
    it('POST /v1/orders — empty body should return 400', async () => {
      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /v1/payments/create-intent — missing orderId should return 400', async () => {
      const res = await request(app)
        .post('/v1/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /v1/coupons/validate — missing code should return 400', async () => {
      const res = await request(app)
        .post('/v1/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderAmount: 100000 });

      expect(res.status).toBe(400);
    });

    it('POST /v1/checkout/summary — missing items should return 400', async () => {
      const res = await request(app)
        .post('/v1/checkout/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ shippingRateId: 'some-rate', country: 'GB' });

      expect(res.status).toBe(400);
    });
  });

  // ── 404 for unknown routes ─────────────────────────────────────────────────

  describe('Unknown Routes', () => {
    it('GET /v1/does-not-exist — should return 404', async () => {
      const res = await request(app)
        .get('/v1/does-not-exist')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('GET /completely-unknown — should return 404', async () => {
      const res = await request(app).get('/completely-unknown');

      expect(res.status).toBe(404);
    });
  });

  // ── Database seeded data ───────────────────────────────────────────────────

  describe('Seeded Data Integrity', () => {
    it('seeded product should exist in database', async () => {
      const product = await prisma.product.findUnique({ where: { id: 'e2e-product-uuid-001' } });

      expect(product).not.toBeNull();
      expect(product!.title).toBe('Luna White Kitchen');
    });

    it('seeded standard shipping rate should be active for GB', async () => {
      const rate = await prisma.shippingRate.findUnique({ where: { id: 'e2e-ship-rate-uuid-001' } });

      expect(rate).not.toBeNull();
      expect(rate!.isActive).toBe(true);
      expect(rate!.countries).toContain('GB');
    });

    it('seeded coupon E2ETEST20 should be ACTIVE', async () => {
      const coupon = await prisma.coupon.findUnique({ where: { id: 'e2e-coupon-uuid-001' } });

      expect(coupon).not.toBeNull();
      expect(coupon!.status).toBe('ACTIVE');
      expect(coupon!.code).toBe('E2ETEST20');
    });

    it('seeded UK VAT rule should be active', async () => {
      const taxRule = await prisma.taxRule.findUnique({ where: { id: 'e2e-tax-uuid-001' } });

      expect(taxRule).not.toBeNull();
      expect(taxRule!.isActive).toBe(true);
      expect(taxRule!.rate).toBe(20);
    });
  });
});