import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { createRefundSchema } from '../../src/app/refunds/refund.schemas';
import { PAYMENT_SUCCEEDED } from '../../tests/fixtures';

setupUnitTest();

describe('Refund Validators', () => {
  describe('createRefundSchema', () => {
    const valid = { paymentId: PAYMENT_SUCCEEDED.id, amount: 100.00, reason: 'CUSTOMER_REQUEST', note: null };

    it('validates correct payload', () => {
      expect(createRefundSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects unknown reason', () => {
      expect(createRefundSchema.safeParse({ ...valid, reason: 'BAD_REASON' }).success).toBe(false);
    });

    it('rejects zero amount', () => {
      expect(createRefundSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    });

    it('rejects negative amount', () => {
      expect(createRefundSchema.safeParse({ ...valid, amount: -50 }).success).toBe(false);
    });

    it('accepts optional note', () => {
      expect(createRefundSchema.safeParse({ ...valid, note: 'Damaged item' }).success).toBe(true);
    });

    it('rejects missing paymentId', () => {
      const { paymentId: _, ...rest } = valid;
      expect(createRefundSchema.safeParse(rest).success).toBe(false);
    });
  });
});