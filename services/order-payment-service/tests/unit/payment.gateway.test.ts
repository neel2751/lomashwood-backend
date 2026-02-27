import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockStripeClient } from '../../src/tests-helpers/setup';
import { StripeClient } from '../../src/infrastructure/payments/stripe.client';
import { WebhookVerificationError, PaymentError } from '../../src/shared/errors';
import {
  PAYMENT_PENDING,
  STRIPE_PAYMENT_INTENT_MOCK,
  STRIPE_REFUND_MOCK,
  ORDER_PENDING_KITCHEN,
  CUSTOMER_SNAPSHOT_1,
} from '../../tests/fixtures';

setupUnitTest();

jest.mock('stripe', () => jest.fn().mockImplementation(() => mockStripeClient));

describe('StripeClient (Payment Gateway)', () => {
  let stripeClient: StripeClient;

  beforeEach(() => {
    jest.clearAllMocks();
    stripeClient = new StripeClient('sk_test_mock_key', 'whsec_mock_secret');
  });

  describe('createPaymentIntent', () => {
    it('creates payment intent with correct parameters', async () => {
      mockStripeClient.paymentIntents.create.mockResolvedValueOnce(STRIPE_PAYMENT_INTENT_MOCK);

      const result = await stripeClient.createPaymentIntent({
        amount: 299880,
        currency: 'gbp',
        metadata: { orderId: ORDER_PENDING_KITCHEN.id, customerId: CUSTOMER_SNAPSHOT_1.id },
        idempotencyKey: 'idem-pi-001',
      });

      expect(result.id).toBe(STRIPE_PAYMENT_INTENT_MOCK.id);
      expect(result.client_secret).toBe(STRIPE_PAYMENT_INTENT_MOCK.client_secret);
      expect(mockStripeClient.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 299880, currency: 'gbp' }),
        expect.objectContaining({ idempotencyKey: 'idem-pi-001' }),
      );
    });

    it('throws PaymentError on Stripe API failure', async () => {
      mockStripeClient.paymentIntents.create.mockRejectedValueOnce(
        Object.assign(new Error('card_declined'), { type: 'StripeCardError', code: 'card_declined' }),
      );

      await expect(
        stripeClient.createPaymentIntent({
          amount: 299880,
          currency: 'gbp',
          metadata: {},
          idempotencyKey: null,
        }),
      ).rejects.toThrow(PaymentError);
    });
  });

  describe('retrievePaymentIntent', () => {
    it('retrieves an existing payment intent', async () => {
      mockStripeClient.paymentIntents.retrieve.mockResolvedValueOnce(STRIPE_PAYMENT_INTENT_MOCK);

      const result = await stripeClient.retrievePaymentIntent(STRIPE_PAYMENT_INTENT_MOCK.id);

      expect(result.id).toBe(STRIPE_PAYMENT_INTENT_MOCK.id);
    });

    it('throws PaymentError when intent not found', async () => {
      mockStripeClient.paymentIntents.retrieve.mockRejectedValueOnce(
        Object.assign(new Error('No such payment_intent'), { type: 'StripeInvalidRequestError' }),
      );

      await expect(stripeClient.retrievePaymentIntent('pi_nonexistent')).rejects.toThrow(PaymentError);
    });
  });

  describe('cancelPaymentIntent', () => {
    it('cancels a payment intent', async () => {
      const cancelled = { ...STRIPE_PAYMENT_INTENT_MOCK, status: 'canceled' };
      mockStripeClient.paymentIntents.cancel.mockResolvedValueOnce(cancelled);

      const result = await stripeClient.cancelPaymentIntent(STRIPE_PAYMENT_INTENT_MOCK.id);

      expect(result.status).toBe('canceled');
    });
  });

  describe('createRefund', () => {
    it('creates a full refund', async () => {
      mockStripeClient.refunds.create.mockResolvedValueOnce(STRIPE_REFUND_MOCK);

      const result = await stripeClient.createRefund({
        paymentIntentId: PAYMENT_PENDING.stripePaymentIntentId!,
        amount: null,
        reason: 'requested_by_customer',
        idempotencyKey: 'idem-refund-001',
      });

      expect(result.id).toBe(STRIPE_REFUND_MOCK.id);
      expect(result.status).toBe('succeeded');
    });

    it('creates a partial refund with specified amount', async () => {
      const partialRefund = { ...STRIPE_REFUND_MOCK, amount: 150000 };
      mockStripeClient.refunds.create.mockResolvedValueOnce(partialRefund);

      const result = await stripeClient.createRefund({
        paymentIntentId: PAYMENT_PENDING.stripePaymentIntentId!,
        amount: 1500,
        reason: 'requested_by_customer',
        idempotencyKey: 'idem-partial-refund-001',
      });

      expect(result.amount).toBe(150000);
    });

    it('throws PaymentError on refund failure', async () => {
      mockStripeClient.refunds.create.mockRejectedValueOnce(
        Object.assign(new Error('charge_already_refunded'), { type: 'StripeInvalidRequestError' }),
      );

      await expect(
        stripeClient.createRefund({
          paymentIntentId: 'pi_already_refunded',
          amount: null,
          reason: 'requested_by_customer',
          idempotencyKey: null,
        }),
      ).rejects.toThrow(PaymentError);
    });
  });

  describe('constructWebhookEvent', () => {
    it('constructs a valid webhook event', () => {
      const rawBody = JSON.stringify({ id: 'evt_mock', type: 'payment_intent.succeeded' });
      const sig = 'mock-stripe-signature';
      const mockEvent = { id: 'evt_mock', type: 'payment_intent.succeeded', data: { object: STRIPE_PAYMENT_INTENT_MOCK } };
      mockStripeClient.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const result = stripeClient.constructWebhookEvent(rawBody, sig);

      expect(result.type).toBe('payment_intent.succeeded');
    });

    it('throws WebhookVerificationError on invalid signature', () => {
      mockStripeClient.webhooks.constructEvent.mockImplementationOnce(() => {
        throw Object.assign(new Error('No signatures found matching the expected signature for payload'), {
          type: 'StripeSignatureVerificationError',
        });
      });

      expect(() => stripeClient.constructWebhookEvent('payload', 'bad-sig')).toThrow(
        WebhookVerificationError,
      );
    });
  });
});