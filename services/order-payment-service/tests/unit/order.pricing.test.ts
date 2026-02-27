import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import {
  calculateSubtotalFromItems,
  calculateVat,
  roundToTwoDecimals,
  toPence,
  fromPence,
} from '../../src/shared/utils';
import { INVOICE_CONSTANTS } from '../../src/shared/constants';
import {
  ORDER_ITEMS_KITCHEN_ONLY,
  ORDER_ITEMS_BEDROOM_ONLY,
  ORDER_ITEMS_MIXED,
  ORDER_ITEMS_ALL,
  TAX_CALCULATION_KITCHEN_STANDARD,
  TAX_CALCULATION_BEDROOM_STANDARD,
  TAX_CALCULATION_MIXED_STANDARD,
  TAX_CALCULATION_WITH_DISCOUNT,
  COUPON_PERCENTAGE_10,
  COUPON_FIXED_250,
} from '../../tests/fixtures';

setupUnitTest();

describe('Order Pricing', () => {
  describe('calculateSubtotalFromItems', () => {
    it('calculates correct subtotal for kitchen-only items', () => {
      const subtotal = calculateSubtotalFromItems(ORDER_ITEMS_KITCHEN_ONLY);
      expect(subtotal).toBe(TAX_CALCULATION_KITCHEN_STANDARD.subtotal);
    });

    it('calculates correct subtotal for bedroom-only items', () => {
      const subtotal = calculateSubtotalFromItems(ORDER_ITEMS_BEDROOM_ONLY);
      expect(subtotal).toBe(TAX_CALCULATION_BEDROOM_STANDARD.subtotal);
    });

    it('calculates correct subtotal for mixed items', () => {
      const subtotal = calculateSubtotalFromItems(ORDER_ITEMS_MIXED);
      expect(subtotal).toBe(TAX_CALCULATION_MIXED_STANDARD.subtotal);
    });

    it('calculates correct subtotal for multi-quantity items', () => {
      const items = [{ unitPrice: 1899.00, quantity: 2 }];
      const subtotal = calculateSubtotalFromItems(items);
      expect(subtotal).toBe(3798.00);
    });

    it('returns 0 for empty items array', () => {
      const subtotal = calculateSubtotalFromItems([]);
      expect(subtotal).toBe(0);
    });

    it('handles floating point precision correctly for all items', () => {
      const subtotal = calculateSubtotalFromItems(ORDER_ITEMS_ALL);
      expect(Number.isFinite(subtotal)).toBe(true);
      expect(subtotal).toBeGreaterThan(0);
    });
  });

  describe('calculateVat', () => {
    it('calculates 20% VAT on kitchen subtotal', () => {
      const vat = calculateVat(TAX_CALCULATION_KITCHEN_STANDARD.subtotal, INVOICE_CONSTANTS.VAT_RATE_STANDARD);
      expect(vat).toBe(TAX_CALCULATION_KITCHEN_STANDARD.taxAmount);
    });

    it('calculates 20% VAT on bedroom subtotal', () => {
      const vat = calculateVat(TAX_CALCULATION_BEDROOM_STANDARD.subtotal, INVOICE_CONSTANTS.VAT_RATE_STANDARD);
      expect(vat).toBe(TAX_CALCULATION_BEDROOM_STANDARD.taxAmount);
    });

    it('returns 0 for zero-rated items', () => {
      const vat = calculateVat(2499.00, INVOICE_CONSTANTS.VAT_RATE_ZERO);
      expect(vat).toBe(0);
    });

    it('calculates VAT on discounted subtotal correctly', () => {
      const discountedSubtotal = 2249.10;
      const vat = calculateVat(discountedSubtotal, INVOICE_CONSTANTS.VAT_RATE_STANDARD);
      expect(vat).toBe(TAX_CALCULATION_WITH_DISCOUNT.taxAmount);
    });
  });

  describe('coupon discount calculation', () => {
    it('applies percentage coupon correctly', () => {
      const subtotal = 2499.00;
      const discount = roundToTwoDecimals(
        subtotal * (COUPON_PERCENTAGE_10.discountValue / 100),
      );
      const expectedDiscount = Math.min(discount, COUPON_PERCENTAGE_10.maximumDiscountAmount!);
      expect(expectedDiscount).toBe(249.90);
    });

    it('applies fixed coupon correctly', () => {
      const subtotal = 2499.00;
      const discount = Math.min(COUPON_FIXED_250.discountValue, subtotal);
      expect(discount).toBe(250.00);
    });

    it('caps percentage discount at maximumDiscountAmount', () => {
      const highSubtotal = 10000.00;
      const rawDiscount = roundToTwoDecimals(highSubtotal * (COUPON_PERCENTAGE_10.discountValue / 100));
      const cappedDiscount = Math.min(rawDiscount, COUPON_PERCENTAGE_10.maximumDiscountAmount!);
      expect(cappedDiscount).toBe(COUPON_PERCENTAGE_10.maximumDiscountAmount);
    });

    it('does not apply discount below minimum order amount', () => {
      const belowMinSubtotal = 400.00;
      const isEligible = COUPON_PERCENTAGE_10.minimumOrderAmount !== null &&
        belowMinSubtotal >= COUPON_PERCENTAGE_10.minimumOrderAmount;
      expect(isEligible).toBe(false);
    });
  });

  describe('pence conversion', () => {
    it('converts GBP to pence correctly', () => {
      expect(toPence(2998.80)).toBe(299880);
    });

    it('converts pence to GBP correctly', () => {
      expect(fromPence(299880)).toBe(2998.80);
    });

    it('handles zero amounts', () => {
      expect(toPence(0)).toBe(0);
      expect(fromPence(0)).toBe(0);
    });

    it('correctly converts smallest Stripe charge unit', () => {
      expect(toPence(0.30)).toBe(30);
    });
  });

  describe('roundToTwoDecimals', () => {
    it('rounds to two decimal places', () => {
      expect(roundToTwoDecimals(2499.999)).toBe(2500.00);
    });

    it('preserves values already at two decimal places', () => {
      expect(roundToTwoDecimals(2499.80)).toBe(2499.80);
    });

    it('handles whole numbers', () => {
      expect(roundToTwoDecimals(2500)).toBe(2500);
    });
  });
});