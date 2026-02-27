import { InvoiceStatus } from '@prisma/client';

export const INVOICE_CONSTANTS = {
  INVOICE_NUMBER_PREFIX: 'INV',
  
  DEFAULT_DUE_DAYS: 30,
  OVERDUE_GRACE_PERIOD_DAYS: 3,
  
  MAX_ITEMS_PER_INVOICE: 100,
  MIN_ITEMS_PER_INVOICE: 1,
  
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  DEFAULT_CURRENCY: 'INR',
  SUPPORTED_CURRENCIES: ['INR', 'USD', 'EUR', 'GBP'],
  
  DEFAULT_TAX_RATE: 18,
  CGST_RATE: 9,
  SGST_RATE: 9,
  IGST_RATE: 18,
  
  MIN_INVOICE_AMOUNT: 1,
  MAX_INVOICE_AMOUNT: 100000000,
  
  CACHE_TTL: {
    INVOICE_DETAILS: 300,
    INVOICE_LIST: 60,
    INVOICE_STATISTICS: 600,
    INVOICE_COUNT: 120,
  },
  
  PAYMENT_REMINDER_DAYS: [7, 3, 1, -1, -7],
  
  DEFAULT_TERMS: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.',
} as const;

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Draft',
  [InvoiceStatus.ISSUED]: 'Issued',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
  [InvoiceStatus.VOID]: 'Void',
  [InvoiceStatus.PARTIALLY_PAID]: 'Partially Paid',
};

export const INVOICE_STATUS_FLOW: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [
    InvoiceStatus.ISSUED,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.VOID,
  ],
  [InvoiceStatus.ISSUED]: [
    InvoiceStatus.PAID,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.VOID,
  ],
  [InvoiceStatus.OVERDUE]: [
    InvoiceStatus.PAID,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.VOID,
  ],
  [InvoiceStatus.PARTIALLY_PAID]: [
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
  ],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.CANCELLED]: [],
  [InvoiceStatus.VOID]: [],
};

export const INVOICE_ERROR_CODES = {
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  INVOICE_ALREADY_EXISTS: 'INVOICE_ALREADY_EXISTS',
  INVOICE_CREATION_FAILED: 'INVOICE_CREATION_FAILED',
  INVOICE_UPDATE_FAILED: 'INVOICE_UPDATE_FAILED',
  INVOICE_NOT_EDITABLE: 'INVOICE_NOT_EDITABLE',
  INVOICE_NOT_CANCELLABLE: 'INVOICE_NOT_CANCELLABLE',
  INVALID_INVOICE_STATUS: 'INVALID_INVOICE_STATUS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INVALID_INVOICE_ITEMS: 'INVALID_INVOICE_ITEMS',
  INVALID_INVOICE_AMOUNT: 'INVALID_INVOICE_AMOUNT',
  INVOICE_ALREADY_PAID: 'INVOICE_ALREADY_PAID',
  INVOICE_GENERATION_FAILED: 'INVOICE_GENERATION_FAILED',
  INVOICE_SEND_FAILED: 'INVOICE_SEND_FAILED',
  INVALID_DUE_DATE: 'INVALID_DUE_DATE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PDF_GENERATION_ERROR: 'PDF_GENERATION_ERROR',
  EMAIL_SENDING_ERROR: 'EMAIL_SENDING_ERROR',
} as const;

export const INVOICE_ERROR_MESSAGES: Record<string, string> = {
  INVOICE_NOT_FOUND: 'Invoice not found',
  INVOICE_ALREADY_EXISTS: 'Invoice already exists for this order',
  INVOICE_CREATION_FAILED: 'Failed to create invoice',
  INVOICE_UPDATE_FAILED: 'Failed to update invoice',
  INVOICE_NOT_EDITABLE: 'Invoice cannot be edited',
  INVOICE_NOT_CANCELLABLE: 'Invoice cannot be cancelled',
  INVALID_INVOICE_STATUS: 'Invalid invoice status',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  INVALID_INVOICE_ITEMS: 'Invalid invoice items',
  INVALID_INVOICE_AMOUNT: 'Invalid invoice amount',
  INVOICE_ALREADY_PAID: 'Invoice has already been paid',
  INVOICE_GENERATION_FAILED: 'Failed to generate invoice',
  INVOICE_SEND_FAILED: 'Failed to send invoice',
  INVALID_DUE_DATE: 'Due date cannot be in the past',
  ORDER_NOT_FOUND: 'Order not found',
  CUSTOMER_NOT_FOUND: 'Customer not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  VALIDATION_ERROR: 'Validation error',
  DATABASE_ERROR: 'Database error occurred',
  PDF_GENERATION_ERROR: 'Failed to generate PDF',
  EMAIL_SENDING_ERROR: 'Failed to send email',
};

export const INVOICE_VALIDATION_MESSAGES = {
  INVALID_ORDER_ID: 'Invalid order ID',
  INVALID_CUSTOMER_ID: 'Invalid customer ID',
  INVALID_ITEMS: 'At least one item is required',
  INVALID_BILLING_ADDRESS: 'Invalid billing address',
  INVALID_AMOUNT: 'Invoice amount must be greater than 0',
  INVALID_CURRENCY: 'Invalid currency code',
  INVALID_TAX_RATE: 'Tax rate must be between 0 and 100',
  INVALID_DISCOUNT: 'Discount cannot exceed item price',
  INVALID_QUANTITY: 'Quantity must be positive',
  INVALID_UNIT_PRICE: 'Unit price must be positive',
  DUPLICATE_INVOICE: 'Invoice already exists for this order',
  PAST_DUE_DATE: 'Due date cannot be in the past',
  INVALID_PAYMENT_TERMS: 'Invalid payment terms',
} as const;

export const INVOICE_NOTIFICATION_EVENTS = {
  INVOICE_CREATED: 'invoice.created',
  INVOICE_ISSUED: 'invoice.issued',
  INVOICE_SENT: 'invoice.sent',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  INVOICE_CANCELLED: 'invoice.cancelled',
  INVOICE_VOIDED: 'invoice.voided',
  PAYMENT_REMINDER_SENT: 'invoice.reminder.sent',
  INVOICE_UPDATED: 'invoice.updated',
} as const;

export const INVOICE_EMAIL_TEMPLATES = {
  INVOICE_CREATED: 'invoice-created',
  INVOICE_SENT: 'invoice-sent',
  INVOICE_REMINDER: 'invoice-reminder',
  INVOICE_OVERDUE: 'invoice-overdue',
  INVOICE_PAID: 'invoice-paid',
  INVOICE_CANCELLED: 'invoice-cancelled',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
} as const;

export const INVOICE_SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  INVOICE_DATE: 'invoiceDate',
  DUE_DATE: 'dueDate',
  TOTAL_AMOUNT: 'totalAmount',
  STATUS: 'status',
  INVOICE_NUMBER: 'invoiceNumber',
} as const;

export const INVOICE_FILTER_PRESETS = {
  TODAY: {
    label: 'Today',
    days: 0,
  },
  THIS_WEEK: {
    label: 'This Week',
    days: 7,
  },
  THIS_MONTH: {
    label: 'This Month',
    type: 'month',
  },
  LAST_30_DAYS: {
    label: 'Last 30 Days',
    days: 30,
  },
  LAST_90_DAYS: {
    label: 'Last 90 Days',
    days: 90,
  },
  THIS_QUARTER: {
    label: 'This Quarter',
    type: 'quarter',
  },
  THIS_YEAR: {
    label: 'This Year',
    type: 'year',
  },
} as const;

export const PAYMENT_TERMS = {
  NET_7: {
    label: 'Net 7',
    days: 7,
  },
  NET_15: {
    label: 'Net 15',
    days: 15,
  },
  NET_30: {
    label: 'Net 30',
    days: 30,
  },
  NET_60: {
    label: 'Net 60',
    days: 60,
  },
  NET_90: {
    label: 'Net 90',
    days: 90,
  },
  DUE_ON_RECEIPT: {
    label: 'Due on Receipt',
    days: 0,
  },
} as const;

export const TAX_TYPES = {
  CGST: 'Central Goods and Services Tax',
  SGST: 'State Goods and Services Tax',
  IGST: 'Integrated Goods and Services Tax',
  GST: 'Goods and Services Tax',
  VAT: 'Value Added Tax',
  CESS: 'Cess',
} as const;

export const INVOICE_FORMATS = {
  PDF: 'pdf',
  HTML: 'html',
  JSON: 'json',
  XML: 'xml',
} as const;

export const INVOICE_EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
} as const;

export const INVOICE_REPORT_TYPES = {
  AGING: 'aging',
  REVENUE: 'revenue',
  TAX_SUMMARY: 'tax_summary',
  CUSTOMER_SUMMARY: 'customer_summary',
  OVERDUE_REPORT: 'overdue_report',
  PAYMENT_COLLECTION: 'payment_collection',
  OUTSTANDING_REPORT: 'outstanding_report',
} as const;

export const INVOICE_METRICS = {
  TOTAL_INVOICED: 'total_invoiced',
  TOTAL_PAID: 'total_paid',
  TOTAL_OUTSTANDING: 'total_outstanding',
  AVERAGE_INVOICE_VALUE: 'avg_invoice_value',
  AVERAGE_PAYMENT_TIME: 'avg_payment_time',
  COLLECTION_RATE: 'collection_rate',
  OVERDUE_RATE: 'overdue_rate',
} as const;

export const INVOICE_QUEUE_NAMES = {
  INVOICE_GENERATION: 'invoice:generation',
  INVOICE_SENDING: 'invoice:sending',
  PAYMENT_REMINDER: 'invoice:reminder',
  OVERDUE_CHECK: 'invoice:overdue',
  PDF_GENERATION: 'invoice:pdf',
  RECONCILIATION: 'invoice:reconciliation',
} as const;

export const INVOICE_EVENT_TYPES = {
  CREATED: 'INVOICE_CREATED',
  UPDATED: 'INVOICE_UPDATED',
  STATUS_CHANGED: 'INVOICE_STATUS_CHANGED',
  SENT: 'INVOICE_SENT',
  PAID: 'INVOICE_PAID',
  CANCELLED: 'INVOICE_CANCELLED',
  VOIDED: 'INVOICE_VOIDED',
  OVERDUE: 'INVOICE_OVERDUE',
} as const;

export const INVOICE_PERMISSION_ACTIONS = {
  CREATE: 'invoice:create',
  READ: 'invoice:read',
  UPDATE: 'invoice:update',
  DELETE: 'invoice:delete',
  SEND: 'invoice:send',
  MARK_PAID: 'invoice:mark_paid',
  CANCEL: 'invoice:cancel',
  VOID: 'invoice:void',
  VIEW_ALL: 'invoice:view_all',
  EXPORT: 'invoice:export',
  GENERATE: 'invoice:generate',
} as const;

export const INVOICE_AUDIT_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  STATUS_CHANGED: 'status_changed',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  VOIDED: 'voided',
  REMINDER_SENT: 'reminder_sent',
  DISCOUNT_APPLIED: 'discount_applied',
  NOTE_ADDED: 'note_added',
  REGENERATED: 'regenerated',
} as const;

export const AGING_BUCKETS = {
  CURRENT: {
    label: 'Current',
    min: 0,
    max: 0,
  },
  DAYS_1_30: {
    label: '1-30 Days',
    min: 1,
    max: 30,
  },
  DAYS_31_60: {
    label: '31-60 Days',
    min: 31,
    max: 60,
  },
  DAYS_61_90: {
    label: '61-90 Days',
    min: 61,
    max: 90,
  },
  DAYS_91_PLUS: {
    label: '90+ Days',
    min: 91,
    max: Infinity,
  },
} as const;

export const INVOICE_TEMPLATES = {
  STANDARD: 'standard',
  PROFESSIONAL: 'professional',
  MINIMAL: 'minimal',
  DETAILED: 'detailed',
  CORPORATE: 'corporate',
} as const;

export const RECURRING_FREQUENCIES = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'Percentage',
  FIXED: 'Fixed Amount',
  EARLY_PAYMENT: 'Early Payment Discount',
  VOLUME: 'Volume Discount',
  PROMOTIONAL: 'Promotional Discount',
} as const;

export const INVOICE_NOTES_MAX_LENGTH = 1000;
export const INVOICE_TERMS_MAX_LENGTH = 2000;
export const INVOICE_DESCRIPTION_MAX_LENGTH = 500;

export const INVOICE_NUMBER_FORMAT = {
  PREFIX_LENGTH: 3,
  SEQUENCE_LENGTH: 6,
  INCLUDE_YEAR: true,
  INCLUDE_MONTH: false,
  SEPARATOR: '-',
} as const;

export const INVOICE_PDF_CONFIG = {
  PAGE_SIZE: 'A4',
  ORIENTATION: 'portrait',
  MARGINS: {
    TOP: 50,
    RIGHT: 50,
    BOTTOM: 50,
    LEFT: 50,
  },
  FONT: 'Helvetica',
  FONT_SIZE: 10,
} as const;

export const INVOICE_RATE_LIMITS = {
  CREATE_INVOICE_PER_HOUR: 50,
  SEND_INVOICE_PER_HOUR: 100,
  DOWNLOAD_INVOICE_PER_MINUTE: 20,
  GENERATE_INVOICE_PER_HOUR: 100,
  BULK_GENERATE_PER_HOUR: 10,
} as const;

export const INVOICE_FEATURE_FLAGS = {
  ENABLE_AUTO_NUMBERING: true,
  ENABLE_RECURRING_INVOICES: true,
  ENABLE_PROFORMA_INVOICES: true,
  ENABLE_CREDIT_NOTES: true,
  ENABLE_DEBIT_NOTES: true,
  ENABLE_MULTI_CURRENCY: true,
  ENABLE_TAX_CALCULATION: true,
  ENABLE_PAYMENT_REMINDERS: true,
  ENABLE_AUTO_OVERDUE_MARKING: true,
  ENABLE_BATCH_OPERATIONS: true,
} as const;

export const LATE_FEE_CONFIG = {
  ENABLED: false,
  PERCENTAGE: 2,
  FIXED_AMOUNT: 100,
  GRACE_PERIOD_DAYS: 3,
  MAX_LATE_FEE: 5000,
} as const;

export const CREDIT_NOTE_PREFIX = 'CN';
export const DEBIT_NOTE_PREFIX = 'DN';
export const PROFORMA_INVOICE_PREFIX = 'PRO';

export const INVOICE_CACHE_KEYS = {
  INVOICE_DETAILS: (id: string) => `invoice:details:${id}`,
  INVOICE_LIST: (filters: string) => `invoice:list:${filters}`,
  INVOICE_STATS: (period: string) => `invoice:stats:${period}`,
  INVOICE_COUNT: 'invoice:count',
  CUSTOMER_INVOICES: (customerId: string) => `invoice:customer:${customerId}`,
} as const;