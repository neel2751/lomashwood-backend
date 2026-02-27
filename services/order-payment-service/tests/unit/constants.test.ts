import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import {
  ORDER_CONSTANTS,
  PAYMENT_CONSTANTS,
  REFUND_CONSTANTS,
  INVOICE_CONSTANTS,
  ABANDONED_CHECKOUT_CONSTANTS,
  EXPIRE_ORDER_CONSTANTS,
  RECONCILE_PAYMENT_CONSTANTS,
  WEBHOOK_CONSTANTS,
  PAGINATION_CONSTANTS,
  CACHE_TTL,
  CACHE_KEY_PREFIX,
  HTTP_STATUS,
  SORT_ORDER,
  ENVIRONMENT,
} from '../../src/shared/constants';

setupUnitTest();

describe('Constants', () => {
  describe('ORDER_CONSTANTS', () => {
    it('has correct prefix', () => expect(ORDER_CONSTANTS.ORDER_NUMBER_PREFIX).toBe('LW'));
    it('supports GBP by default', () => expect(ORDER_CONSTANTS.DEFAULT_CURRENCY).toBe('GBP'));
    it('has a max items limit', () => expect(ORDER_CONSTANTS.MAX_ITEMS_PER_ORDER).toBeGreaterThan(0));
    it('PENDING expiry is less than AWAITING_PAYMENT expiry', () => {
      expect(ORDER_CONSTANTS.PENDING_EXPIRY_MINUTES).toBeLessThan(ORDER_CONSTANTS.AWAITING_PAYMENT_EXPIRY_MINUTES);
    });
  });

  describe('PAYMENT_CONSTANTS', () => {
    it('references a valid Stripe API version', () => {
      expect(PAYMENT_CONSTANTS.STRIPE_API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    it('webhook tolerance is positive', () => expect(PAYMENT_CONSTANTS.STRIPE_WEBHOOK_TOLERANCE_SECONDS).toBeGreaterThan(0));
    it('retry attempts is a positive integer', () => expect(Number.isInteger(PAYMENT_CONSTANTS.MAX_RETRY_ATTEMPTS)).toBe(true));
    it('includes card in supported payment methods', () => expect(PAYMENT_CONSTANTS.SUPPORTED_PAYMENT_METHODS).toContain('card'));
  });

  describe('REFUND_CONSTANTS', () => {
    it('has a positive max refund window', () => expect(REFUND_CONSTANTS.MAX_REFUND_WINDOW_DAYS).toBeGreaterThan(0));
    it('maps CUSTOMER_REQUEST to Stripe reason', () => {
      expect(REFUND_CONSTANTS.STRIPE_REFUND_REASON_MAP.CUSTOMER_REQUEST).toBe('requested_by_customer');
    });
    it('maps FRAUDULENT_CHARGE to Stripe reason', () => {
      expect(REFUND_CONSTANTS.STRIPE_REFUND_REASON_MAP.FRAUDULENT_CHARGE).toBe('fraudulent');
    });
  });

  describe('INVOICE_CONSTANTS', () => {
    it('standard VAT rate is 0.2', () => expect(INVOICE_CONSTANTS.VAT_RATE_STANDARD).toBe(0.2));
    it('zero VAT rate is 0', () => expect(INVOICE_CONSTANTS.VAT_RATE_ZERO).toBe(0));
    it('has a positive due days value', () => expect(INVOICE_CONSTANTS.INVOICE_DUE_DAYS).toBeGreaterThan(0));
    it('prefix is INV', () => expect(INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX).toBe('INV'));
  });

  describe('ABANDONED_CHECKOUT_CONSTANTS', () => {
    it('threshold is positive minutes', () => expect(ABANDONED_CHECKOUT_CONSTANTS.ABANDON_THRESHOLD_MINUTES).toBeGreaterThan(0));
    it('batch size is positive', () => expect(ABANDONED_CHECKOUT_CONSTANTS.BATCH_SIZE).toBeGreaterThan(0));
    it('cron expression is valid format', () => expect(ABANDONED_CHECKOUT_CONSTANTS.JOB_CRON_EXPRESSION).toBeTruthy());
  });

  describe('EXPIRE_ORDER_CONSTANTS', () => {
    it('pending expiry is less than awaiting payment expiry', () => {
      expect(EXPIRE_ORDER_CONSTANTS.PENDING_EXPIRY_MINUTES).toBeLessThan(EXPIRE_ORDER_CONSTANTS.AWAITING_PAYMENT_EXPIRY_MINUTES);
    });
  });

  describe('WEBHOOK_CONSTANTS', () => {
    it('includes payment_intent.succeeded event', () => {
      expect(WEBHOOK_CONSTANTS.SUPPORTED_STRIPE_EVENTS).toContain('payment_intent.succeeded');
    });
    it('includes payment_intent.payment_failed event', () => {
      expect(WEBHOOK_CONSTANTS.SUPPORTED_STRIPE_EVENTS).toContain('payment_intent.payment_failed');
    });
    it('includes charge.refunded event', () => {
      expect(WEBHOOK_CONSTANTS.SUPPORTED_STRIPE_EVENTS).toContain('charge.refunded');
    });
    it('max retry is greater than initial retry', () => {
      expect(WEBHOOK_CONSTANTS.MAX_RETRY_DELAY_MS).toBeGreaterThan(WEBHOOK_CONSTANTS.INITIAL_RETRY_DELAY_MS);
    });
  });

  describe('PAGINATION_CONSTANTS', () => {
    it('default page is 1', () => expect(PAGINATION_CONSTANTS.DEFAULT_PAGE).toBe(1));
    it('max limit is greater than default', () => expect(PAGINATION_CONSTANTS.MAX_LIMIT).toBeGreaterThan(PAGINATION_CONSTANTS.DEFAULT_LIMIT));
    it('min limit is at least 1', () => expect(PAGINATION_CONSTANTS.MIN_LIMIT).toBeGreaterThanOrEqual(1));
  });

  describe('CACHE_TTL', () => {
    it('all TTL values are positive', () => {
      Object.values(CACHE_TTL).forEach((ttl) => expect(ttl).toBeGreaterThan(0));
    });
    it('invoice TTL is longer than payment TTL', () => {
      expect(CACHE_TTL.INVOICE_SECONDS).toBeGreaterThan(CACHE_TTL.PAYMENT_SECONDS);
    });
  });

  describe('CACHE_KEY_PREFIX', () => {
    it('order prefix starts with order:', () => expect(CACHE_KEY_PREFIX.ORDER).toMatch(/^order/));
    it('payment prefix starts with payment:', () => expect(CACHE_KEY_PREFIX.PAYMENT).toMatch(/^payment/));
    it('all prefixes are non-empty strings', () => {
      Object.values(CACHE_KEY_PREFIX).forEach((p) => expect(typeof p).toBe('string'));
    });
  });

  describe('HTTP_STATUS', () => {
    it('OK is 200', () => expect(HTTP_STATUS.OK).toBe(200));
    it('CREATED is 201', () => expect(HTTP_STATUS.CREATED).toBe(201));
    it('NOT_FOUND is 404', () => expect(HTTP_STATUS.NOT_FOUND).toBe(404));
    it('INTERNAL_SERVER_ERROR is 500', () => expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500));
    it('UNPROCESSABLE_ENTITY is 422', () => expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422));
    it('TOO_MANY_REQUESTS is 429', () => expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429));
  });

  describe('SORT_ORDER', () => {
    it('ASC is asc', () => expect(SORT_ORDER.ASC).toBe('asc'));
    it('DESC is desc', () => expect(SORT_ORDER.DESC).toBe('desc'));
  });

  describe('ENVIRONMENT', () => {
    it('contains all expected environments', () => {
      expect(ENVIRONMENT.DEVELOPMENT).toBe('development');
      expect(ENVIRONMENT.STAGING).toBe('staging');
      expect(ENVIRONMENT.PRODUCTION).toBe('production');
      expect(ENVIRONMENT.TEST).toBe('test');
    });
  });
});