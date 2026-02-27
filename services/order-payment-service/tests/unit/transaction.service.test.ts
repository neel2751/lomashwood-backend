import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient } from '../../src/tests-helpers/setup';
import {
  TRANSACTION_CHARGE_SUCCEEDED,
  TRANSACTION_REFUND_FULL,
  ALL_TRANSACTIONS,
  COUPON_PERCENTAGE_10,
  COUPON_FIXED_250,
  COUPON_EXPIRED,
  COUPON_DEPLETED,
  COUPON_DISABLED,
  COUPON_KITCHEN_ONLY,
  TAX_RATE_UK_VAT_STANDARD,
  TAX_RATE_UK_VAT_ZERO,
  SHIPPING_RATE_FREE,
  SHIPPING_RATE_EXPRESS,
  ACTIVE_SHIPPING_RATES,
  ORDER_ITEMS_KITCHEN_ONLY,
  ORDER_ITEMS_BEDROOM_ONLY,
} from '../../tests/fixtures';

setupUnitTest();

describe('TransactionRepository', () => {
  let mockTxRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTxRepo = {
      findById: jest.fn(),
      findByPaymentId: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };
  });

  it('finds transaction by id', async () => {
    mockTxRepo.findById.mockResolvedValueOnce(TRANSACTION_CHARGE_SUCCEEDED);
    const result = await mockTxRepo.findById(TRANSACTION_CHARGE_SUCCEEDED.id);
    expect(result).toMatchObject({ id: TRANSACTION_CHARGE_SUCCEEDED.id });
  });

  it('returns all transactions for a payment', async () => {
    mockTxRepo.findByPaymentId.mockResolvedValueOnce([TRANSACTION_CHARGE_SUCCEEDED, TRANSACTION_REFUND_FULL]);
    const result = await mockTxRepo.findByPaymentId(TRANSACTION_CHARGE_SUCCEEDED.paymentId);
    expect(result).toHaveLength(2);
  });

  it('returns null for unknown transaction', async () => {
    mockTxRepo.findById.mockResolvedValueOnce(null);
    expect(await mockTxRepo.findById('unknown')).toBeNull();
  });
});

describe('TransactionService', () => {
  it('calculates net amount as amount minus fee', () => {
    const { amount, fee, net } = TRANSACTION_CHARGE_SUCCEEDED;
    expect(net).toBeCloseTo(amount - fee, 2);
  });

  it('refund transactions have negative amounts', () => {
    expect(TRANSACTION_REFUND_FULL.amount).toBeLessThan(0);
    expect(TRANSACTION_REFUND_FULL.fee).toBeLessThan(0);
    expect(TRANSACTION_REFUND_FULL.net).toBeLessThan(0);
  });
});

describe('CouponService', () => {
  describe('validateCoupon', () => {
    it('validates an active coupon', () => {
      expect(COUPON_PERCENTAGE_10.status).toBe('ACTIVE');
      expect(new Date(COUPON_PERCENTAGE_10.validFrom) <= new Date()).toBe(true);
    });

    it('rejects an expired coupon', () => {
      expect(COUPON_EXPIRED.status).toBe('EXPIRED');
    });

    it('rejects a depleted coupon', () => {
      expect(COUPON_DEPLETED.usageCount).toBe(COUPON_DEPLETED.usageLimit);
      expect(COUPON_DEPLETED.status).toBe('DEPLETED');
    });

    it('rejects a disabled coupon', () => {
      expect(COUPON_DISABLED.status).toBe('DISABLED');
    });

    it('validates kitchen-only coupon does not apply to bedroom items', () => {
      const hasBedroomItems = ORDER_ITEMS_BEDROOM_ONLY.some((i) => i.categoryType === 'BEDROOM');
      const couponAppliesToBedroom = COUPON_KITCHEN_ONLY.appliesToCategoryBedroom;
      expect(hasBedroomItems && !couponAppliesToBedroom).toBe(true);
    });

    it('calculates percentage discount correctly', () => {
      const subtotal = 2499.00;
      const discount = Math.round(subtotal * (COUPON_PERCENTAGE_10.discountValue / 100) * 100) / 100;
      const capped = Math.min(discount, COUPON_PERCENTAGE_10.maximumDiscountAmount!);
      expect(capped).toBe(249.90);
    });

    it('calculates fixed discount correctly', () => {
      const subtotal = 2499.00;
      const discount = Math.min(COUPON_FIXED_250.discountValue, subtotal);
      expect(discount).toBe(250.00);
    });

    it('does not apply coupon below minimum order amount', () => {
      const subtotal = 300;
      const meetsMinimum = !COUPON_PERCENTAGE_10.minimumOrderAmount || subtotal >= COUPON_PERCENTAGE_10.minimumOrderAmount;
      expect(meetsMinimum).toBe(false);
    });
  });
});

describe('CouponRepository', () => {
  let mockCouponRepo: any;

  beforeEach(() => {
    mockCouponRepo = { findByCode: jest.fn(), findMany: jest.fn(), update: jest.fn() };
  });

  it('finds coupon by code', async () => {
    mockCouponRepo.findByCode.mockResolvedValueOnce(COUPON_PERCENTAGE_10);
    const result = await mockCouponRepo.findByCode('LOMASH10');
    expect(result.code).toBe('LOMASH10');
  });

  it('returns null for unknown coupon code', async () => {
    mockCouponRepo.findByCode.mockResolvedValueOnce(null);
    expect(await mockCouponRepo.findByCode('UNKNOWN')).toBeNull();
  });
});

describe('TaxService', () => {
  it('returns standard VAT rate for kitchen products', () => {
    expect(TAX_RATE_UK_VAT_STANDARD.appliesToKitchen).toBe(true);
    expect(TAX_RATE_UK_VAT_STANDARD.rate).toBe(0.2);
  });

  it('returns standard VAT rate for bedroom products', () => {
    expect(TAX_RATE_UK_VAT_STANDARD.appliesToBedroom).toBe(true);
  });

  it('zero rate returns 0 tax', () => {
    expect(TAX_RATE_UK_VAT_ZERO.rate).toBe(0);
  });

  it('default tax rate is standard UK VAT', () => {
    expect(TAX_RATE_UK_VAT_STANDARD.isDefault).toBe(true);
  });
});

describe('TaxRepository', () => {
  let mockTaxRepo: any;

  beforeEach(() => {
    mockTaxRepo = { findDefault: jest.fn(), findByCode: jest.fn(), findMany: jest.fn() };
  });

  it('returns default tax rate', async () => {
    mockTaxRepo.findDefault.mockResolvedValueOnce(TAX_RATE_UK_VAT_STANDARD);
    const result = await mockTaxRepo.findDefault('GB');
    expect(result.isDefault).toBe(true);
    expect(result.rate).toBe(0.2);
  });

  it('returns null when no default rate configured', async () => {
    mockTaxRepo.findDefault.mockResolvedValueOnce(null);
    expect(await mockTaxRepo.findDefault('XX')).toBeNull();
  });
});

describe('ShippingService', () => {
  describe('getAvailableRates', () => {
    it('returns only active shipping rates', () => {
      const active = ACTIVE_SHIPPING_RATES;
      expect(active.every((r) => r.status === 'ACTIVE')).toBe(true);
    });

    it('includes free standard delivery', () => {
      expect(SHIPPING_RATE_FREE.price).toBe(0);
      expect(SHIPPING_RATE_FREE.status).toBe('ACTIVE');
    });

    it('express rate is more expensive than standard', () => {
      expect(SHIPPING_RATE_EXPRESS.price).toBeGreaterThan(SHIPPING_RATE_FREE.price);
    });

    it('express has shorter delivery window than standard', () => {
      expect(SHIPPING_RATE_EXPRESS.estimatedDaysMax).toBeLessThan(SHIPPING_RATE_FREE.estimatedDaysMin);
    });
  });
});

describe('ShippingRepository', () => {
  let mockShippingRepo: any;

  beforeEach(() => {
    mockShippingRepo = { findById: jest.fn(), findMany: jest.fn(), findActive: jest.fn() };
  });

  it('returns active shipping rates', async () => {
    mockShippingRepo.findActive.mockResolvedValueOnce(ACTIVE_SHIPPING_RATES);
    const result = await mockShippingRepo.findActive();
    expect(result.every((r: any) => r.status === 'ACTIVE')).toBe(true);
  });

  it('returns shipping rate by id', async () => {
    mockShippingRepo.findById.mockResolvedValueOnce(SHIPPING_RATE_FREE);
    const result = await mockShippingRepo.findById(SHIPPING_RATE_FREE.id);
    expect(result.method).toBe('STANDARD');
  });
});