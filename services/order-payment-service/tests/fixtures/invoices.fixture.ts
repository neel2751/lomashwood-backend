import { InvoiceStatus } from '../../src/shared/types';
import { INVOICE_CONSTANTS } from '../../src/shared/constants';
import {
  makeId,
  makeDate,
  FIXED_DATE,
  CUSTOMER_ID_1,
  CUSTOMER_ID_2,
  CUSTOMER_ID_3,
  CURRENCY_GBP,
} from './common.fixture';
import { PAYMENT_SUCCEEDED, PAYMENT_REFUNDED } from './payments.fixture';
import { ORDER_CONFIRMED, ORDER_REFUNDED, ORDER_WITH_COUPON } from './orders.fixture';

function makeDueDate(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + INVOICE_CONSTANTS.INVOICE_DUE_DAYS);
  return d;
}

export const INVOICE_ISSUED = {
  id: makeId(),
  orderId: ORDER_CONFIRMED.id,
  paymentId: PAYMENT_SUCCEEDED.id,
  customerId: CUSTOMER_ID_3,
  invoiceNumber: 'INV3K9X2M',
  status: InvoiceStatus.ISSUED,
  subtotal: 2499.00,
  shippingCost: 0.00,
  taxAmount: 499.80,
  discountAmount: 0.00,
  totalAmount: 2998.80,
  currency: CURRENCY_GBP,
  vatNumber: INVOICE_CONSTANTS.COMPANY_VAT_NUMBER,
  companyName: INVOICE_CONSTANTS.COMPANY_NAME,
  issuedAt: FIXED_DATE,
  dueAt: makeDueDate(FIXED_DATE),
  pdfUrl: 'https://cdn.lomashwood.co.uk/invoices/INV3K9X2M.pdf',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const INVOICE_PAID = {
  id: makeId(),
  orderId: ORDER_WITH_COUPON.id,
  paymentId: makeId(),
  customerId: CUSTOMER_ID_1,
  invoiceNumber: 'INV4P8Y1N',
  status: InvoiceStatus.PAID,
  subtotal: 2499.00,
  shippingCost: 0.00,
  taxAmount: 449.82,
  discountAmount: 249.90,
  totalAmount: 2698.92,
  currency: CURRENCY_GBP,
  vatNumber: INVOICE_CONSTANTS.COMPANY_VAT_NUMBER,
  companyName: INVOICE_CONSTANTS.COMPANY_NAME,
  issuedAt: makeDate(-1),
  dueAt: makeDueDate(makeDate(-1)),
  pdfUrl: 'https://cdn.lomashwood.co.uk/invoices/INV4P8Y1N.pdf',
  createdAt: makeDate(-1),
  updatedAt: FIXED_DATE,
};

export const INVOICE_VOID = {
  id: makeId(),
  orderId: ORDER_REFUNDED.id,
  paymentId: PAYMENT_REFUNDED.id,
  customerId: CUSTOMER_ID_3,
  invoiceNumber: 'INV5Q7Z3R',
  status: InvoiceStatus.VOID,
  subtotal: 3199.00,
  shippingCost: 0.00,
  taxAmount: 639.80,
  discountAmount: 0.00,
  totalAmount: 3838.80,
  currency: CURRENCY_GBP,
  vatNumber: INVOICE_CONSTANTS.COMPANY_VAT_NUMBER,
  companyName: INVOICE_CONSTANTS.COMPANY_NAME,
  issuedAt: makeDate(-10),
  dueAt: makeDueDate(makeDate(-10)),
  pdfUrl: 'https://cdn.lomashwood.co.uk/invoices/INV5Q7Z3R.pdf',
  createdAt: makeDate(-10),
  updatedAt: makeDate(-2),
};

export const INVOICE_DRAFT = {
  id: makeId(),
  orderId: makeId(),
  paymentId: null,
  customerId: CUSTOMER_ID_2,
  invoiceNumber: 'INV6R5V4S',
  status: InvoiceStatus.DRAFT,
  subtotal: 3199.00,
  shippingCost: 0.00,
  taxAmount: 639.80,
  discountAmount: 0.00,
  totalAmount: 3838.80,
  currency: CURRENCY_GBP,
  vatNumber: INVOICE_CONSTANTS.COMPANY_VAT_NUMBER,
  companyName: INVOICE_CONSTANTS.COMPANY_NAME,
  issuedAt: null,
  dueAt: null,
  pdfUrl: null,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const INVOICE_NO_PDF = {
  id: makeId(),
  orderId: makeId(),
  paymentId: makeId(),
  customerId: CUSTOMER_ID_1,
  invoiceNumber: 'INV7S4U5T',
  status: InvoiceStatus.ISSUED,
  subtotal: 2499.00,
  shippingCost: 0.00,
  taxAmount: 499.80,
  discountAmount: 0.00,
  totalAmount: 2998.80,
  currency: CURRENCY_GBP,
  vatNumber: INVOICE_CONSTANTS.COMPANY_VAT_NUMBER,
  companyName: INVOICE_CONSTANTS.COMPANY_NAME,
  issuedAt: FIXED_DATE,
  dueAt: makeDueDate(FIXED_DATE),
  pdfUrl: null,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const ALL_INVOICES = [
  INVOICE_ISSUED,
  INVOICE_PAID,
  INVOICE_VOID,
  INVOICE_DRAFT,
  INVOICE_NO_PDF,
];