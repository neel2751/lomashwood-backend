import { makeId, FIXED_DATE } from './common.fixture';
import { INVOICE_CONSTANTS } from '../../src/shared/constants';

export type TaxType = 'VAT' | 'SALES_TAX' | 'GST';
export type TaxRateCategory = 'STANDARD' | 'REDUCED' | 'ZERO' | 'EXEMPT';

export interface TaxRateFixture {
  id: string;
  name: string;
  code: string;
  type: TaxType;
  category: TaxRateCategory;
  rate: number;
  country: string;
  region: string | null;
  appliesToKitchen: boolean;
  appliesToBedroom: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxCalculationFixture {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
  currency: string;
}

export const TAX_RATE_UK_VAT_STANDARD: TaxRateFixture = {
  id: makeId(),
  name: 'UK VAT Standard Rate',
  code: 'GB_VAT_20',
  type: 'VAT',
  category: 'STANDARD',
  rate: INVOICE_CONSTANTS.VAT_RATE_STANDARD,
  country: 'GB',
  region: null,
  appliesToKitchen: true,
  appliesToBedroom: true,
  isDefault: true,
  isActive: true,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const TAX_RATE_UK_VAT_ZERO: TaxRateFixture = {
  id: makeId(),
  name: 'UK VAT Zero Rate',
  code: 'GB_VAT_0',
  type: 'VAT',
  category: 'ZERO',
  rate: INVOICE_CONSTANTS.VAT_RATE_ZERO,
  country: 'GB',
  region: null,
  appliesToKitchen: false,
  appliesToBedroom: false,
  isDefault: false,
  isActive: true,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const TAX_RATE_EXEMPT: TaxRateFixture = {
  id: makeId(),
  name: 'Tax Exempt',
  code: 'EXEMPT',
  type: 'VAT',
  category: 'EXEMPT',
  rate: 0,
  country: 'GB',
  region: null,
  appliesToKitchen: false,
  appliesToBedroom: false,
  isDefault: false,
  isActive: true,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const TAX_CALCULATION_KITCHEN_STANDARD: TaxCalculationFixture = {
  subtotal: 2499.00,
  taxRate: INVOICE_CONSTANTS.VAT_RATE_STANDARD,
  taxAmount: 499.80,
  totalWithTax: 2998.80,
  currency: 'GBP',
};

export const TAX_CALCULATION_BEDROOM_STANDARD: TaxCalculationFixture = {
  subtotal: 3199.00,
  taxRate: INVOICE_CONSTANTS.VAT_RATE_STANDARD,
  taxAmount: 639.80,
  totalWithTax: 3838.80,
  currency: 'GBP',
};

export const TAX_CALCULATION_MIXED_STANDARD: TaxCalculationFixture = {
  subtotal: 5698.00,
  taxRate: INVOICE_CONSTANTS.VAT_RATE_STANDARD,
  taxAmount: 1139.60,
  totalWithTax: 6837.60,
  currency: 'GBP',
};

export const TAX_CALCULATION_WITH_DISCOUNT: TaxCalculationFixture = {
  subtotal: 2249.10,
  taxRate: INVOICE_CONSTANTS.VAT_RATE_STANDARD,
  taxAmount: 449.82,
  totalWithTax: 2698.92,
  currency: 'GBP',
};

export const TAX_CALCULATION_ZERO_RATED: TaxCalculationFixture = {
  subtotal: 2499.00,
  taxRate: INVOICE_CONSTANTS.VAT_RATE_ZERO,
  taxAmount: 0,
  totalWithTax: 2499.00,
  currency: 'GBP',
};

export const ALL_TAX_RATES: TaxRateFixture[] = [
  TAX_RATE_UK_VAT_STANDARD,
  TAX_RATE_UK_VAT_ZERO,
  TAX_RATE_EXEMPT,
];

export const TAX_CALCULATIONS: TaxCalculationFixture[] = [
  TAX_CALCULATION_KITCHEN_STANDARD,
  TAX_CALCULATION_BEDROOM_STANDARD,
  TAX_CALCULATION_MIXED_STANDARD,
  TAX_CALCULATION_WITH_DISCOUNT,
  TAX_CALCULATION_ZERO_RATED,
];