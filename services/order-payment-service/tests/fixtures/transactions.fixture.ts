import {
  makeId,
  makeDate,
  FIXED_DATE,
  CURRENCY_GBP,
} from './common.fixture';
import { PAYMENT_SUCCEEDED, PAYMENT_REFUNDED, PAYMENT_PARTIALLY_REFUNDED } from './payments.fixture';
import { REFUND_FULL_SUCCEEDED, REFUND_PARTIAL_SUCCEEDED } from './refunds.fixture';

export type TransactionType = 'CHARGE' | 'REFUND' | 'ADJUSTMENT' | 'PAYOUT';
export type TransactionStatus = 'PENDING' | 'AVAILABLE' | 'HELD' | 'FAILED';

export const TRANSACTION_CHARGE_SUCCEEDED = {
  id: makeId(),
  paymentId: PAYMENT_SUCCEEDED.id,
  orderId: PAYMENT_SUCCEEDED.orderId,
  stripeBalanceTransactionId: PAYMENT_SUCCEEDED.stripeBalanceTransactionId,
  stripeChargeId: PAYMENT_SUCCEEDED.stripeChargeId,
  type: 'CHARGE' as TransactionType,
  status: 'AVAILABLE' as TransactionStatus,
  amount: 2998.80,
  fee: 87.16,
  net: 2911.64,
  currency: CURRENCY_GBP,
  exchangeRate: null,
  availableOn: makeDate(2),
  description: `Charge for order ${PAYMENT_SUCCEEDED.orderId}`,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const TRANSACTION_CHARGE_PENDING = {
  id: makeId(),
  paymentId: makeId(),
  orderId: makeId(),
  stripeBalanceTransactionId: 'txn_3OxKpLF1234567890PEND',
  stripeChargeId: 'ch_3OxKpLF1234567890PEND',
  type: 'CHARGE' as TransactionType,
  status: 'PENDING' as TransactionStatus,
  amount: 6837.60,
  fee: 198.29,
  net: 6639.31,
  currency: CURRENCY_GBP,
  exchangeRate: null,
  availableOn: makeDate(3),
  description: 'Pending charge — awaiting settlement',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const TRANSACTION_REFUND_FULL = {
  id: makeId(),
  paymentId: PAYMENT_REFUNDED.id,
  orderId: PAYMENT_REFUNDED.orderId,
  refundId: REFUND_FULL_SUCCEEDED.id,
  stripeBalanceTransactionId: 'txn_refund_3OxKpLF1234567890ABCD',
  stripeChargeId: PAYMENT_REFUNDED.stripeChargeId,
  type: 'REFUND' as TransactionType,
  status: 'AVAILABLE' as TransactionStatus,
  amount: -3838.80,
  fee: -87.16,
  net: -3751.64,
  currency: CURRENCY_GBP,
  exchangeRate: null,
  availableOn: makeDate(-1),
  description: 'Full refund — customer request',
  createdAt: makeDate(-2),
  updatedAt: makeDate(-2),
};

export const TRANSACTION_REFUND_PARTIAL = {
  id: makeId(),
  paymentId: PAYMENT_PARTIALLY_REFUNDED.id,
  orderId: PAYMENT_PARTIALLY_REFUNDED.orderId,
  refundId: REFUND_PARTIAL_SUCCEEDED.id,
  stripeBalanceTransactionId: 'txn_refund_3OxKpLF1234567890BCDE',
  stripeChargeId: PAYMENT_PARTIALLY_REFUNDED.stripeChargeId,
  type: 'REFUND' as TransactionType,
  status: 'AVAILABLE' as TransactionStatus,
  amount: -3199.00,
  fee: -92.77,
  net: -3106.23,
  currency: CURRENCY_GBP,
  exchangeRate: null,
  availableOn: makeDate(0),
  description: 'Partial refund — product unavailable',
  createdAt: makeDate(-1),
  updatedAt: makeDate(-1),
};

export const TRANSACTION_ADJUSTMENT = {
  id: makeId(),
  paymentId: makeId(),
  orderId: null,
  refundId: null,
  stripeBalanceTransactionId: 'txn_3OxKpLF1234567890ADJ1',
  stripeChargeId: null,
  type: 'ADJUSTMENT' as TransactionType,
  status: 'AVAILABLE' as TransactionStatus,
  amount: -15.00,
  fee: 0,
  net: -15.00,
  currency: CURRENCY_GBP,
  exchangeRate: null,
  availableOn: FIXED_DATE,
  description: 'Stripe fee adjustment',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const TRANSACTION_DISPUTED = {
  id: makeId(),
  paymentId: makeId(),
  orderId: makeId(),
  refundId: null,
  stripeBalanceTransactionId: 'txn_3OxKpLF1234567890DISP',
  stripeChargeId: 'ch_3OxKpLF1234567890DISP',
  type: 'CHARGE' as TransactionType,
  status: 'HELD' as TransactionStatus,
  amount: 2499.00,
  fee: 72.47,
  net: 2426.53,
  currency: CURRENCY_GBP,
  exchangeRate: null,
  availableOn: null,
  description: 'Charge held — dispute opened',
  createdAt: makeDate(-4),
  updatedAt: makeDate(-1),
};

export const ALL_TRANSACTIONS = [
  TRANSACTION_CHARGE_SUCCEEDED,
  TRANSACTION_CHARGE_PENDING,
  TRANSACTION_REFUND_FULL,
  TRANSACTION_REFUND_PARTIAL,
  TRANSACTION_ADJUSTMENT,
  TRANSACTION_DISPUTED,
];