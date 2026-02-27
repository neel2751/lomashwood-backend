import { OrderStatus, PaymentStatus } from '@prisma/client';

export const ORDER_CONSTANTS = {
  ORDER_NUMBER_PREFIX: 'LW',
  
  MIN_ORDER_AMOUNT: 500,
  MAX_ORDER_AMOUNT: 10000000,
  
  MAX_ITEMS_PER_ORDER: 50,
  MIN_ITEMS_PER_ORDER: 1,
  
  MAX_QUANTITY_PER_ITEM: 100,
  MIN_QUANTITY_PER_ITEM: 1,
  
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  ORDER_TIMEOUT_MINUTES: 30,
  PENDING_ORDER_EXPIRY_HOURS: 24,
  
  DEFAULT_TAX_RATE: 18,
  CGST_RATE: 9,
  SGST_RATE: 9,
  IGST_RATE: 18,
  
  FREE_SHIPPING_THRESHOLD: 50000,
  STANDARD_SHIPPING_CHARGE: 500,
  EXPRESS_SHIPPING_CHARGE: 1500,
  
  CANCELLATION_WINDOW_HOURS: 48,
  RETURN_WINDOW_DAYS: 7,
  
  MAX_DISCOUNT_PERCENTAGE: 90,
  
  INVOICE_PREFIX: 'INV',
  
  RETRY_PAYMENT_ATTEMPTS: 3,
  PAYMENT_TIMEOUT_SECONDS: 300,
} as const;

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
    OrderStatus.PAYMENT_FAILED,
  ],
  [OrderStatus.PROCESSING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_TO_SHIP,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_TO_SHIP]: [
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SHIPPED]: [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.RETURNED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
  ],
  [OrderStatus.DELIVERED]: [
    OrderStatus.COMPLETED,
    OrderStatus.RETURNED,
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending Payment',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.CONFIRMED]: 'Order Confirmed',
  [OrderStatus.PREPARING]: 'Preparing Order',
  [OrderStatus.READY_TO_SHIP]: 'Ready to Ship',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.RETURNED]: 'Returned',
  [OrderStatus.REFUNDED]: 'Refunded',
  [OrderStatus.PAYMENT_FAILED]: 'Payment Failed',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Payment Pending',
  [PaymentStatus.PROCESSING]: 'Payment Processing',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.FAILED]: 'Payment Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
  [PaymentStatus.CANCELLED]: 'Payment Cancelled',
};

export const ORDER_CANCELLATION_REASONS = [
  'Customer Request',
  'Payment Failed',
  'Out of Stock',
  'Pricing Error',
  'Duplicate Order',
  'Fraudulent Order',
  'Customer Not Reachable',
  'Address Issue',
  'Product Unavailable',
  'Other',
] as const;

export const ORDER_RETURN_REASONS = [
  'Product Damaged',
  'Wrong Product Received',
  'Product Defective',
  'Not as Described',
  'Quality Issues',
  'Size/Fit Issue',
  'Changed Mind',
  'Better Price Available',
  'Late Delivery',
  'Other',
] as const;

export const DELIVERY_PREFERENCES = {
  STANDARD: {
    label: 'Standard Delivery',
    estimatedDays: 7,
    charge: 500,
  },
  EXPRESS: {
    label: 'Express Delivery',
    estimatedDays: 3,
    charge: 1500,
  },
  SCHEDULED: {
    label: 'Scheduled Delivery',
    estimatedDays: null,
    charge: 1000,
  },
  PICKUP: {
    label: 'Showroom Pickup',
    estimatedDays: 1,
    charge: 0,
  },
} as const;

export const ORDER_SOURCE_TYPES = {
  WEB: 'Website',
  MOBILE: 'Mobile App',
  ADMIN: 'Admin Panel',
  SHOWROOM: 'Showroom',
  PHONE: 'Phone Order',
} as const;

export const ORDER_NOTIFICATION_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_RETURNED: 'order.returned',
  ORDER_REFUNDED: 'order.refunded',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
} as const;

export const ORDER_EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order-confirmation',
  ORDER_SHIPPED: 'order-shipped',
  ORDER_DELIVERED: 'order-delivered',
  ORDER_CANCELLED: 'order-cancelled',
  ORDER_RETURN_INITIATED: 'order-return-initiated',
  ORDER_REFUND_PROCESSED: 'order-refund-processed',
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed',
  ORDER_STATUS_UPDATE: 'order-status-update',
} as const;

export const ORDER_VALIDATION_MESSAGES = {
  INVALID_CUSTOMER_ID: 'Invalid customer ID',
  INVALID_PRODUCT_ID: 'Invalid product ID',
  INVALID_QUANTITY: 'Quantity must be between 1 and 100',
  INVALID_ADDRESS: 'Invalid shipping or billing address',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  INVALID_COUPON: 'Invalid or expired coupon code',
  MIN_ORDER_AMOUNT: 'Minimum order amount is ₹500',
  MAX_ORDER_AMOUNT: 'Maximum order amount exceeded',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_PINCODE: 'Invalid postal code',
  EMPTY_CART: 'Cart cannot be empty',
  MAX_ITEMS_EXCEEDED: 'Maximum 50 items allowed per order',
  INVALID_STATUS_TRANSITION: 'Invalid order status transition',
  ORDER_NOT_CANCELLABLE: 'Order cannot be cancelled at this stage',
  ORDER_NOT_EDITABLE: 'Order cannot be edited at this stage',
  PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
} as const;

export const ORDER_ERROR_CODES = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_EXISTS: 'ORDER_ALREADY_EXISTS',
  ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
  ORDER_UPDATE_FAILED: 'ORDER_UPDATE_FAILED',
  ORDER_CANCELLATION_FAILED: 'ORDER_CANCELLATION_FAILED',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
  INVALID_PAYMENT_STATUS: 'INVALID_PAYMENT_STATUS',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_COUPON: 'INVALID_COUPON',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_FAILED: 'REFUND_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export const ORDER_SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  ORDER_NUMBER: 'orderNumber',
  TOTAL_AMOUNT: 'totalAmount',
  STATUS: 'status',
} as const;

export const ORDER_FILTER_PRESETS = {
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

export const TAX_RATES = {
  GST_5: 5,
  GST_12: 12,
  GST_18: 18,
  GST_28: 28,
  CESS: 1,
} as const;

export const SHIPPING_ZONES = {
  LOCAL: {
    label: 'Local (Same City)',
    charge: 200,
    estimatedDays: 2,
  },
  REGIONAL: {
    label: 'Regional (Same State)',
    charge: 500,
    estimatedDays: 5,
  },
  NATIONAL: {
    label: 'National',
    charge: 1000,
    estimatedDays: 7,
  },
} as const;

export const PAYMENT_METHODS = {
  CARD: 'Credit/Debit Card',
  UPI: 'UPI',
  NET_BANKING: 'Net Banking',
  WALLET: 'Wallet',
  COD: 'Cash on Delivery',
  EMI: 'EMI',
} as const;

export const ORDER_METRICS = {
  AVERAGE_ORDER_VALUE: 'avg_order_value',
  ORDER_COMPLETION_RATE: 'order_completion_rate',
  CANCELLATION_RATE: 'cancellation_rate',
  RETURN_RATE: 'return_rate',
  AVERAGE_ITEMS_PER_ORDER: 'avg_items_per_order',
  AVERAGE_DELIVERY_TIME: 'avg_delivery_time',
} as const;

export const BULK_ORDER_THRESHOLD = 10;

export const PRIORITY_ORDER_THRESHOLD = 100000;

export const ORDER_CACHE_TTL = {
  ORDER_DETAILS: 300,
  ORDER_LIST: 60,
  ORDER_STATISTICS: 600,
  ORDER_COUNT: 120,
} as const;

export const ORDER_QUEUE_NAMES = {
  ORDER_PROCESSING: 'order:processing',
  ORDER_CONFIRMATION: 'order:confirmation',
  ORDER_NOTIFICATION: 'order:notification',
  PAYMENT_PROCESSING: 'payment:processing',
  INVENTORY_UPDATE: 'inventory:update',
  REFUND_PROCESSING: 'refund:processing',
} as const;

export const ORDER_EVENT_TYPES = {
  CREATED: 'ORDER_CREATED',
  UPDATED: 'ORDER_UPDATED',
  STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  CANCELLED: 'ORDER_CANCELLED',
  COMPLETED: 'ORDER_COMPLETED',
  PAYMENT_RECEIVED: 'ORDER_PAYMENT_RECEIVED',
  SHIPPED: 'ORDER_SHIPPED',
  DELIVERED: 'ORDER_DELIVERED',
  RETURNED: 'ORDER_RETURNED',
  REFUNDED: 'ORDER_REFUNDED',
} as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const ORDER_PERMISSION_ACTIONS = {
  CREATE: 'order:create',
  READ: 'order:read',
  UPDATE: 'order:update',
  DELETE: 'order:delete',
  CANCEL: 'order:cancel',
  REFUND: 'order:refund',
  VIEW_ALL: 'order:view_all',
  EXPORT: 'order:export',
} as const;

export const ORDER_AUDIT_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  STATUS_CHANGED: 'status_changed',
  CANCELLED: 'cancelled',
  ITEMS_MODIFIED: 'items_modified',
  PAYMENT_UPDATED: 'payment_updated',
  SHIPPING_UPDATED: 'shipping_updated',
  NOTES_ADDED: 'notes_added',
} as const;

export const ORDER_EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
} as const;

export const ORDER_REPORT_TYPES = {
  DAILY_SALES: 'daily_sales',
  MONTHLY_SALES: 'monthly_sales',
  PRODUCT_PERFORMANCE: 'product_performance',
  CUSTOMER_ORDERS: 'customer_orders',
  CANCELLED_ORDERS: 'cancelled_orders',
  PENDING_ORDERS: 'pending_orders',
  REVENUE_REPORT: 'revenue_report',
} as const;

export const CUSTOMIZATION_LIMITS = {
  MAX_DIMENSIONS_WIDTH: 10000,
  MAX_DIMENSIONS_HEIGHT: 10000,
  MAX_DIMENSIONS_DEPTH: 10000,
  MIN_DIMENSIONS: 100,
  MAX_SPECIAL_INSTRUCTIONS_LENGTH: 500,
} as const;

export const ORDER_WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'order.completed',
  'order.shipped',
  'order.delivered',
  'payment.success',
  'payment.failed',
  'refund.processed',
] as const;

export const ORDER_RATE_LIMITS = {
  CREATE_ORDER_PER_HOUR: 10,
  UPDATE_ORDER_PER_HOUR: 50,
  CANCEL_ORDER_PER_HOUR: 5,
  GET_ORDERS_PER_MINUTE: 100,
} as const;

export const ORDER_FEATURE_FLAGS = {
  ENABLE_COD: true,
  ENABLE_EMI: true,
  ENABLE_WALLET: true,
  ENABLE_INTERNATIONAL_SHIPPING: false,
  ENABLE_GIFT_WRAPPING: true,
  ENABLE_ORDER_TRACKING: true,
  ENABLE_SPLIT_PAYMENTS: false,
  ENABLE_PARTIAL_CANCELLATION: true,
} as const;