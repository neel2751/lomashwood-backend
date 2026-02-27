import { makeId, FIXED_DATE, UK_ADDRESS_LONDON, UK_ADDRESS_MANCHESTER, UK_ADDRESS_BIRMINGHAM } from './common.fixture';

export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'NEXT_DAY' | 'COLLECT_FROM_SHOWROOM' | 'HOME_MEASUREMENT';
export type ShippingStatus = 'ACTIVE' | 'INACTIVE';

export interface ShippingRateFixture {
  id: string;
  name: string;
  method: ShippingMethod;
  description: string;
  price: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  minimumOrderAmount: number | null;
  maximumOrderAmount: number | null;
  appliesToKitchen: boolean;
  appliesToBedroom: boolean;
  status: ShippingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingAddressValidationFixture {
  address: typeof UK_ADDRESS_LONDON;
  isValid: boolean;
  availableMethods: ShippingMethod[];
}

export const SHIPPING_RATE_FREE: ShippingRateFixture = {
  id: makeId(),
  name: 'Free Standard Delivery',
  method: 'STANDARD',
  description: 'Free delivery on all kitchen and bedroom orders',
  price: 0.00,
  currency: 'GBP',
  estimatedDaysMin: 14,
  estimatedDaysMax: 21,
  minimumOrderAmount: null,
  maximumOrderAmount: null,
  appliesToKitchen: true,
  appliesToBedroom: true,
  status: 'ACTIVE',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const SHIPPING_RATE_EXPRESS: ShippingRateFixture = {
  id: makeId(),
  name: 'Express Delivery',
  method: 'EXPRESS',
  description: 'Faster delivery — 7 to 10 working days',
  price: 149.00,
  currency: 'GBP',
  estimatedDaysMin: 7,
  estimatedDaysMax: 10,
  minimumOrderAmount: 1000,
  maximumOrderAmount: null,
  appliesToKitchen: true,
  appliesToBedroom: true,
  status: 'ACTIVE',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const SHIPPING_RATE_NEXT_DAY: ShippingRateFixture = {
  id: makeId(),
  name: 'Next Day Delivery',
  method: 'NEXT_DAY',
  description: 'Next working day delivery (order before 12pm)',
  price: 249.00,
  currency: 'GBP',
  estimatedDaysMin: 1,
  estimatedDaysMax: 1,
  minimumOrderAmount: 2000,
  maximumOrderAmount: null,
  appliesToKitchen: true,
  appliesToBedroom: false,
  status: 'ACTIVE',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const SHIPPING_RATE_SHOWROOM_COLLECT: ShippingRateFixture = {
  id: makeId(),
  name: 'Collect from Showroom',
  method: 'COLLECT_FROM_SHOWROOM',
  description: 'Collect your order from your nearest Lomash Wood showroom',
  price: 0.00,
  currency: 'GBP',
  estimatedDaysMin: 7,
  estimatedDaysMax: 14,
  minimumOrderAmount: null,
  maximumOrderAmount: null,
  appliesToKitchen: true,
  appliesToBedroom: true,
  status: 'ACTIVE',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const SHIPPING_RATE_HOME_MEASUREMENT: ShippingRateFixture = {
  id: makeId(),
  name: 'Home Measurement & Delivery',
  method: 'HOME_MEASUREMENT',
  description: 'Includes a home measurement appointment and white-glove delivery',
  price: 99.00,
  currency: 'GBP',
  estimatedDaysMin: 21,
  estimatedDaysMax: 42,
  minimumOrderAmount: 3000,
  maximumOrderAmount: null,
  appliesToKitchen: true,
  appliesToBedroom: true,
  status: 'ACTIVE',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const SHIPPING_RATE_INACTIVE: ShippingRateFixture = {
  id: makeId(),
  name: 'Saturday Delivery (Discontinued)',
  method: 'EXPRESS',
  description: 'Saturday delivery — no longer available',
  price: 199.00,
  currency: 'GBP',
  estimatedDaysMin: 1,
  estimatedDaysMax: 3,
  minimumOrderAmount: null,
  maximumOrderAmount: null,
  appliesToKitchen: true,
  appliesToBedroom: true,
  status: 'INACTIVE',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const SHIPPING_ADDRESS_VALID_LONDON: ShippingAddressValidationFixture = {
  address: UK_ADDRESS_LONDON,
  isValid: true,
  availableMethods: ['STANDARD', 'EXPRESS', 'NEXT_DAY', 'COLLECT_FROM_SHOWROOM', 'HOME_MEASUREMENT'],
};

export const SHIPPING_ADDRESS_VALID_MANCHESTER: ShippingAddressValidationFixture = {
  address: UK_ADDRESS_MANCHESTER,
  isValid: true,
  availableMethods: ['STANDARD', 'EXPRESS', 'COLLECT_FROM_SHOWROOM', 'HOME_MEASUREMENT'],
};

export const SHIPPING_ADDRESS_VALID_BIRMINGHAM: ShippingAddressValidationFixture = {
  address: UK_ADDRESS_BIRMINGHAM,
  isValid: true,
  availableMethods: ['STANDARD', 'EXPRESS', 'COLLECT_FROM_SHOWROOM', 'HOME_MEASUREMENT'],
};

export const ALL_SHIPPING_RATES: ShippingRateFixture[] = [
  SHIPPING_RATE_FREE,
  SHIPPING_RATE_EXPRESS,
  SHIPPING_RATE_NEXT_DAY,
  SHIPPING_RATE_SHOWROOM_COLLECT,
  SHIPPING_RATE_HOME_MEASUREMENT,
  SHIPPING_RATE_INACTIVE,
];

export const ACTIVE_SHIPPING_RATES = ALL_SHIPPING_RATES.filter((r) => r.status === 'ACTIVE');