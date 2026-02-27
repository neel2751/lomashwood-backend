import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';

export interface InvoiceEntity extends Invoice {
  order?: OrderInfo;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount?: number;
  total?: number;
}

export interface InvoiceAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber?: string;
}

export interface CreateInvoiceDTO {
  orderId: string;
  customerId: string;
  invoiceDate?: Date;
  dueDate?: Date;
  items: InvoiceItem[];
  billingAddress: InvoiceAddress;
  shippingAddress?: InvoiceAddress;
  currency?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInvoiceDTO {
  dueDate?: Date;
  status?: InvoiceStatus;
  notes?: string;
  terms?: string;
}

export interface GenerateInvoiceDTO {
  orderId: string;
}

export interface SendInvoiceDTO {
  email: string;
}

export interface InvoiceResponseDTO {
  id: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount?: number;
  currency: string;
  items: InvoiceItem[];
  billingAddress: InvoiceAddress;
  shippingAddress?: InvoiceAddress;
  paymentId?: string;
  paidAt?: Date;
  sentAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  voidedAt?: Date;
  voidReason?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceListResponseDTO {
  invoices: InvoiceResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus | InvoiceStatus[];
  customerId?: string;
  orderId?: string;
  invoiceNumber?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isPaid?: boolean;
  isOverdue?: boolean;
  sortBy?: InvoiceSortField;
  sortOrder?: 'asc' | 'desc';
}

export type InvoiceSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'invoiceDate'
  | 'dueDate'
  | 'totalAmount'
  | 'status';

export interface InvoiceRepositoryFilters {
  status?: InvoiceStatus[];
  customerId?: string;
  orderId?: string;
  invoiceNumber?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  dueRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
  isPaid?: boolean;
  isOverdue?: boolean;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  draftInvoices: number;
  issuedInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  cancelledInvoices: number;
  voidInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  averageInvoiceValue: number;
  averagePaymentTime: number;
  period: {
    from: Date;
    to: Date;
  };
}

export interface InvoicePreview {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  content: string;
}

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InvoiceHistoryEntry {
  timestamp: Date;
  action: string;
  status: InvoiceStatus;
  amount?: number;
  reason?: string;
  performedBy?: string;
}

export interface BulkGenerateResult {
  successful: Array<{
    orderId: string;
    invoiceId: string;
    invoiceNumber: string;
  }>;
  failed: Array<{
    orderId: string;
    reason: string;
  }>;
  total: number;
}

export interface OrderInfo {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  status: string;
  items: any[];
  billingAddress: string;
  shippingAddress: string;
  notes?: string;
}

export interface InvoiceCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  breakdown: {
    itemsTotal: number;
    taxBreakdown: TaxBreakdown;
  };
}

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
  total: number;
}

export interface InvoiceSummary {
  invoiceId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  dueDate: Date;
  isOverdue: boolean;
}

export interface RecurringInvoice {
  id: string;
  customerId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  items: InvoiceItem[];
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: Date;
  endDate?: Date;
  nextInvoiceDate: Date;
  lastInvoiceDate?: Date;
  totalInvoicesGenerated: number;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  creditNoteNumber: string;
  amount: number;
  reason: string;
  items?: InvoiceItem[];
  issuedDate: Date;
  status: 'ISSUED' | 'APPLIED' | 'VOID';
}

export interface DebitNote {
  id: string;
  invoiceId: string;
  debitNoteNumber: string;
  amount: number;
  reason: string;
  items?: InvoiceItem[];
  issuedDate: Date;
  status: 'ISSUED' | 'APPLIED' | 'VOID';
}

export interface ProformaInvoice {
  id: string;
  proformaNumber: string;
  customerId: string;
  items: InvoiceItem[];
  totalAmount: number;
  validUntil: Date;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  convertedToInvoiceId?: string;
}

export interface InvoicePaymentSchedule {
  id: string;
  invoiceId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paidAmount?: number;
  paidAt?: Date;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  reminderType: 'BEFORE_DUE' | 'ON_DUE' | 'AFTER_DUE';
  sentAt: Date;
  recipient: string;
  status: 'SENT' | 'FAILED' | 'BOUNCED';
}

export interface InvoiceAttachment {
  id: string;
  invoiceId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface InvoiceNote {
  id: string;
  invoiceId: string;
  content: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface InvoiceAdjustment {
  id: string;
  invoiceId: string;
  adjustmentType: 'ADD' | 'SUBTRACT';
  amount: number;
  reason: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export interface InvoiceDiscount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  amount: number;
  reason?: string;
  appliedTo: 'INVOICE' | 'LINE_ITEM';
}

export interface InvoiceTax {
  taxType: 'CGST' | 'SGST' | 'IGST' | 'GST' | 'VAT' | 'CUSTOM';
  taxName: string;
  taxRate: number;
  taxAmount: number;
  isInclusive: boolean;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: InvoiceDiscount;
  taxes: InvoiceTax[];
  subtotal: number;
  total: number;
}

export interface InvoicePaymentTerms {
  type: 'NET_7' | 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90' | 'DUE_ON_RECEIPT' | 'CUSTOM';
  days?: number;
  description?: string;
}

export interface InvoiceAuditLog {
  id: string;
  invoiceId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface InvoiceReport {
  id: string;
  type: 'AGING' | 'REVENUE' | 'TAX' | 'CUSTOMER' | 'OVERDUE';
  fromDate: Date;
  toDate: Date;
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

export interface InvoiceAgingReport {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91Plus: number;
  totalOutstanding: number;
}

export interface InvoiceRevenueReport {
  period: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  averageInvoiceValue: number;
}

export class InvoiceNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Invoice with identifier ${identifier} not found`);
    this.name = 'InvoiceNotFoundError';
  }
}

export class InvoiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceValidationError';
  }
}

export class InvoiceGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceGenerationError';
  }
}

export class InvoiceAlreadyExistsError extends Error {
  constructor(orderId: string) {
    super(`Invoice already exists for order ${orderId}`);
    this.name = 'InvoiceAlreadyExistsError';
  }
}

export class InvoiceUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceUpdateError';
  }
}

export class InvoiceCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceCancellationError';
  }
}

export class InvoicePaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoicePaymentError';
  }
}

export class InvoiceEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceEmailError';
  }
}