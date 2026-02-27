import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { createOrderSchema, cancelOrderSchema, updateOrderStatusSchema } from '../../src/app/orders/order.schemas';
import { UK_ADDRESS_LONDON, ORDER_ITEMS_KITCHEN_ONLY } from '../../tests/fixtures';

setupUnitTest();

describe('Order Validators', () => {
  describe('createOrderSchema', () => {
    const validPayload = {
      items: ORDER_ITEMS_KITCHEN_ONLY.map((i) => ({
        productId: i.productId,
        colourId: i.colourId,
        sizeId: i.sizeId,
        quantity: i.quantity,
      })),
      shippingAddress: UK_ADDRESS_LONDON,
      billingAddress: UK_ADDRESS_LONDON,
      couponCode: null,
      appointmentId: null,
    };

    it('validates a correct create order payload', () => {
      const result = createOrderSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects empty items array', () => {
      const result = createOrderSchema.safeParse({ ...validPayload, items: [] });
      expect(result.success).toBe(false);
    });

    it('rejects item with zero quantity', () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        items: [{ ...validPayload.items[0], quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects item with negative quantity', () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        items: [{ ...validPayload.items[0], quantity: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing shippingAddress', () => {
      const { shippingAddress: _, ...rest } = validPayload;
      const result = createOrderSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid postcode in address', () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        shippingAddress: { ...UK_ADDRESS_LONDON, postcode: 'INVALID' },
      });
      expect(result.success).toBe(false);
    });

    it('accepts null couponCode', () => {
      const result = createOrderSchema.safeParse({ ...validPayload, couponCode: null });
      expect(result.success).toBe(true);
    });

    it('rejects couponCode that is an empty string', () => {
      const result = createOrderSchema.safeParse({ ...validPayload, couponCode: '' });
      expect(result.success).toBe(false);
    });

    it('rejects items exceeding max per order limit', () => {
      const tooManyItems = Array.from({ length: 51 }, () => validPayload.items[0]);
      const result = createOrderSchema.safeParse({ ...validPayload, items: tooManyItems });
      expect(result.success).toBe(false);
    });
  });

  describe('cancelOrderSchema', () => {
    it('validates a correct cancel payload', () => {
      const result = cancelOrderSchema.safeParse({ reason: 'CUSTOMER_REQUEST', note: null });
      expect(result.success).toBe(true);
    });

    it('rejects unknown cancellation reason', () => {
      const result = cancelOrderSchema.safeParse({ reason: 'UNKNOWN_REASON', note: null });
      expect(result.success).toBe(false);
    });

    it('accepts optional note string', () => {
      const result = cancelOrderSchema.safeParse({ reason: 'CUSTOMER_REQUEST', note: 'Changed mind' });
      expect(result.success).toBe(true);
    });

    it('rejects missing reason', () => {
      const result = cancelOrderSchema.safeParse({ note: 'Changed mind' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('validates a known order status', () => {
      const result = updateOrderStatusSchema.safeParse({ status: 'CONFIRMED' });
      expect(result.success).toBe(true);
    });

    it('rejects unknown status string', () => {
      const result = updateOrderStatusSchema.safeParse({ status: 'UNKNOWN_STATUS' });
      expect(result.success).toBe(false);
    });

    it('rejects missing status field', () => {
      const result = updateOrderStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});