import {
  makeId,
  makeDate,
  makeFutureDate,
  makePastDate,
  FIXED_DATE,
  PRODUCT_ID_KITCHEN_1,
  PRODUCT_ID_BEDROOM_1,
} from './common.fixture';

export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'DEPLETED' | 'DISABLED';

export interface CouponFixture {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  appliesToCategoryKitchen: boolean;
  appliesToCategoryBedroom: boolean;
  restrictedProductIds: string[];
  status: CouponStatus;
  validFrom: Date;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const COUPON_PERCENTAGE_10: CouponFixture = {
  id: makeId(),
  code: 'LOMASH10',
  description: '10% off your entire order',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minimumOrderAmount: 500,
  maximumDiscountAmount: 500,
  usageLimit: 1000,
  usageCount: 47,
  perCustomerLimit: 1,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [],
  status: 'ACTIVE',
  validFrom: makeDate(-30),
  validUntil: makeFutureDate(60 * 24 * 30),
  createdAt: makeDate(-30),
  updatedAt: FIXED_DATE,
};

export const COUPON_FIXED_250: CouponFixture = {
  id: makeId(),
  code: 'SAVE250',
  description: '£250 off orders over £2,000',
  discountType: 'FIXED',
  discountValue: 250,
  minimumOrderAmount: 2000,
  maximumDiscountAmount: 250,
  usageLimit: 500,
  usageCount: 112,
  perCustomerLimit: 1,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [],
  status: 'ACTIVE',
  validFrom: makeDate(-60),
  validUntil: makeFutureDate(60 * 24 * 14),
  createdAt: makeDate(-60),
  updatedAt: FIXED_DATE,
};

export const COUPON_KITCHEN_ONLY: CouponFixture = {
  id: makeId(),
  code: 'KITCHEN15',
  description: '15% off kitchen orders',
  discountType: 'PERCENTAGE',
  discountValue: 15,
  minimumOrderAmount: 1000,
  maximumDiscountAmount: 750,
  usageLimit: 200,
  usageCount: 38,
  perCustomerLimit: 1,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: false,
  restrictedProductIds: [],
  status: 'ACTIVE',
  validFrom: makeDate(-14),
  validUntil: makeFutureDate(60 * 24 * 7),
  createdAt: makeDate(-14),
  updatedAt: FIXED_DATE,
};

export const COUPON_BEDROOM_ONLY: CouponFixture = {
  id: makeId(),
  code: 'BEDROOM20',
  description: '20% off bedroom orders',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  minimumOrderAmount: 1500,
  maximumDiscountAmount: 600,
  usageLimit: 150,
  usageCount: 29,
  perCustomerLimit: 1,
  appliesToCategoryKitchen: false,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [],
  status: 'ACTIVE',
  validFrom: makeDate(-7),
  validUntil: makeFutureDate(60 * 24 * 21),
  createdAt: makeDate(-7),
  updatedAt: FIXED_DATE,
};

export const COUPON_EXPIRED: CouponFixture = {
  id: makeId(),
  code: 'SUMMER24',
  description: 'Summer 2024 promotion — 12% off',
  discountType: 'PERCENTAGE',
  discountValue: 12,
  minimumOrderAmount: null,
  maximumDiscountAmount: null,
  usageLimit: 300,
  usageCount: 300,
  perCustomerLimit: 1,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [],
  status: 'EXPIRED',
  validFrom: makeDate(-180),
  validUntil: makePastDate(60 * 24 * 30),
  createdAt: makeDate(-180),
  updatedAt: makePastDate(60 * 24 * 30),
};

export const COUPON_DEPLETED: CouponFixture = {
  id: makeId(),
  code: 'FLASH100',
  description: 'Flash sale — £100 off (limited)',
  discountType: 'FIXED',
  discountValue: 100,
  minimumOrderAmount: 800,
  maximumDiscountAmount: 100,
  usageLimit: 50,
  usageCount: 50,
  perCustomerLimit: 1,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [],
  status: 'DEPLETED',
  validFrom: makeDate(-5),
  validUntil: makeFutureDate(60 * 24 * 5),
  createdAt: makeDate(-5),
  updatedAt: FIXED_DATE,
};

export const COUPON_PRODUCT_RESTRICTED: CouponFixture = {
  id: makeId(),
  code: 'LUNA5',
  description: '5% off Luna and Oxford ranges',
  discountType: 'PERCENTAGE',
  discountValue: 5,
  minimumOrderAmount: null,
  maximumDiscountAmount: 200,
  usageLimit: null,
  usageCount: 7,
  perCustomerLimit: null,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [PRODUCT_ID_KITCHEN_1, PRODUCT_ID_BEDROOM_1],
  status: 'ACTIVE',
  validFrom: makeDate(-3),
  validUntil: null,
  createdAt: makeDate(-3),
  updatedAt: FIXED_DATE,
};

export const COUPON_DISABLED: CouponFixture = {
  id: makeId(),
  code: 'DISABLED01',
  description: 'Manually disabled coupon',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minimumOrderAmount: null,
  maximumDiscountAmount: null,
  usageLimit: 100,
  usageCount: 0,
  perCustomerLimit: null,
  appliesToCategoryKitchen: true,
  appliesToCategoryBedroom: true,
  restrictedProductIds: [],
  status: 'DISABLED',
  validFrom: FIXED_DATE,
  validUntil: makeFutureDate(60 * 24 * 30),
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const ALL_COUPONS: CouponFixture[] = [
  COUPON_PERCENTAGE_10,
  COUPON_FIXED_250,
  COUPON_KITCHEN_ONLY,
  COUPON_BEDROOM_ONLY,
  COUPON_EXPIRED,
  COUPON_DEPLETED,
  COUPON_PRODUCT_RESTRICTED,
  COUPON_DISABLED,
];

export const ACTIVE_COUPONS = ALL_COUPONS.filter((c) => c.status === 'ACTIVE');
export const INVALID_COUPONS = ALL_COUPONS.filter((c) => c.status !== 'ACTIVE');