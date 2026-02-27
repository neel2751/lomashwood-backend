import { PaymentStatus, PaymentMethod, PaymentProvider, RefundStatus } from '@prisma/client';

export interface PaymentFixture {
  id: string;
  paymentNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerCustomerId?: string;
  providerSessionId?: string;
  metadata?: Record<string, any>;
  paymentIntent?: string;
  clientSecret?: string;
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  failureCode?: string;
  paidAt?: Date;
  refundedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundFixture {
  id: string;
  refundNumber: string;
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  providerRefundId?: string;
  metadata?: Record<string, any>;
  processedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const stripePaymentSuccessful: PaymentFixture = {
  id: 'pay_stripe_001',
  paymentNumber: 'PAY-2026-001001',
  orderId: 'ord_kitchen_001',
  orderNumber: 'ORD-2026-001234',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  amount: 9700.00,
  currency: 'GBP',
  status: PaymentStatus.PAID,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_3AbCdEfGhIjKlMnO',
  providerCustomerId: 'cus_AbCdEfGhIjKl',
  providerSessionId: 'cs_test_a1b2c3d4e5f6',
  paymentIntent: 'pi_3AbCdEfGhIjKlMnO',
  clientSecret: 'pi_3AbCdEfGhIjKlMnO_secret_XyZ123',
  description: 'Payment for Luna White Kitchen',
  receiptUrl: 'https://stripe.com/receipts/payment/ABC123',
  metadata: {
    productType: 'kitchen',
    includesInstallation: true,
    appointmentId: 'apt_001',
  },
  paidAt: new Date('2026-02-10T10:15:00Z'),
  createdAt: new Date('2026-02-10T10:00:00Z'),
  updatedAt: new Date('2026-02-10T10:15:00Z'),
};

export const stripePaymentPending: PaymentFixture = {
  id: 'pay_stripe_002',
  paymentNumber: 'PAY-2026-001002',
  orderId: 'ord_bedroom_001',
  orderNumber: 'ORD-2026-001236',
  userId: 'usr_003',
  userEmail: 'robert.jones@example.com',
  amount: 7650.00,
  currency: 'GBP',
  status: PaymentStatus.PENDING,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerSessionId: 'cs_test_b2c3d4e5f6g7',
  paymentIntent: 'pi_3BbCdEfGhIjKlMnP',
  clientSecret: 'pi_3BbCdEfGhIjKlMnP_secret_AbC456',
  description: 'Payment for Classic Wardrobes Set',
  metadata: {
    productType: 'bedroom',
    includesAssembly: true,
  },
  createdAt: new Date('2026-02-12T09:00:00Z'),
  updatedAt: new Date('2026-02-12T09:00:00Z'),
};

export const stripePaymentFailed: PaymentFixture = {
  id: 'pay_stripe_003',
  paymentNumber: 'PAY-2026-001003',
  orderId: 'ord_kitchen_003',
  orderNumber: 'ORD-2026-001242',
  userId: 'usr_013',
  userEmail: 'test.failed@example.com',
  amount: 5500.00,
  currency: 'GBP',
  status: PaymentStatus.FAILED,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_3CcDdEfGhIjKlMnQ',
  paymentIntent: 'pi_3CcDdEfGhIjKlMnQ',
  clientSecret: 'pi_3CcDdEfGhIjKlMnQ_secret_DeF789',
  description: 'Payment for Shaker Kitchen',
  failureReason: 'Your card was declined',
  failureCode: 'card_declined',
  metadata: {
    productType: 'kitchen',
    retryAttempt: 1,
  },
  createdAt: new Date('2026-02-11T14:00:00Z'),
  updatedAt: new Date('2026-02-11T14:05:00Z'),
};

export const stripePaymentRefunded: PaymentFixture = {
  id: 'pay_stripe_004',
  paymentNumber: 'PAY-2026-001004',
  orderId: 'ord_cancelled_001',
  orderNumber: 'ORD-2026-001239',
  userId: 'usr_006',
  userEmail: 'emily.davis@example.com',
  amount: 6960.00,
  currency: 'GBP',
  status: PaymentStatus.REFUNDED,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_3DdEeFfGhIjKlMnR',
  providerCustomerId: 'cus_DdEeFfGhIjKl',
  paymentIntent: 'pi_3DdEeFfGhIjKlMnR',
  clientSecret: 'pi_3DdEeFfGhIjKlMnR_secret_GhI012',
  description: 'Payment for Contemporary Kitchen',
  receiptUrl: 'https://stripe.com/receipts/payment/DEF456',
  metadata: {
    productType: 'kitchen',
    refundReason: 'customer_request',
  },
  paidAt: new Date('2026-02-06T13:30:00Z'),
  refundedAt: new Date('2026-02-07T10:00:00Z'),
  createdAt: new Date('2026-02-06T13:00:00Z'),
  updatedAt: new Date('2026-02-07T10:00:00Z'),
};

export const stripePaymentPartiallyRefunded: PaymentFixture = {
  id: 'pay_stripe_005',
  paymentNumber: 'PAY-2026-001005',
  orderId: 'ord_kitchen_002',
  orderNumber: 'ORD-2026-001235',
  userId: 'usr_002',
  userEmail: 'jane.smith@example.com',
  amount: 14550.00,
  currency: 'GBP',
  status: PaymentStatus.PARTIALLY_REFUNDED,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_3EeFfGgHhIiJjKkL',
  providerCustomerId: 'cus_EeFfGgHhIiJj',
  paymentIntent: 'pi_3EeFfGgHhIiJjKkL',
  clientSecret: 'pi_3EeFfGgHhIiJjKkL_secret_JkL345',
  description: 'Payment for J-Pull Grey Kitchen',
  receiptUrl: 'https://stripe.com/receipts/payment/GHI789',
  metadata: {
    productType: 'kitchen',
    partialRefundAmount: 500.00,
    partialRefundReason: 'missing_item',
  },
  paidAt: new Date('2026-02-09T15:00:00Z'),
  createdAt: new Date('2026-02-09T14:30:00Z'),
  updatedAt: new Date('2026-02-10T11:30:00Z'),
};

export const stripePaymentCancelled: PaymentFixture = {
  id: 'pay_stripe_006',
  paymentNumber: 'PAY-2026-001006',
  orderId: 'ord_kitchen_004',
  orderNumber: 'ORD-2026-001243',
  userId: 'usr_014',
  userEmail: 'test.cancelled@example.com',
  amount: 8200.00,
  currency: 'GBP',
  status: PaymentStatus.CANCELLED,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerSessionId: 'cs_test_c3d4e5f6g7h8',
  paymentIntent: 'pi_3FfGgHhIiJjKkLlM',
  clientSecret: 'pi_3FfGgHhIiJjKkLlM_secret_MnO678',
  description: 'Payment for Modern Kitchen',
  metadata: {
    productType: 'kitchen',
    cancellationReason: 'user_abandoned_checkout',
  },
  cancelledAt: new Date('2026-02-11T16:30:00Z'),
  createdAt: new Date('2026-02-11T16:00:00Z'),
  updatedAt: new Date('2026-02-11T16:30:00Z'),
};

export const razorpayPaymentSuccessful: PaymentFixture = {
  id: 'pay_razorpay_001',
  paymentNumber: 'PAY-2026-001007',
  orderId: 'ord_bedroom_002',
  orderNumber: 'ORD-2026-001237',
  userId: 'usr_004',
  userEmail: 'sarah.williams@example.com',
  amount: 4915.00,
  currency: 'GBP',
  status: PaymentStatus.PAID,
  method: PaymentMethod.RAZORPAY,
  provider: PaymentProvider.RAZORPAY,
  providerPaymentId: 'pay_AbCdEfGhIjKlMnOp',
  providerCustomerId: 'cust_BbCcDdEeFfGgHh',
  description: 'Payment for Modern Sliding Wardrobe',
  receiptUrl: 'https://razorpay.com/receipts/pay_AbCdEfGhIjKlMnOp',
  metadata: {
    productType: 'bedroom',
    includesSoftClose: true,
  },
  paidAt: new Date('2026-02-05T16:45:00Z'),
  createdAt: new Date('2026-02-05T16:20:00Z'),
  updatedAt: new Date('2026-02-05T16:45:00Z'),
};

export const combinedOrderPayment: PaymentFixture = {
  id: 'pay_combined_001',
  paymentNumber: 'PAY-2026-001008',
  orderId: 'ord_combined_001',
  orderNumber: 'ORD-2026-001238',
  userId: 'usr_005',
  userEmail: 'michael.brown@example.com',
  amount: 20900.00,
  currency: 'GBP',
  status: PaymentStatus.PAID,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_3GgHhIiJjKkLlMmN',
  providerCustomerId: 'cus_GgHhIiJjKkLl',
  providerSessionId: 'cs_test_d4e5f6g7h8i9',
  paymentIntent: 'pi_3GgHhIiJjKkLlMmN',
  clientSecret: 'pi_3GgHhIiJjKkLlMmN_secret_PqR901',
  description: 'Payment for Kitchen & Bedroom Package',
  receiptUrl: 'https://stripe.com/receipts/payment/JKL012',
  metadata: {
    productType: 'combined',
    includesKitchen: true,
    includesBedroom: true,
    packageDeal: true,
  },
  paidAt: new Date('2026-01-28T11:30:00Z'),
  createdAt: new Date('2026-01-28T11:00:00Z'),
  updatedAt: new Date('2026-01-28T11:30:00Z'),
};

export const packageDealPayment: PaymentFixture = {
  id: 'pay_package_001',
  paymentNumber: 'PAY-2026-001009',
  orderId: 'ord_package_001',
  orderNumber: 'ORD-2026-001240',
  userId: 'usr_007',
  userEmail: 'david.wilson@example.com',
  amount: 15000.00,
  currency: 'GBP',
  status: PaymentStatus.PAID,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerPaymentId: 'pi_3HhIiJjKkLlMmNnO',
  providerCustomerId: 'cus_HhIiJjKkLlMm',
  providerSessionId: 'cs_test_e5f6g7h8i9j0',
  paymentIntent: 'pi_3HhIiJjKkLlMmNnO',
  clientSecret: 'pi_3HhIiJjKkLlMmNnO_secret_StU234',
  description: 'Payment for Complete Home Package',
  receiptUrl: 'https://stripe.com/receipts/payment/MNO345',
  metadata: {
    productType: 'package',
    packageType: 'complete_home',
    discountApplied: 3000.00,
  },
  paidAt: new Date('2026-02-11T09:15:00Z'),
  createdAt: new Date('2026-02-11T08:00:00Z'),
  updatedAt: new Date('2026-02-11T09:15:00Z'),
};

export const saleOrderPayment: PaymentFixture = {
  id: 'pay_sale_001',
  paymentNumber: 'PAY-2026-001010',
  orderId: 'ord_sale_001',
  orderNumber: 'ORD-2026-001241',
  userId: 'usr_008',
  userEmail: 'laura.taylor@example.com',
  amount: 6750.00,
  currency: 'GBP',
  status: PaymentStatus.PENDING,
  method: PaymentMethod.STRIPE,
  provider: PaymentProvider.STRIPE,
  providerSessionId: 'cs_test_f6g7h8i9j0k1',
  paymentIntent: 'pi_3IiJjKkLlMmNnOoP',
  clientSecret: 'pi_3IiJjKkLlMmNnOoP_secret_VwX567',
  description: 'Payment for Spring Sale Kitchen',
  metadata: {
    productType: 'kitchen',
    saleDiscount: 25,
    originalPrice: 9000.00,
  },
  createdAt: new Date('2026-02-12T10:05:00Z'),
  updatedAt: new Date('2026-02-12T10:05:00Z'),
};

export const fullRefund: RefundFixture = {
  id: 'ref_001',
  refundNumber: 'REF-2026-001001',
  paymentId: 'pay_stripe_004',
  orderId: 'ord_cancelled_001',
  userId: 'usr_006',
  amount: 6960.00,
  currency: 'GBP',
  status: RefundStatus.COMPLETED,
  reason: 'Customer requested cancellation - measurements incorrect',
  providerRefundId: 're_3DdEeFfGhIjKlMnR',
  metadata: {
    refundType: 'full',
    requestedBy: 'customer',
    approvedBy: 'admin_001',
  },
  processedAt: new Date('2026-02-07T10:00:00Z'),
  createdAt: new Date('2026-02-07T09:30:00Z'),
  updatedAt: new Date('2026-02-07T10:00:00Z'),
};

export const partialRefund: RefundFixture = {
  id: 'ref_002',
  refundNumber: 'REF-2026-001002',
  paymentId: 'pay_stripe_005',
  orderId: 'ord_kitchen_002',
  userId: 'usr_002',
  amount: 500.00,
  currency: 'GBP',
  status: RefundStatus.COMPLETED,
  reason: 'Missing accessory item from order',
  providerRefundId: 're_3EeFfGgHhIiJjKkL',
  metadata: {
    refundType: 'partial',
    missingItem: 'Kitchen Handle Set',
    requestedBy: 'customer',
    approvedBy: 'admin_002',
  },
  processedAt: new Date('2026-02-10T11:30:00Z'),
  createdAt: new Date('2026-02-10T11:00:00Z'),
  updatedAt: new Date('2026-02-10T11:30:00Z'),
};

export const refundPending: RefundFixture = {
  id: 'ref_003',
  refundNumber: 'REF-2026-001003',
  paymentId: 'pay_stripe_001',
  orderId: 'ord_kitchen_001',
  userId: 'usr_001',
  amount: 1000.00,
  currency: 'GBP',
  status: RefundStatus.PENDING,
  reason: 'Damaged worktop section during delivery',
  metadata: {
    refundType: 'partial',
    damagedItem: 'Quartz Worktop Section',
    requestedBy: 'customer',
  },
  createdAt: new Date('2026-02-12T08:00:00Z'),
  updatedAt: new Date('2026-02-12T08:00:00Z'),
};

export const refundFailed: RefundFixture = {
  id: 'ref_004',
  refundNumber: 'REF-2026-001004',
  paymentId: 'pay_stripe_003',
  orderId: 'ord_kitchen_003',
  userId: 'usr_013',
  amount: 5500.00,
  currency: 'GBP',
  status: RefundStatus.FAILED,
  reason: 'Payment failed, attempting refund',
  metadata: {
    refundType: 'full',
    failureReason: 'Original payment was not successful',
  },
  failedAt: new Date('2026-02-11T14:10:00Z'),
  createdAt: new Date('2026-02-11T14:07:00Z'),
  updatedAt: new Date('2026-02-11T14:10:00Z'),
};

export const paymentFixtures: PaymentFixture[] = [
  stripePaymentSuccessful,
  stripePaymentPending,
  stripePaymentFailed,
  stripePaymentRefunded,
  stripePaymentPartiallyRefunded,
  stripePaymentCancelled,
  razorpayPaymentSuccessful,
  combinedOrderPayment,
  packageDealPayment,
  saleOrderPayment,
];

export const refundFixtures: RefundFixture[] = [
  fullRefund,
  partialRefund,
  refundPending,
  refundFailed,
];

export const getPaymentById = (id: string): PaymentFixture | undefined => {
  return paymentFixtures.find(payment => payment.id === id);
};

export const getPaymentsByStatus = (status: PaymentStatus): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.status === status);
};

export const getPaymentsByOrderId = (orderId: string): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.orderId === orderId);
};

export const getPaymentsByUserId = (userId: string): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.userId === userId);
};

export const getPaymentsByMethod = (method: PaymentMethod): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.method === method);
};

export const getPaymentsByProvider = (provider: PaymentProvider): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.provider === provider);
};

export const getSuccessfulPayments = (): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.status === PaymentStatus.PAID);
};

export const getFailedPayments = (): PaymentFixture[] => {
  return paymentFixtures.filter(payment => payment.status === PaymentStatus.FAILED);
};

export const getRefundedPayments = (): PaymentFixture[] => {
  return paymentFixtures.filter(
    payment => payment.status === PaymentStatus.REFUNDED || 
    payment.status === PaymentStatus.PARTIALLY_REFUNDED
  );
};

export const getRefundById = (id: string): RefundFixture | undefined => {
  return refundFixtures.find(refund => refund.id === id);
};

export const getRefundsByStatus = (status: RefundStatus): RefundFixture[] => {
  return refundFixtures.filter(refund => refund.status === status);
};

export const getRefundsByPaymentId = (paymentId: string): RefundFixture[] => {
  return refundFixtures.filter(refund => refund.paymentId === paymentId);
};

export const getRefundsByOrderId = (orderId: string): RefundFixture[] => {
  return refundFixtures.filter(refund => refund.orderId === orderId);
};

export const createPaymentFixture = (overrides: Partial<PaymentFixture> = {}): PaymentFixture => {
  const timestamp = new Date();
  const defaultPayment: PaymentFixture = {
    id: `pay_${Date.now()}`,
    paymentNumber: `PAY-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    orderId: 'ord_default',
    orderNumber: 'ORD-2026-000000',
    userId: 'usr_default',
    userEmail: 'customer@example.com',
    amount: 5000.00,
    currency: 'GBP',
    status: PaymentStatus.PENDING,
    method: PaymentMethod.STRIPE,
    provider: PaymentProvider.STRIPE,
    description: 'Test Payment',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return defaultPayment;
};

export const createRefundFixture = (overrides: Partial<RefundFixture> = {}): RefundFixture => {
  const timestamp = new Date();
  const defaultRefund: RefundFixture = {
    id: `ref_${Date.now()}`,
    refundNumber: `REF-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    paymentId: 'pay_default',
    orderId: 'ord_default',
    userId: 'usr_default',
    amount: 1000.00,
    currency: 'GBP',
    status: RefundStatus.PENDING,
    reason: 'Test refund',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return defaultRefund;
};

export default {
  paymentFixtures,
  refundFixtures,
  stripePaymentSuccessful,
  stripePaymentPending,
  stripePaymentFailed,
  stripePaymentRefunded,
  stripePaymentPartiallyRefunded,
  stripePaymentCancelled,
  razorpayPaymentSuccessful,
  combinedOrderPayment,
  packageDealPayment,
  saleOrderPayment,
  fullRefund,
  partialRefund,
  refundPending,
  refundFailed,
  getPaymentById,
  getPaymentsByStatus,
  getPaymentsByOrderId,
  getPaymentsByUserId,
  getPaymentsByMethod,
  getPaymentsByProvider,
  getSuccessfulPayments,
  getFailedPayments,
  getRefundedPayments,
  getRefundById,
  getRefundsByStatus,
  getRefundsByPaymentId,
  getRefundsByOrderId,
  createPaymentFixture,
  createRefundFixture,
};