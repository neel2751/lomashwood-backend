import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import nock from 'nock';

/**
 * E2E: Checkout Flow
 *
 * Covers the complete checkout journey:
 *   1. Customer requests a price summary with shipping + tax
 *   2. Customer applies a valid coupon and verifies discount
 *   3. Customer initiates checkout — order + Stripe PaymentIntent created
 *   4. Order is persisted in PENDING state
 *   5. Customer confirms the checkout session
 *   6. Invalid coupon is gracefully rejected
 *   7. Below-minimum-order coupon is rejected with 422
 */

describe('E2E — Checkout Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let createdOrderId: string;

  const shippingAddress = {
    line1: '10 Downing Street',
    city: 'London',
    postcode: 'SW1A 2AA',
    country: 'GB',
  };

  const orderItems = [{ productId: 'e2e-product-uuid-001', quantity: 1, unitPrice: 150000 }];

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;

    // Mock Stripe API
    nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .reply(200, {
        id: 'pi_e2e_test_abc123',
        client_secret: 'pi_e2e_test_abc123_secret_xyz',
        amount: 180995,
        currency: 'gbp',
        status: 'requires_payment_method',
      })
      .persist();
  });

  afterAll(async () => {
    nock.cleanAll();
    if (createdOrderId) {
      await prisma.order.deleteMany({ where: { id: createdOrderId } });
    }
  });

  // ── Step 1: Price summary ────────────────────────────────────────────────

  it('Step 1 — should return a full price breakdown including tax and shipping', async () => {
    const res = await request(app)
      .post('/v1/checkout/summary')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: orderItems,
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      subtotal: 150000,
      taxAmount: expect.any(Number),
      shippingAmount: expect.any(Number),
      totalAmount: expect.any(Number),
      discountAmount: 0,
    });
    expect(res.body.data.taxAmount).toBeGreaterThan(0);
    expect(res.body.data.totalAmount).toBeGreaterThan(150000);
  });

  // ── Step 2: Apply coupon ─────────────────────────────────────────────────

  it('Step 2 — applying coupon E2ETEST20 should give 20% discount on £1500 order', async () => {
    const res = await request(app)
      .post('/v1/checkout/apply-coupon')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'E2ETEST20', orderAmount: 150000 });

    expect(res.status).toBe(200);
    expect(res.body.data.discountAmount).toBe(30000); // 20% of 150000, capped at 30000
    expect(res.body.data.couponId).toBe('e2e-coupon-uuid-001');
    expect(res.body.data.isValid).toBe(true);
  });

  // ── Step 3: Checkout summary with coupon applied ─────────────────────────

  it('Step 3 — price summary with coupon should reflect reduced total', async () => {
    const res = await request(app)
      .post('/v1/checkout/summary')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: orderItems,
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
        couponCode: 'E2ETEST20',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.discountAmount).toBe(30000);
    expect(res.body.data.totalAmount).toBeLessThan(180995);
  });

  // ── Step 4: Initiate checkout ────────────────────────────────────────────

  it('Step 4 — initiating checkout should create an order and a Stripe PaymentIntent', async () => {
    const res = await request(app)
      .post('/v1/checkout/initiate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: orderItems,
        shippingAddress,
        shippingRateId: 'e2e-ship-rate-uuid-001',
        couponCode: 'E2ETEST20',
        country: 'GB',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      orderId: expect.any(String),
      clientSecret: expect.stringContaining('pi_'),
      paymentIntentId: expect.stringContaining('pi_'),
    });

    createdOrderId = res.body.data.orderId;
  });

  // ── Step 5: Order exists in DB ────────────────────────────────────────────

  it('Step 5 — the initiated order should be persisted in PENDING state', async () => {
    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { items: true, payments: true },
    });

    expect(order).not.toBeNull();
    expect(order!.status).toBe(OrderStatus.PENDING);
    expect(order!.paymentStatus).toBe(PaymentStatus.UNPAID);
    expect(order!.items).toHaveLength(1);
    expect(order!.payments).toHaveLength(1);
    expect(order!.discountAmount).toBe(30000);
  });

  // ── Step 6: Confirm checkout ──────────────────────────────────────────────

  it('Step 6 — confirming checkout with valid paymentIntentId should move order to CONFIRMED', async () => {
    const res = await request(app)
      .post('/v1/checkout/confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId: createdOrderId, paymentIntentId: 'pi_e2e_test_abc123' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.CONFIRMED);
    expect(res.body.data.paymentStatus).toBe(PaymentStatus.PAID);
  });

  // ── Step 7: Invalid coupon rejected ──────────────────────────────────────

  it('Step 7 — applying a non-existent coupon should return 404', async () => {
    const res = await request(app)
      .post('/v1/checkout/apply-coupon')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'DOES_NOT_EXIST', orderAmount: 150000 });

    expect(res.status).toBe(404);
  });

  // ── Step 8: Order below coupon minimum rejected ───────────────────────────

  it('Step 8 — coupon application below minimum order amount should return 422', async () => {
    const res = await request(app)
      .post('/v1/checkout/apply-coupon')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'E2ETEST20', orderAmount: 10000 }); // Below £500 minimum

    expect(res.status).toBe(422);
  });

  // ── Step 9: Free shipping threshold ──────────────────────────────────────

  it('Step 9 — order above free-shipping threshold should have zero shipping cost', async () => {
    const res = await request(app)
      .post('/v1/checkout/summary')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1, unitPrice: 60000 }],
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.shippingAmount).toBe(0);
  });
});