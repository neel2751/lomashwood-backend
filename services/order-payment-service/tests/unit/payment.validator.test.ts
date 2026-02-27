import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { createPaymentIntentSchema, confirmPaymentSchema } from '../../src/app/payments/payment.schemas';
import { ORDER_PENDING_KITCHEN } from '../../tests/fixtures';

setupUnitTest();

describe('Payment Validators', () => {
  describe('createPaymentIntentSchema', () => {
    it('validates a correct create intent payload', () => {
      const result = createPaymentIntentSchema.safeParse({ orderId: ORDER_PENDING_KITCHEN.id });
      expect(result.success).toBe(true);
    });

    it('rejects missing orderId', () => {
      const result = createPaymentIntentSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects empty string orderId', () => {
      const result = createPaymentIntentSchema.safeParse({ orderId: '' });
      expect(result.success).toBe(false);
    });

    it('accepts optional idempotency key', () => {
      const result = createPaymentIntentSchema.safeParse({
        orderId: ORDER_PENDING_KITCHEN.id,
        idempotencyKey: 'custom-key-123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('confirmPaymentSchema', () => {
    const validPayload = {
      gatewayPaymentId: 'pi_3OxKpLF1234567890ABCD',
      gatewayChargeId: 'ch_3OxKpLF1234567890ABCD',
      gatewayReceiptUrl: 'https://pay.stripe.com/receipts/mock',
      gatewayBalanceTransactionId: 'txn_mock001',
      amountCaptured: 2998.80,
      rawStatus: 'succeeded',
      paidAt: new Date().toISOString(),
    };

    it('validates a correct confirm payload', () => {
      const result = confirmPaymentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects missing gatewayPaymentId', () => {
      const { gatewayPaymentId: _, ...rest } = validPayload;
      const result = confirmPaymentSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects negative amountCaptured', () => {
      const result = confirmPaymentSchema.safeParse({ ...validPayload, amountCaptured: -1 });
      expect(result.success).toBe(false);
    });

    it('accepts null optional fields', () => {
      const result = confirmPaymentSchema.safeParse({
        ...validPayload,
        gatewayChargeId: null,
        gatewayReceiptUrl: null,
        gatewayBalanceTransactionId: null,
      });
      expect(result.success).toBe(true);
    });
  });
});