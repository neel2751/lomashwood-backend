import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  PaymentError,
  PaymentIntentError,
  WebhookVerificationError,
  OrderNotFoundError,
  OrderAlreadyCancelledError,
  OrderNotCancellableError,
  OrderAbandonedError,
  InvoiceNotFoundError,
  RefundNotFoundError,
  RefundNotEligibleError,
  RefundExceedsAmountError,
  DuplicateOrderError,
  InventoryUnavailableError,
  EventPublishError,
  DatabaseError,
  ExternalServiceError,
  isAppError,
  isOperationalError,
  toAppError,
} from '../../src/shared/errors';

setupUnitTest();

describe('Errors', () => {
  describe('AppError', () => {
    it('sets all properties correctly', () => {
      const err = new AppError('TEST_CODE', 'Test message', 400, { extra: 'data' });
      expect(err.code).toBe('TEST_CODE');
      expect(err.message).toBe('Test message');
      expect(err.statusCode).toBe(400);
      expect(err.context).toEqual({ extra: 'data' });
      expect(err.isOperational).toBe(true);
    });

    it('defaults to statusCode 500', () => {
      expect(new AppError('CODE', 'msg').statusCode).toBe(500);
    });

    it('is an instance of Error', () => {
      expect(new AppError('CODE', 'msg')).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('sets statusCode 422 and fields', () => {
      const err = new ValidationError('Invalid', { email: ['Invalid email'] });
      expect(err.statusCode).toBe(422);
      expect(err.fields).toEqual({ email: ['Invalid email'] });
      expect(err.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('sets statusCode 404', () => {
      const err = new NotFoundError('Order', '123');
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('Order');
      expect(err.message).toContain('123');
    });
  });

  describe('ConflictError', () => {
    it('sets statusCode 409', () => {
      expect(new ConflictError('Conflict').statusCode).toBe(409);
    });
  });

  describe('UnauthorizedError', () => {
    it('sets statusCode 401', () => {
      expect(new UnauthorizedError().statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('sets statusCode 403', () => {
      expect(new ForbiddenError().statusCode).toBe(403);
    });
  });

  describe('PaymentError', () => {
    it('sets statusCode 402 and gatewayCode', () => {
      const err = new PaymentError('Card declined', 'card_declined');
      expect(err.statusCode).toBe(402);
      expect(err.gatewayCode).toBe('card_declined');
    });
  });

  describe('WebhookVerificationError', () => {
    it('sets statusCode 400', () => {
      expect(new WebhookVerificationError().statusCode).toBe(400);
    });
  });

  describe('OrderNotFoundError', () => {
    it('carries orderId and code ORDER_NOT_FOUND', () => {
      const err = new OrderNotFoundError('order-123');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('ORDER_NOT_FOUND');
      expect(err.message).toContain('order-123');
    });
  });

  describe('OrderAlreadyCancelledError', () => {
    it('has CONFLICT status 409', () => {
      expect(new OrderAlreadyCancelledError('order-123').statusCode).toBe(409);
    });
  });

  describe('OrderNotCancellableError', () => {
    it('includes current status in message', () => {
      const err = new OrderNotCancellableError('order-123', 'DISPATCHED');
      expect(err.message).toContain('DISPATCHED');
    });
  });

  describe('RefundExceedsAmountError', () => {
    it('includes amounts in message', () => {
      const err = new RefundExceedsAmountError(500, 300, 'GBP');
      expect(err.message).toContain('500');
      expect(err.message).toContain('300');
      expect(err.message).toContain('GBP');
    });
  });

  describe('DuplicateOrderError', () => {
    it('includes idempotency key in message', () => {
      const err = new DuplicateOrderError('idem-key-001');
      expect(err.message).toContain('idem-key-001');
    });
  });

  describe('InventoryUnavailableError', () => {
    it('includes product and quantity info', () => {
      const err = new InventoryUnavailableError('prod-123', 5, 2);
      expect(err.message).toContain('prod-123');
      expect(err.message).toContain('5');
      expect(err.message).toContain('2');
    });
  });

  describe('isAppError', () => {
    it('returns true for AppError instances', () => {
      expect(isAppError(new AppError('CODE', 'msg'))).toBe(true);
      expect(isAppError(new OrderNotFoundError('id'))).toBe(true);
    });

    it('returns false for plain errors', () => {
      expect(isAppError(new Error('plain'))).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });

  describe('isOperationalError', () => {
    it('returns true for operational AppErrors', () => {
      expect(isOperationalError(new AppError('CODE', 'msg'))).toBe(true);
    });

    it('returns false for non-AppError', () => {
      expect(isOperationalError(new Error('plain'))).toBe(false);
    });
  });

  describe('toAppError', () => {
    it('returns AppError as-is', () => {
      const err = new AppError('CODE', 'msg');
      expect(toAppError(err)).toBe(err);
    });

    it('wraps plain Error in AppError', () => {
      const result = toAppError(new Error('plain error'));
      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe('plain error');
    });

    it('wraps unknown values in AppError', () => {
      const result = toAppError('string error');
      expect(isAppError(result)).toBe(true);
    });
  });
});