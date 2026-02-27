import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import nock from 'nock';
import Stripe from 'stripe';

/**
 * E2E: Payment Success Flow
 *
 * Covers the complete successful payment path:
 *   1. Customer creates a pending order
 *   2. Customer creates a Stripe PaymentIntent
 *   3. Stripe webhook fires payment_intent.succeeded
 *   4. Order status updated to CONFIRMED + PAID
 *   5. Payment record updated to SUCCEEDED
 *   6. Invoice is automatically generated
 *   7. Customer can view the completed payment
 */

describe('E2E — Payment Success Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let orderId: string;
  let paymentId: string;
  let stripePaymentIntentId: string;

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;

    stripePaymentIntentId = 'pi_e2e_success_abc123';

    nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .reply(200, {
        id: stripePaymentIntentId,
        client_secret: `${stripePaymentIntentId}_secret_xyz`,
        amount: 180995,
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
        shippingAddress: { line1: '1 Test St', city: 'London', postcode: 'E1 6RF', country: 'GB' },
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    expect(res.status).toBe(201);
    orderId = res.body.data.id;
  });

  // ── Step 2: Create PaymentIntent ─────────────────────────────────────────

  it('Step 2 — should create a Stripe PaymentIntent and return clientSecret', async () => {
    const res = await request(app)
      .post('/v1/payments/create-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId });

    expect(res.status).toBe(201);
    expect(res.body.data.clientSecret).toContain('pi_');
    expect(res.body.data.paymentIntentId).toBe(stripePaymentIntentId);

    paymentId = res.body.data.paymentId;
  });

  // ── Step 3: Payment is PENDING in DB ────────────────────────────────────

  it('Step 3 — payment record should be PENDING before webhook fires', async () => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

    expect(payment).not.toBeNull();
    expect(payment!.status).toBe(PaymentStatus.PENDING);
    expect(payment!.stripePaymentIntentId).toBe(stripePaymentIntentId);
  });

  // ── Step 4: Stripe webhook — payment_intent.succeeded ────────────────────

  it('Step 4 — firing payment_intent.succeeded webhook should update order and payment', async () => {
    const webhookPayload = JSON.stringify({
      id: 'evt_e2e_success_001',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripePaymentIntentId,
          amount: 180995,
          currency: 'gbp',
          status: 'succeeded',
        },
      },
    });

    // Bypass signature verification in test environment
    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'e2e-test-bypass-sig')
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  // ── Step 5: Order is CONFIRMED + PAID ───────────────────────────────────

  it('Step 5 — order should be CONFIRMED with PAID paymentStatus after webhook', async () => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    expect(order!.status).toBe(OrderStatus.CONFIRMED);
    expect(order!.paymentStatus).toBe(PaymentStatus.PAID);
  });

  // ── Step 6: Payment is SUCCEEDED ─────────────────────────────────────────

  it('Step 6 — payment record should be SUCCEEDED after webhook', async () => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

    expect(payment!.status).toBe(PaymentStatus.SUCCEEDED);
  });

  // ── Step 7: Invoice auto-generated ───────────────────────────────────────

  it('Step 7 — an invoice should be auto-generated for the confirmed order', async () => {
    const invoice = await prisma.invoice.findFirst({ where: { orderId } });

    expect(invoice).not.toBeNull();
    expect(invoice!.invoiceNumber).toMatch(/^INV-/);
    expect(invoice!.totalAmount).toBeGreaterThan(0);
  });

  // ── Step 8: Customer views completed payment ──────────────────────────────

  it('Step 8 — customer should be able to retrieve the successful payment details', async () => {
    const res = await request(app)
      .get(`/v1/payments/${paymentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PaymentStatus.SUCCEEDED);
    expect(res.body.data.orderId).toBe(orderId);
  });

  // ── Step 9: Duplicate payment attempt rejected ────────────────────────────

  it('Step 9 — attempting to create another PaymentIntent for an already-paid order returns 409', async () => {
    const res = await request(app)
      .post('/v1/payments/create-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId });

    expect(res.status).toBe(409);
  });
});