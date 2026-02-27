import { describe, it, expect } from '@jest/globals';
import { setupUnitTest } from '../../src/tests-helpers/setup';
import { generateInvoiceNumber } from '../../src/shared/utils';
import { INVOICE_CONSTANTS } from '../../src/shared/constants';
import { TAX_CALCULATION_KITCHEN_STANDARD, TAX_CALCULATION_BEDROOM_STANDARD, TAX_CALCULATION_WITH_DISCOUNT, INVOICE_ISSUED, ORDER_CONFIRMED } from '../../tests/fixtures';
import { calculateVat, roundToTwoDecimals } from '../../src/shared/utils';

setupUnitTest();

describe('Invoice Generator', () => {
  describe('generateInvoiceNumber', () => {
    it('generates invoice number with correct prefix', () => {
      const number = generateInvoiceNumber();
      expect(number.startsWith(INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX)).toBe(true);
    });

    it('generates unique invoice numbers', () => {
      const numbers = new Set(Array.from({ length: 20 }, () => generateInvoiceNumber()));
      expect(numbers.size).toBe(20);
    });

    it('generates number of expected length', () => {
      const number = generateInvoiceNumber();
      expect(number.length).toBeGreaterThanOrEqual(INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX.length + 4);
    });
  });

  describe('invoice financial calculations', () => {
    it('calculates total with standard VAT correctly for kitchen order', () => {
      const { subtotal, taxAmount, totalWithTax } = TAX_CALCULATION_KITCHEN_STANDARD;
      const computedVat = calculateVat(subtotal, INVOICE_CONSTANTS.VAT_RATE_STANDARD);
      const computedTotal = roundToTwoDecimals(subtotal + computedVat);
      expect(computedVat).toBe(taxAmount);
      expect(computedTotal).toBe(totalWithTax);
    });

    it('calculates total with standard VAT correctly for bedroom order', () => {
      const { subtotal, taxAmount, totalWithTax } = TAX_CALCULATION_BEDROOM_STANDARD;
      const computedVat = calculateVat(subtotal, INVOICE_CONSTANTS.VAT_RATE_STANDARD);
      expect(computedVat).toBe(taxAmount);
      expect(roundToTwoDecimals(subtotal + computedVat)).toBe(totalWithTax);
    });

    it('calculates total after discount correctly', () => {
      const { subtotal, taxAmount, totalWithTax } = TAX_CALCULATION_WITH_DISCOUNT;
      const computedVat = calculateVat(subtotal, INVOICE_CONSTANTS.VAT_RATE_STANDARD);
      expect(computedVat).toBe(taxAmount);
      expect(roundToTwoDecimals(subtotal + computedVat)).toBe(totalWithTax);
    });

    it('INVOICE_ISSUED totals match ORDER_CONFIRMED totals', () => {
      expect(INVOICE_ISSUED.subtotal).toBe(ORDER_CONFIRMED.subtotal);
      expect(INVOICE_ISSUED.taxAmount).toBe(ORDER_CONFIRMED.taxAmount);
      expect(INVOICE_ISSUED.totalAmount).toBe(ORDER_CONFIRMED.totalAmount);
    });

    it('dueAt is issuedAt + INVOICE_DUE_DAYS', () => {
      const issuedAt = INVOICE_ISSUED.issuedAt;
      const expectedDueAt = new Date(issuedAt);
      expectedDueAt.setDate(expectedDueAt.getDate() + INVOICE_CONSTANTS.INVOICE_DUE_DAYS);
      expect(INVOICE_ISSUED.dueAt.toDateString()).toBe(expectedDueAt.toDateString());
    });
  });
});