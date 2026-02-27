import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus, RefundStatus } from '@prisma/client';

/**
 * E2E: Webhook Processing Flow
 *
 * Validates the complete Stripe webhook processing pipeline:
 *   1. Missing signature header → 400
 *   2. Invalid signature → 400
 *   3. payment_intent.succeeded → order CONFIRMED + PAID
 *   4. payment_intent.payment_failed → order stays PENDING, FAILED
 *   5. charge.refunded → refund SUCCEEDED
 *   6. payment_intent.canceled → order CANCELLED
 *   7. Duplicate event is idempotent (no double-processing)
 *   8. Unrecognised event types acknowledged gracefully
 *   9. Malformed JSON body → 400
 */

describe('E2E — Webhook Processing Flow', () => {
  let prisma: PrismaClient;
  let orderId: string;
  let paymentId: string;
  let refundId: string;
  const intentId = 'pi_e2e_webhook_flow_001';
  const chargeId = 'ch_e2e_webhook_flow_001';
  const stripeRefundId = 're_e2e_webhook_flow_001';

  const postWebhook = (payload: object) =>
    request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'e2e-test-bypass-sig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

  beforeAll(async () => {
    prisma = global.__PRISMA__;

    const order = await prisma.order.create({
      data: {
        id: 'e2e-webhook-order-001',
        userId: global.__E2E_USER_ID__,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: 100000,
        taxAmount: 20000,
        shippingAmount: 995,
        discountAmount: 0,
        totalAmount: 120995,
        currency: 'GBP',
        shippingAddress: { line1: '1 Webhook St', city: 'London', postcode: 'EC1V 9BX', country: 'GB' },
      },
    });
    orderId = order.id;

    const payment = await prisma.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: intentId,
        amount: 120995,
        currency: 'GBP',
        status: PaymentStatus.PENDING,
        method: 'CARD',
      },
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.refund.deleteMany({ where: { paymentId } });
      await prisma.invoice.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
  });

  it('Step 1 — request without stripe-signature header should return 400', async () => {
    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/signature/i);
  });

  it('Step 2 — request with tampered signature should return 400', async () => {
    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'v1=tampered_sig_that_will_fail_verification')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_x' } } }));

    expect(res.status).toBe(400);
  });

  it('Step 3 — payment_intent.succeeded should set order to CONFIRMED + PAID', async () => {
    const res = await postWebhook({
      id: 'evt_e2e_wf_succeeded',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: { id: intentId, amount: 120995, currency: 'gbp', status: 'succeeded' },
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.status).toBe(OrderStatus.CONFIRMED);
    expect(order!.paymentStatus).toBe(PaymentStatus.PAID);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('Step 4 — duplicate payment_intent.succeeded is idempotent (no errors)', async () => {
    const res = await postWebhook({
      id: 'evt_e2e_wf_succeeded',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: { id: intentId, amount: 120995, currency: 'gbp', status: 'succeeded' },
      },
    });

    expect(res.status).toBe(200);

    const payments = await prisma.payment.findMany({ where: { orderId } });
    const succeededPayments = payments.filter((p) => p.status === PaymentStatus.SUCCEEDED);
    expect(succeededPayments).toHaveLength(1);
  });

  it('Step 5 — charge.refunded creates and marks a refund as SUCCEEDED', async () => {
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        stripeRefundId,
        amount: 30000,
        reason: 'E2E webhook test refund',
        status: RefundStatus.PENDING,
      },
    });
    refundId = refund.id;

    const res = await postWebhook({
      id: 'evt_e2e_wf_refunded',
      object: 'event',
      type: 'charge.refunded',
      data: {
        object: {
          id: chargeId,
          payment_intent: intentId,
          refunds: {
            data: [{ id: stripeRefundId, amount: 30000, status: 'succeeded' }],
          },
        },
      },
    });

    expect(res.status).toBe(200);

    const updatedRefund = await prisma.refund.findUnique({ where: { id: refundId } });
    expect(updatedRefund!.status).toBe(RefundStatus.SUCCEEDED);
  });

  it('Step 6 — payment_intent.payment_failed sets payment to FAILED on a new order', async () => {
    const newOrder = await prisma.order.create({
      data: {
        userId: global.__E2E_USER_ID__,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: 50000,
        taxAmount: 10000,
        shippingAmount: 995,
        discountAmount: 0,
        totalAmount: 60995,
        currency: 'GBP',
        shippingAddress: { line1: '1 Fail St', city: 'London', postcode: 'N1 9GU', country: 'GB' },
      },
    });
    const failIntentId = 'pi_e2e_wf_fail_999';
    const newPayment = await prisma.payment.create({
      data: {
        orderId: newOrder.id,
        stripePaymentIntentId: failIntentId,
        amount: 60995,
        currency: 'GBP',
        status: PaymentStatus.PENDING,
        method: 'CARD',
      },
    });

    const res = await postWebhook({
      id: 'evt_e2e_wf_failed',
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: failIntentId,
          last_payment_error: { message: 'Insufficient funds.' },
        },
      },
    });

    expect(res.status).toBe(200);

    const updatedPayment = await prisma.payment.findUnique({ where: { id: newPayment.id } });
    expect(updatedPayment!.status).toBe(PaymentStatus.FAILED);

    const updatedOrder = await prisma.order.findUnique({ where: { id: newOrder.id } });
    expect(updatedOrder!.status).toBe(OrderStatus.PENDING);
    expect(updatedOrder!.paymentStatus).toBe(PaymentStatus.FAILED);

    await prisma.payment.deleteMany({ where: { orderId: newOrder.id } });
    await prisma.order.deleteMany({ where: { id: newOrder.id } });
  });

  it('Step 7 — payment_intent.canceled sets order to CANCELLED', async () => {
    const cancelOrder = await prisma.order.create({
      data: {
        userId: global.__E2E_USER_ID__,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: 80000,
        taxAmount: 16000,
        shippingAmount: 995,
        discountAmount: 0,
        totalAmount: 96995,
        currency: 'GBP',
        shippingAddress: { line1: '1 Cancel Ave', city: 'London', postcode: 'W2 3UR', country: 'GB' },
      },
    });
    const cancelIntentId = 'pi_e2e_wf_cancel_888';
    await prisma.payment.create({
      data: {
        orderId: cancelOrder.id,
        stripePaymentIntentId: cancelIntentId,
        amount: 96995,
        currency: 'GBP',
        status: PaymentStatus.PENDING,
        method: 'CARD',
      },
    });

    const res = await postWebhook({
      id: 'evt_e2e_wf_canceled',
      object: 'event',
      type: 'payment_intent.canceled',
      data: {
        object: { id: cancelIntentId, cancellation_reason: 'abandoned' },
      },
    });

    expect(res.status).toBe(200);

    const updatedOrder = await prisma.order.findUnique({ where: { id: cancelOrder.id } });
    expect(updatedOrder!.status).toBe(OrderStatus.CANCELLED);

    await prisma.payment.deleteMany({ where: { orderId: cancelOrder.id } });
    await prisma.order.deleteMany({ where: { id: cancelOrder.id } });
  });

  it('Step 8 — unrecognised event type is acknowledged gracefully with 200', async () => {
    const res = await postWebhook({
      id: 'evt_e2e_unknown_event',
      object: 'event',
      type: 'account.updated',
      data: { object: { id: 'acct_test' } },
    });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('Step 9 — malformed JSON body returns 400', async () => {
    const res = await request(app)
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'e2e-test-bypass-sig')
      .set('Content-Type', 'application/json')
      .send('{ this is not : valid json }}}');

    expect(res.status).toBe(400);
  });
});