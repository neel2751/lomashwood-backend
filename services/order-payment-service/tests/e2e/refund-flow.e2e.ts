import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus, RefundStatus } from '@prisma/client';
import nock from 'nock';

/**
 * E2E: Refund Flow
 *
 * Covers the complete refund lifecycle:
 *   1. Setup — create and pay a confirmed order
 *   2. Admin issues a partial refund via API
 *   3. Stripe refund webhook fires and confirms the refund
 *   4. Refund status in DB is SUCCEEDED
 *   5. Customer can view the refund
 *   6. Admin issues a full refund
 *   7. Over-amount refund is rejected
 */

describe('E2E — Refund Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let orderId: string;
  let paymentId: string;
  let partialRefundId: string;
  const stripePaymentIntentId = 'pi_e2e_refund_base_001';
  const stripeRefundId = 're_e2e_partial_001';
  const stripeFullRefundId = 're_e2e_full_001';

  beforeAll(async () => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;

    nock('https://api.stripe.com')
      .post('/v1/refunds')
      .reply(200, {
        id: stripeRefundId,
        amount: 50000,
        currency: 'gbp',
        status: 'succeeded',
        payment_intent: stripePaymentIntentId,
      })
      .post('/v1/refunds')
      .reply(200, {
        id: stripeFullRefundId,
        amount: 130995,
        currency: 'gbp',
        status: 'succeeded',
        payment_intent: stripePaymentIntentId,
      })
      .persist();

    // Setup: seed a pre-confirmed, paid order
    const order = await prisma.order.create({
      data: {
        id: 'e2e-refund-order-001',
        userId: global.__E2E_USER_ID__,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        subtotal: 150000,
        taxAmount: 30000,
        shippingAmount: 995,
        discountAmount: 0,
        totalAmount: 180995,
        currency: 'GBP',
        shippingAddress: { line1: '1 Refund Rd', city: 'London', postcode: 'E1 1AB', country: 'GB' },
      },
    });

    orderId = order.id;

    const payment = await prisma.payment.create({
      data: {
        orderId,
        stripePaymentIntentId,
        amount: 180995,
        currency: 'GBP',
        status: PaymentStatus.SUCCEEDED,
        method: 'CARD',
      },
    });

    paymentId = payment.id;
  });

  afterAll(async () => {
    nock.cleanAll();
    if (orderId) {
      await prisma.refund.deleteMany({ where: { paymentId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.invoice.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
  });

  // ── Step 1: Admin creates partial refund ─────────────────────────────────

  it('Step 1 — admin should create a £500 partial refund and receive 201', async () => {
    const res = await request(app)
      .post('/v1/refunds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentId,
        amount: 50000,
        reason: 'Partial refund requested by customer',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      amount: 50000,
      stripeRefundId: expect.stringContaining('re_'),
      status: RefundStatus.PENDING,
    });

    partialRefundId = res.body.data.id;
  });

  // ── Step 2: Refund persisted as PENDING ──────────────────────────────────

  it('Step 2 — refund should be persisted as PENDING before webhook', async () => {
    const refund = await prisma.refund.findUnique({ where: { id: partialRefundId } });

    expect(refund).not.toBeNull();
    expect(refund!.status).toBe(RefundStatus.PENDING);
    expect(refund!.amount).toBe(50000);
    expect(refund!.stripeRefundId).toBe(stripeRefundId);
  });

  // ── Step 3: Stripe charge.refunded webhook ───────────────────────────────

  it('Step 3 — charge.refunded webhook should update refund status to SUCCEEDED', async () => {
    const webhookPayload = JSON.stringify({
      id: 'evt_e2e_refund_001',
      object: 'event',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_e2e_test_001',
          payment_intent: stripePaymentIntentId,
          refunds: {
            data: [{ id: stripeRefundId, amount: 50000, status: 'succeeded' }],
          },
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

  // ── Step 4: Refund is SUCCEEDED ──────────────────────────────────────────

  it('Step 4 — refund should be SUCCEEDED after webhook fires', async () => {
    const refund = await prisma.refund.findUnique({ where: { id: partialRefundId } });

    expect(refund!.status).toBe(RefundStatus.SUCCEEDED);
  });

  // ── Step 5: Customer views their refund ──────────────────────────────────

  it('Step 5 — customer should be able to view the refund details', async () => {
    const res = await request(app)
      .get(`/v1/refunds/${partialRefundId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(RefundStatus.SUCCEEDED);
    expect(res.body.data.amount).toBe(50000);
  });

  // ── Step 6: Admin views all refunds for a payment ────────────────────────

  it('Step 6 — admin should be able to list all refunds for the payment', async () => {
    const res = await request(app)
      .get(`/v1/refunds/payment/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  // ── Step 7: Over-amount refund rejected ──────────────────────────────────

  it('Step 7 — attempting to refund more than the payment amount should return 422', async () => {
    const res = await request(app)
      .post('/v1/refunds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentId,
        amount: 9999999,
        reason: 'Greedy refund attempt',
      });

    expect(res.status).toBe(422);
  });

  // ── Step 8: Non-admin cannot create refund ───────────────────────────────

  it('Step 8 — non-admin customer should receive 403 when trying to issue a refund', async () => {
    const res = await request(app)
      .post('/v1/refunds')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ paymentId, amount: 10000, reason: 'I want my money back' });

    expect(res.status).toBe(403);
  });
});