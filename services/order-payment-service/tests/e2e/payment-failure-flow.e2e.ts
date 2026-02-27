import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import nock from 'nock';

/**
 * E2E: Payment Failure Flow
 *
 * Covers the complete payment failure and recovery path:
 *   1. Customer creates an order
 *   2. Customer creates a Stripe PaymentIntent
 *   3. Stripe webhook fires payment_intent.payment_failed
 *   4. Order stays PENDING with FAILED paymentStatus
 *   5. Customer retries — new PaymentIntent created
 *   6. Second Stripe webhook fires payment_intent.succeeded
 *   7. Order is finally CONFIRMED + PAID
 *   8. Webhook for cancelled PaymentIntent marks order CANCELLED
 */

describe('E2E — Payment Failure Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let orderId: string;
  let firstPaymentId: string;
  let secondPaymentId: string;
  const firstIntentId = 'pi_e2e_fail_first_001';
  const secondIntentId = 'pi_e2e_fail_second_001';

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    prisma = global.__PRISMA__;

    nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .reply(200, {
        id: firstIntentId,
        client_secret: `${firstIntentId}_secret`,
        amount: 150995,
        currency: 'gbp',
        status: 'requires_payment_method',
      })
      .post('/v1/payment_intents')
      .reply(200, {
        id: secondIntentId,
        client_secret: `${secondIntentId}_secret`,
        amount: 150995,
        currency: 'gbp',
        status: 'requires_payment_method',
      })
      .persist();
  });

  afterAll(async () => {
    nock.cleanAll();
    if (orderId) {
      await prisma.invoice.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
  });

  // ── Step 1: Create order ──────────────────────────────────────────────────

  it('Step 1 — should create a PENDING order', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1 }],
        shippingAddress: { line1: '5 Test Lane', city: 'London', postcode: 'EC1A 1BB', country: 'GB' },
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    expect(res.status).toBe(201);
    orderId = res.body.data.id;
    expect(orderId).toBeDefined();
  });

  // ── Step 2: Create first PaymentIntent ───────────────────────────────────

  it('Step 2 — should create first PaymentIntent', async () => {
    const res = await request(app)
      .post('/v1/payments/create-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId });

    expect(res.status).toBe(201);
    firstPaymentId = res.body.data.paymentId;
  });

  // ── Step 3: Payment failure webhook ──────────────────────────────────────

  it('Step 3 — payment_intent.payment_failed webhook should set paymentStatus to FAILED', async () => {
    const webhookPayload = JSON.stringify({
      id: 'evt_e2e_fail_001',
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: firstIntentId,
          last_payment_error: { message: 'Your card was declined.' },
        },
      },
    });

    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'e2e-test-bypass-sig')
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(200);
  });

  // ── Step 4: Order stays PENDING but paymentStatus is FAILED ──────────────

  it('Step 4 — order should remain PENDING with FAILED paymentStatus after decline', async () => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    expect(order!.status).toBe(OrderStatus.PENDING);
    expect(order!.paymentStatus).toBe(PaymentStatus.FAILED);
  });

  // ── Step 5: First payment is FAILED ──────────────────────────────────────

  it('Step 5 — first payment record should be FAILED', async () => {
    const payment = await prisma.payment.findUnique({ where: { id: firstPaymentId } });

    expect(payment!.status).toBe(PaymentStatus.FAILED);
  });

  // ── Step 6: Retry — create new PaymentIntent ─────────────────────────────

  it('Step 6 — customer should be able to retry with a new PaymentIntent', async () => {
    const res = await request(app)
      .post('/v1/payments/create-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentIntentId).toBe(secondIntentId);
    secondPaymentId = res.body.data.paymentId;
  });

  // ── Step 7: Second payment succeeds ──────────────────────────────────────

  it('Step 7 — second payment_intent.succeeded webhook should confirm the order', async () => {
    const webhookPayload = JSON.stringify({
      id: 'evt_e2e_fail_retry_001',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: secondIntentId,
          amount: 150995,
          currency: 'gbp',
          status: 'succeeded',
        },
      },
    });

    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'e2e-test-bypass-sig')
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(200);
  });

  // ── Step 8: Order finally CONFIRMED ──────────────────────────────────────

  it('Step 8 — order should be CONFIRMED + PAID after successful retry', async () => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    expect(order!.status).toBe(OrderStatus.CONFIRMED);
    expect(order!.paymentStatus).toBe(PaymentStatus.PAID);
  });

  // ── Step 9: Multiple payment records for same order ──────────────────────

  it('Step 9 — order should have two payment records (one FAILED, one SUCCEEDED)', async () => {
    const payments = await prisma.payment.findMany({ where: { orderId } });

    expect(payments).toHaveLength(2);
    const statuses = payments.map((p) => p.status).sort();
    expect(statuses).toEqual([PaymentStatus.FAILED, PaymentStatus.SUCCEEDED].sort());
  });

  // ── Step 10: Cancellation webhook marks order CANCELLED ──────────────────

  it('Step 10 — payment_intent.canceled webhook on a new order should mark it CANCELLED', async () => {
    // Create a fresh order for cancellation test
    const newOrderRes = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1 }],
        shippingAddress: { line1: '99 Cancel St', city: 'London', postcode: 'W1A 0AX', country: 'GB' },
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    const cancelOrderId = newOrderRes.body.data.id;
    const cancelIntentId = 'pi_e2e_cancel_001';

    await prisma.payment.create({
      data: {
        orderId: cancelOrderId,
        stripePaymentIntentId: cancelIntentId,
        amount: 150000,
        currency: 'GBP',
        status: PaymentStatus.PENDING,
        method: 'CARD',
      },
    });

    const webhookPayload = JSON.stringify({
      id: 'evt_e2e_cancel_001',
      object: 'event',
      type: 'payment_intent.canceled',
      data: {
        object: { id: cancelIntentId, cancellation_reason: 'abandoned' },
      },
    });

    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'e2e-test-bypass-sig')
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(200);

    const cancelledOrder = await prisma.order.findUnique({ where: { id: cancelOrderId } });
    expect(cancelledOrder!.status).toBe(OrderStatus.CANCELLED);

    // Cleanup
    await prisma.payment.deleteMany({ where: { orderId: cancelOrderId } });
    await prisma.order.deleteMany({ where: { id: cancelOrderId } });
  });
});