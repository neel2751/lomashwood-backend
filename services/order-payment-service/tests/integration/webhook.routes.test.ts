import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import Stripe from 'stripe';
import { stripeClient } from '../../src/infrastructure/payments/stripe.client';
import { PaymentStatus, OrderStatus, RefundStatus } from '@prisma/client';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    payment: { findFirst: jest.fn(), update: jest.fn() },
    order: { update: jest.fn(), findUnique: jest.fn() },
    refund: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  },
}));

jest.mock('../../src/infrastructure/payments/stripe.client', () => ({
  stripeClient: {
    webhooks: { constructEvent: jest.fn() },
  },
}));

const WEBHOOK_BASE = '/v1/webhooks/stripe';
const STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

describe('Webhook Routes — Integration', () => {
  const mockPayment = {
    id: 'pay-uuid-001',
    orderId: 'order-uuid-001',
    stripePaymentIntentId: 'pi_test_abc123',
    amount: 180995,
    status: PaymentStatus.PENDING,
  };

  const mockOrder = {
    id: 'order-uuid-001',
    userId: 'user-uuid-001',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
  };

  const buildRawEvent = (type: string, data: Record<string, any>): Stripe.Event => ({
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: type as Stripe.Event['type'],
    data: { object: data as any },
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── POST /v1/webhooks/stripe ─────────────────────────────────────────────

  describe('POST /v1/webhooks/stripe', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('Content-Type', 'application/json')
        .send({ type: 'payment_intent.succeeded' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when signature verification fails', async () => {
      (stripeClient.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload.');
      });

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'invalid_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

      expect(res.status).toBe(400);
    });

    // ── payment_intent.succeeded ─────────────────────────────────────────────

    it('should handle payment_intent.succeeded and update order to PAID + CONFIRMED', async () => {
      const event = buildRawEvent('payment_intent.succeeded', {
        id: 'pi_test_abc123',
        amount: 180995,
        currency: 'gbp',
        status: 'succeeded',
      });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should return 200 even when no payment record is found (idempotent)', async () => {
      const event = buildRawEvent('payment_intent.succeeded', {
        id: 'pi_unknown',
        amount: 10000,
      });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(200);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    // ── payment_intent.payment_failed ────────────────────────────────────────

    it('should handle payment_intent.payment_failed and mark payment as FAILED', async () => {
      const event = buildRawEvent('payment_intent.payment_failed', {
        id: 'pi_test_abc123',
        last_payment_error: { message: 'Your card was declined.' },
      });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
      });
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.FAILED,
      });

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(200);
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentStatus.FAILED }),
        }),
      );
    });

    // ── charge.refunded ───────────────────────────────────────────────────────

    it('should handle charge.refunded and update refund status to SUCCEEDED', async () => {
      const event = buildRawEvent('charge.refunded', {
        id: 'ch_test_xyz',
        payment_intent: 'pi_test_abc123',
        refunds: {
          data: [{ id: 're_test_001', amount: 50000, status: 'succeeded' }],
        },
      });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.refund.findFirst as jest.Mock).mockResolvedValue({
        id: 'refund-uuid-001',
        stripeRefundId: 're_test_001',
        status: RefundStatus.PENDING,
      });
      (prisma.refund.update as jest.Mock).mockResolvedValue({
        id: 'refund-uuid-001',
        status: RefundStatus.SUCCEEDED,
      });

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(200);
      expect(prisma.refund.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RefundStatus.SUCCEEDED }),
        }),
      );
    });

    // ── payment_intent.canceled ───────────────────────────────────────────────

    it('should handle payment_intent.canceled and mark order as CANCELLED', async () => {
      const event = buildRawEvent('payment_intent.canceled', {
        id: 'pi_test_abc123',
        cancellation_reason: 'abandoned',
      });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(200);
    });

    // ── unhandled event type ───────────────────────────────────────────────────

    it('should return 200 and acknowledge unhandled event types gracefully', async () => {
      const event = buildRawEvent('customer.created', { id: 'cus_abc' });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    // ── internal error handling ────────────────────────────────────────────────

    it('should return 500 when a database error occurs during webhook processing', async () => {
      const event = buildRawEvent('payment_intent.succeeded', {
        id: 'pi_test_abc123',
      });

      (stripeClient.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .post(WEBHOOK_BASE)
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event));

      expect(res.status).toBe(500);
    });
  });
});