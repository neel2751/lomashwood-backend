import { PaymentStatus, PaymentMethod } from '@prisma/client';

export const PAYMENT_CONSTANTS = {
  MIN_PAYMENT_AMOUNT: 1,
  MAX_PAYMENT_AMOUNT: 10000000,

  DEFAULT_CURRENCY: 'INR',
  SUPPORTED_CURRENCIES: ['INR', 'USD', 'EUR', 'GBP'],

  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  PAYMENT_TIMEOUT_MINUTES: 30,
  PAYMENT_INTENT_EXPIRY_HOURS: 24,

  MAX_REFUND_ATTEMPTS: 3,
  REFUND_PROCESSING_DAYS: 5,

  WEBHOOK_RETRY_ATTEMPTS: 5,
  WEBHOOK_RETRY_DELAY_MS: 5000,

  CACHE_TTL: {
    PAYMENT_DETAILS: 300,
    PAYMENT_LIST: 60,
    PAYMENT_STATISTICS: 600,
    PAYMENT_METHODS: 1800,
  },

  RECONCILIATION_BATCH_SIZE: 100,
  SETTLEMENT_DELAY_DAYS: 2,

  MAX_SPLIT_PAYMENTS: 5,
  MAX_SCHEDULED_PAYMENTS_PER_ORDER: 10,
} as const;

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  RAZORPAY: 'razorpay',
  PAYU: 'payu',
  CASHFREE: 'cashfree',
  PHONEPE: 'phonepe',
  PAYTM: 'paytm',
} as const;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PROCESSING]: 'Processing',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
  [PaymentStatus.CANCELLED]: 'Cancelled',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CARD]: 'Credit/Debit Card',
  [PaymentMethod.UPI]: 'UPI',
  [PaymentMethod.NET_BANKING]: 'Net Banking',
  [PaymentMethod.WALLET]: 'Wallet',
  [PaymentMethod.COD]: 'Cash on Delivery',
  [PaymentMethod.EMI]: 'EMI',
};

export const PAYMENT_STATUS_FLOW: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PAID]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ],
  [PaymentStatus.FAILED]: [
    PaymentStatus.PENDING,
  ],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.CANCELLED]: [],
};

export const PAYMENT_GATEWAY_FEES = {
  STRIPE: {
    [PaymentMethod.CARD]: {
      domestic: 0.029,
      international: 0.049,
      fixed: 0,
    },
    [PaymentMethod.UPI]: {
      rate: 0.01,
      fixed: 0,
    },
    [PaymentMethod.NET_BANKING]: {
      rate: 0.02,
      fixed: 0,
    },
    [PaymentMethod.WALLET]: {
      rate: 0.025,
      fixed: 0,
    },
  },
  RAZORPAY: {
    [PaymentMethod.CARD]: {
      domestic: 0.02,
      international: 0.03,
      fixed: 0,
    },
    [PaymentMethod.UPI]: {
      rate: 0.005,
      fixed: 0,
      cap: 100,
    },
    [PaymentMethod.NET_BANKING]: {
      rate: 0.015,
      fixed: 0,
    },
    [PaymentMethod.WALLET]: {
      rate: 0.02,
      fixed: 0,
    },
    [PaymentMethod.EMI]: {
      rate: 0.025,
      fixed: 0,
    },
  },
} as const;

export const CARD_BRANDS = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
  DISCOVER: 'Discover',
  DINERS: 'Diners Club',
  RUPAY: 'RuPay',
  MAESTRO: 'Maestro',
} as const;

export const UPI_PROVIDERS = {
  GPAY: 'Google Pay',
  PHONEPE: 'PhonePe',
  PAYTM: 'Paytm',
  BHIM: 'BHIM',
  AMAZONPAY: 'Amazon Pay',
  WHATSAPP: 'WhatsApp Pay',
} as const;

export const WALLET_PROVIDERS = {
  PAYTM: 'Paytm Wallet',
  PHONEPE: 'PhonePe Wallet',
  MOBIKWIK: 'MobiKwik',
  FREECHARGE: 'FreeCharge',
  AMAZONPAY: 'Amazon Pay',
  AIRTEL_MONEY: 'Airtel Money',
  JIO_MONEY: 'Jio Money',
} as const;

export const NET_BANKING_PROVIDERS = {
  SBI: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICICI: 'ICICI Bank',
  AXIS: 'Axis Bank',
  KOTAK: 'Kotak Mahindra Bank',
  PNB: 'Punjab National Bank',
  BOB: 'Bank of Baroda',
  CANARA: 'Canara Bank',
  IDBI: 'IDBI Bank',
  YES: 'Yes Bank',
} as const;

export const PAYMENT_ERROR_CODES = {
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  INVALID_PAYMENT_AMOUNT: 'INVALID_PAYMENT_AMOUNT',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  INVALID_PAYMENT_STATUS: 'INVALID_PAYMENT_STATUS',
  PAYMENT_PROCESSING_FAILED: 'PAYMENT_PROCESSING_FAILED',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CARD_DECLINED: 'CARD_DECLINED',
  CARD_EXPIRED: 'CARD_EXPIRED',
  CARD_INVALID: 'CARD_INVALID',
  CVV_INVALID: 'CVV_INVALID',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  REFUND_FAILED: 'REFUND_FAILED',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
  REFUND_AMOUNT_EXCEEDED: 'REFUND_AMOUNT_EXCEEDED',
  DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
  WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_NOT_FOUND: 'Payment not found',
  PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
  PAYMENT_EXPIRED: 'Payment session has expired',
  PAYMENT_CANCELLED: 'Payment has been cancelled',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  INVALID_PAYMENT_STATUS: 'Invalid payment status',
  PAYMENT_PROCESSING_FAILED: 'Payment processing failed',
  PAYMENT_GATEWAY_ERROR: 'Payment gateway error occurred',
  INSUFFICIENT_FUNDS: 'Insufficient funds in account',
  CARD_DECLINED: 'Card declined by issuer',
  CARD_EXPIRED: 'Card has expired',
  CARD_INVALID: 'Invalid card details',
  CVV_INVALID: 'Invalid CVV/CVC code',
  AUTHENTICATION_FAILED: 'Payment authentication failed',
  REFUND_FAILED: 'Refund processing failed',
  REFUND_NOT_ALLOWED: 'Refund not allowed for this payment',
  REFUND_AMOUNT_EXCEEDED: 'Refund amount exceeds payment amount',
  DUPLICATE_PAYMENT: 'Duplicate payment detected',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook verification failed',
  VALIDATION_ERROR: 'Validation error',
  DATABASE_ERROR: 'Database error occurred',
  EXTERNAL_SERVICE_ERROR: 'External service error',
};

export const REFUND_REASONS = [
  'Customer Request',
  'Order Cancelled',
  'Product Out of Stock',
  'Duplicate Payment',
  'Fraudulent Transaction',
  'Service Not Delivered',
  'Quality Issues',
  'Wrong Product Delivered',
  'Damaged Product',
  'Delayed Delivery',
  'Price Error',
  'Technical Error',
  'Other',
] as const;

export const PAYMENT_NOTIFICATION_EVENTS = {
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_PROCESSING: 'payment.processing',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_CANCELLED: 'payment.cancelled',
  REFUND_INITIATED: 'refund.initiated',
  REFUND_PROCESSED: 'refund.processed',
  REFUND_FAILED: 'refund.failed',
  CHARGEBACK_RECEIVED: 'chargeback.received',
  SETTLEMENT_COMPLETED: 'settlement.completed',
} as const;

export const PAYMENT_EMAIL_TEMPLATES = {
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed',
  PAYMENT_PENDING: 'payment-pending',
  REFUND_INITIATED: 'refund-initiated',
  REFUND_PROCESSED: 'refund-processed',
  PAYMENT_REMINDER: 'payment-reminder',
  PAYMENT_RECEIPT: 'payment-receipt',
} as const;

export const PAYMENT_VALIDATION_MESSAGES = {
  INVALID_AMOUNT: 'Payment amount must be between ₹1 and ₹1,00,00,000',
  INVALID_CURRENCY: 'Invalid currency code',
  INVALID_METHOD: 'Invalid payment method',
  INVALID_PROVIDER: 'Invalid payment provider',
  INVALID_ORDER_ID: 'Invalid order ID',
  INVALID_CUSTOMER_ID: 'Invalid customer ID',
  INVALID_TRANSACTION_ID: 'Invalid transaction ID',
  INVALID_REFUND_AMOUNT: 'Invalid refund amount',
  EXPIRED_PAYMENT_SESSION: 'Payment session has expired',
  PAYMENT_ALREADY_COMPLETED: 'Payment has already been completed',
  REFUND_EXCEEDS_PAYMENT: 'Refund amount cannot exceed payment amount',
} as const;

export const PAYMENT_SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  AMOUNT: 'amount',
  STATUS: 'status',
  PAID_AT: 'paidAt',
} as const;

export const PAYMENT_FILTER_PRESETS = {
  TODAY: {
    label: 'Today',
    days: 0,
  },
  LAST_7_DAYS: {
    label: 'Last 7 Days',
    days: 7,
  },
  LAST_30_DAYS: {
    label: 'Last 30 Days',
    days: 30,
  },
  LAST_90_DAYS: {
    label: 'Last 90 Days',
    days: 90,
  },
  THIS_MONTH: {
    label: 'This Month',
    type: 'month',
  },
  THIS_YEAR: {
    label: 'This Year',
    type: 'year',
  },
} as const;

export const PAYMENT_RISK_LEVELS = {
  LOW: {
    score: 0,
    threshold: 30,
    action: 'APPROVE',
  },
  MEDIUM: {
    score: 30,
    threshold: 60,
    action: 'REVIEW',
  },
  HIGH: {
    score: 60,
    threshold: 85,
    action: 'REVIEW',
  },
  CRITICAL: {
    score: 85,
    threshold: 100,
    action: 'DECLINE',
  },
} as const;

export const PAYMENT_FRAUD_INDICATORS = [
  'multiple_failed_attempts',
  'unusual_location',
  'high_velocity',
  'mismatched_billing_shipping',
  'new_account',
  'unusual_order_amount',
  'suspicious_email',
  'vpn_proxy_detected',
  'blacklisted_card',
  'blacklisted_ip',
] as const;

export const PAYMENT_METRICS = {
  SUCCESS_RATE: 'success_rate',
  FAILURE_RATE: 'failure_rate',
  AVERAGE_TRANSACTION_VALUE: 'avg_transaction_value',
  TOTAL_VOLUME: 'total_volume',
  REFUND_RATE: 'refund_rate',
  CHARGEBACK_RATE: 'chargeback_rate',
  SETTLEMENT_TIME: 'settlement_time',
  PROCESSING_TIME: 'processing_time',
} as const;

export const PAYMENT_QUEUE_NAMES = {
  PAYMENT_PROCESSING: 'payment:processing',
  PAYMENT_VERIFICATION: 'payment:verification',
  REFUND_PROCESSING: 'refund:processing',
  WEBHOOK_PROCESSING: 'webhook:processing',
  NOTIFICATION_SENDING: 'notification:sending',
  SETTLEMENT_PROCESSING: 'settlement:processing',
  RECONCILIATION: 'payment:reconciliation',
} as const;

export const PAYMENT_EVENT_TYPES = {
  CREATED: 'PAYMENT_CREATED',
  UPDATED: 'PAYMENT_UPDATED',
  STATUS_CHANGED: 'PAYMENT_STATUS_CHANGED',
  COMPLETED: 'PAYMENT_COMPLETED',
  FAILED: 'PAYMENT_FAILED',
  REFUNDED: 'PAYMENT_REFUNDED',
  CANCELLED: 'PAYMENT_CANCELLED',
} as const;

export const EMI_TENURES = [
  3, 6, 9, 12, 18, 24,
] as const;

export const EMI_MIN_AMOUNT = 3000;
export const EMI_INTEREST_RATES: Record<number, number> = {
  3: 12,
  6: 13,
  9: 14,
  12: 15,
  18: 16,
  24: 17,
};

export const PAYMENT_PERMISSION_ACTIONS = {
  CREATE: 'payment:create',
  READ: 'payment:read',
  UPDATE: 'payment:update',
  REFUND: 'payment:refund',
  CANCEL: 'payment:cancel',
  VIEW_ALL: 'payment:view_all',
  RECONCILE: 'payment:reconcile',
  EXPORT: 'payment:export',
  MANAGE_METHODS: 'payment:manage_methods',
} as const;

export const PAYMENT_AUDIT_ACTIONS = {
  CREATED: 'created',
  PROCESSED: 'processed',
  VERIFIED: 'verified',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  STATUS_UPDATED: 'status_updated',
  METADATA_UPDATED: 'metadata_updated',
  WEBHOOK_RECEIVED: 'webhook_received',
} as const;

export const PAYMENT_EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
} as const;

export const PAYMENT_REPORT_TYPES = {
  DAILY_TRANSACTIONS: 'daily_transactions',
  MONTHLY_REVENUE: 'monthly_revenue',
  REFUND_SUMMARY: 'refund_summary',
  GATEWAY_FEES: 'gateway_fees',
  SETTLEMENT_REPORT: 'settlement_report',
  FAILED_PAYMENTS: 'failed_payments',
  CHARGEBACK_REPORT: 'chargeback_report',
  RECONCILIATION_REPORT: 'reconciliation_report',
} as const;

export const PAYMENT_WEBHOOK_EVENTS = [
  'payment.created',
  'payment.processing',
  'payment.succeeded',
  'payment.failed',
  'payment.cancelled',
  'refund.created',
  'refund.succeeded',
  'refund.failed',
  'charge.succeeded',
  'charge.failed',
  'charge.refunded',
  'payout.created',
  'payout.paid',
  'payout.failed',
  'dispute.created',
  'dispute.updated',
  'dispute.closed',
] as const;

export const PAYMENT_RATE_LIMITS = {
  CREATE_PAYMENT_PER_HOUR: 10,
  PROCESS_PAYMENT_PER_HOUR: 20,
  REFUND_PAYMENT_PER_HOUR: 5,
  VERIFY_PAYMENT_PER_HOUR: 30,
  GET_PAYMENTS_PER_MINUTE: 100,
} as const;

export const PAYMENT_FEATURE_FLAGS = {
  ENABLE_CARD_PAYMENTS: true,
  ENABLE_UPI_PAYMENTS: true,
  ENABLE_NET_BANKING: true,
  ENABLE_WALLET_PAYMENTS: true,
  ENABLE_EMI: true,
  ENABLE_COD: false,
  ENABLE_INTERNATIONAL_CARDS: true,
  ENABLE_SAVED_CARDS: true,
  ENABLE_AUTO_REFUND: true,
  ENABLE_SPLIT_PAYMENTS: false,
  ENABLE_SCHEDULED_PAYMENTS: false,
  ENABLE_RECURRING_PAYMENTS: false,
} as const;

export const PAYMENT_3DS_CONFIG = {
  ENABLED: true,
  VERSION: '2.0',
  CHALLENGE_PREFERENCE: 'no_preference',
  EXEMPTION_TYPES: ['low_value', 'trusted_beneficiary', 'recurring'],
} as const;

export const PAYMENT_SETTLEMENT_CONFIG = {
  AUTO_SETTLEMENT: true,
  SETTLEMENT_CYCLE: 'T+2',
  MIN_SETTLEMENT_AMOUNT: 100,
  SETTLEMENT_CURRENCY: 'INR',
  HOLD_DURATION_DAYS: 2,
} as const;

export const CHARGEBACK_REASONS = [
  'Fraudulent Transaction',
  'Product Not Received',
  'Product Not as Described',
  'Duplicate Charge',
  'Credit Not Processed',
  'Cancelled Recurring Transaction',
  'General',
] as const;

export const DISPUTE_STATUSES = {
  WARNING_NEEDS_RESPONSE: 'warning_needs_response',
  WARNING_UNDER_REVIEW: 'warning_under_review',
  WARNING_CLOSED: 'warning_closed',
  NEEDS_RESPONSE: 'needs_response',
  UNDER_REVIEW: 'under_review',
  CHARGE_REFUNDED: 'charge_refunded',
  WON: 'won',
  LOST: 'lost',
} as const;

export const PAYMENT_CACHE_KEYS = {
  PAYMENT_DETAILS: (id: string) => `payment:details:${id}`,
  PAYMENT_LIST: (filters: string) => `payment:list:${filters}`,
  PAYMENT_STATS: (period: string) => `payment:stats:${period}`,
  PAYMENT_METHODS: (customerId: string) => `payment:methods:${customerId}`,
  PAYMENT_COUNT: 'payment:count',
} as const;