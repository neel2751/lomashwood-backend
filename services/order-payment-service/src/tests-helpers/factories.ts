import { randomBytes, randomUUID } from 'crypto';
import {
  OrderStatus,
  PaymentStatus,
  RefundStatus,
  InvoiceStatus,
  CategoryType,
  PaymentGateway,
  PaymentMethod,
  RefundType,
  Address,
} from '../shared/types';
import {
  ORDER_CONSTANTS,
  INVOICE_CONSTANTS,
} from '../shared/constants';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomHex(bytes = 8): string {
  return randomBytes(bytes).toString('hex');
}

function randomOrderNumber(): string {
  return `${ORDER_CONSTANTS.ORDER_NUMBER_PREFIX}${Date.now().toString(36).toUpperCase()}${randomHex(2).toUpperCase()}`;
}

function randomInvoiceNumber(): string {
  return `${INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX}${Date.now().toString(36).toUpperCase()}${randomHex(2).toUpperCase()}`;
}

export interface FactoryOverride<T> {
  [key: string]: unknown;
}

export function buildAddress(overrides: Partial<Address> = {}): Address {
  return {
    line1: `${randomInt(1, 999)} ${randomElement(['High Street', 'Main Road', 'Oak Avenue', 'Church Lane'])}`,
    line2: null,
    city: randomElement(['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol']),
    county: randomElement(['Greater London', 'Greater Manchester', 'West Midlands', null, null]),
    postcode: randomElement(['SW1A 1AA', 'M1 1AE', 'B1 1BB', 'LS1 1BA', 'BS1 1AA']),
    country: 'GB',
    ...overrides,
  };
}

export function buildCustomer(overrides: Partial<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}> = {}) {
  return {
    id: randomUUID(),
    email: `customer.${randomHex(4)}@example.com`,
    firstName: randomElement(['James', 'Emma', 'Oliver', 'Sophie', 'Harry', 'Lily']),
    lastName: randomElement(['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies']),
    phone: `+447${randomInt(100000000, 999999999)}`,
    ...overrides,
  };
}

export function buildOrderItem(overrides: Partial<{
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  categoryType: CategoryType;
  rangeId: string | null;
  rangeName: string | null;
  colourId: string | null;
  colourName: string | null;
  colourHex: string | null;
  sizeId: string | null;
  sizeLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  const quantity = overrides.quantity ?? randomInt(1, 5);
  const unitPrice = overrides.unitPrice ?? randomFloat(199, 4999);
  return {
    id: randomUUID(),
    orderId: randomUUID(),
    productId: randomUUID(),
    productTitle: randomElement(['Luna White Kitchen', 'Oxford Bedroom', 'Aldridge Grey Kitchen', 'Fitment Bedroom Suite']),
    categoryType: randomElement([CategoryType.KITCHEN, CategoryType.BEDROOM]),
    rangeId: randomUUID(),
    rangeName: randomElement(['Luna', 'Oxford', 'Aldridge', 'Fitment']),
    colourId: randomUUID(),
    colourName: randomElement(['White', 'Grey', 'Oak', 'Anthracite']),
    colourHex: randomElement(['#FFFFFF', '#808080', '#8B6914', '#3B3B3B']),
    sizeId: randomUUID(),
    sizeLabel: randomElement(['1000mm', '1200mm', '1500mm', '2000mm']),
    quantity,
    unitPrice,
    lineTotal: parseFloat((quantity * unitPrice).toFixed(2)),
    currency: 'GBP',
    imageUrl: `https://cdn.lomashwood.co.uk/products/${randomHex(8)}.jpg`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildOrder(overrides: Partial<{
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  couponCode: string | null;
  appointmentId: string | null;
  source: 'WEB' | 'ADMIN' | 'API';
  isAbandoned: boolean;
  abandonedAt: Date | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}> = {}) {
  const subtotal = overrides.subtotal ?? randomFloat(499, 9999);
  const shippingCost = overrides.shippingCost ?? randomFloat(0, 150);
  const taxAmount = overrides.taxAmount ?? parseFloat((subtotal * 0.2).toFixed(2));
  const discountAmount = overrides.discountAmount ?? 0;
  const totalAmount = overrides.totalAmount ?? parseFloat(
    (subtotal + shippingCost + taxAmount - discountAmount).toFixed(2),
  );

  return {
    id: randomUUID(),
    orderNumber: randomOrderNumber(),
    customerId: randomUUID(),
    status: OrderStatus.PENDING,
    subtotal,
    shippingCost,
    taxAmount,
    discountAmount,
    totalAmount,
    currency: 'GBP',
    shippingAddress: buildAddress(),
    billingAddress: buildAddress(),
    couponCode: null,
    appointmentId: null,
    source: 'WEB' as const,
    isAbandoned: false,
    abandonedAt: null,
    idempotencyKey: randomHex(16),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildPayment(overrides: Partial<{
  id: string;
  orderId: string;
  customerId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId: string | null;
  stripeClientSecret: string | null;
  stripeChargeId: string | null;
  stripeReceiptUrl: string | null;
  stripeBalanceTransactionId: string | null;
  amount: number;
  amountCaptured: number;
  currency: string;
  idempotencyKey: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  const amount = overrides.amount ?? randomFloat(499, 9999);

  return {
    id: randomUUID(),
    orderId: randomUUID(),
    customerId: randomUUID(),
    gateway: PaymentGateway.STRIPE,
    method: PaymentMethod.CARD,
    status: PaymentStatus.PENDING,
    stripePaymentIntentId: `pi_${randomHex(20)}`,
    stripeClientSecret: `pi_${randomHex(20)}_secret_${randomHex(20)}`,
    stripeChargeId: null,
    stripeReceiptUrl: null,
    stripeBalanceTransactionId: null,
    amount,
    amountCaptured: 0,
    currency: 'GBP',
    idempotencyKey: randomHex(16),
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildRefund(overrides: Partial<{
  id: string;
  paymentId: string;
  orderId: string;
  type: RefundType;
  status: RefundStatus;
  reason: string;
  note: string | null;
  amount: number;
  currency: string;
  stripeRefundId: string | null;
  initiatedByUserId: string | null;
  initiatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: randomUUID(),
    paymentId: randomUUID(),
    orderId: randomUUID(),
    type: RefundType.FULL,
    status: RefundStatus.PENDING,
    reason: 'CUSTOMER_REQUEST',
    note: null,
    amount: randomFloat(99, 999),
    currency: 'GBP',
    stripeRefundId: `re_${randomHex(20)}`,
    initiatedByUserId: null,
    initiatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildInvoice(overrides: Partial<{
  id: string;
  orderId: string;
  paymentId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  const subtotal = overrides.subtotal ?? randomFloat(499, 9999);
  const taxAmount = overrides.taxAmount ?? parseFloat((subtotal * 0.2).toFixed(2));
  const shippingCost = overrides.shippingCost ?? randomFloat(0, 150);
  const discountAmount = overrides.discountAmount ?? 0;
  const totalAmount = overrides.totalAmount ?? parseFloat(
    (subtotal + taxAmount + shippingCost - discountAmount).toFixed(2),
  );
  const issuedAt = new Date();
  const dueAt = new Date(issuedAt);
  dueAt.setDate(dueAt.getDate() + INVOICE_CONSTANTS.INVOICE_DUE_DAYS);

  return {
    id: randomUUID(),
    orderId: randomUUID(),
    paymentId: randomUUID(),
    invoiceNumber: randomInvoiceNumber(),
    status: InvoiceStatus.ISSUED,
    subtotal,
    taxAmount,
    shippingCost,
    discountAmount,
    totalAmount,
    currency: 'GBP',
    issuedAt,
    dueAt,
    pdfUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildStripePaymentIntent(overrides: Partial<{
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, string>;
}> = {}) {
  const id = overrides.id ?? `pi_${randomHex(20)}`;
  return {
    id,
    client_secret: overrides.client_secret ?? `${id}_secret_${randomHex(20)}`,
    amount: overrides.amount ?? randomInt(49900, 999900),
    currency: overrides.currency ?? 'gbp',
    status: overrides.status ?? 'requires_payment_method',
    metadata: overrides.metadata ?? {},
    object: 'payment_intent',
  };
}

export function buildStripeRefund(overrides: Partial<{
  id: string;
  payment_intent: string;
  charge: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
}> = {}) {
  return {
    id: `re_${randomHex(20)}`,
    payment_intent: `pi_${randomHex(20)}`,
    charge: `ch_${randomHex(20)}`,
    amount: randomInt(9900, 99900),
    currency: 'gbp',
    status: 'succeeded',
    reason: 'requested_by_customer',
    object: 'refund',
    ...overrides,
  };
}

export function buildStripeWebhookEvent(
  type: string,
  data: Record<string, unknown>,
  overrides: Partial<{ id: string; created: number; livemode: boolean }> = {},
) {
  return {
    id: `evt_${randomHex(20)}`,
    object: 'event',
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2024-06-20',
    ...overrides,
  };
}