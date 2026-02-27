import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';
import { INVOICE_CONSTANTS } from './invoice.constants';

const invoiceItemSchema = z.object({
  description: z.string().min(1, {
    message: 'Item description is required',
  }),
  quantity: z.number().positive({
    message: 'Quantity must be positive',
  }),
  unitPrice: z.number().positive({
    message: 'Unit price must be positive',
  }),
  taxRate: z.number().min(0).max(100).default(18),
  discount: z.number().min(0).default(0).optional(),
});

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10).max(15),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default('India'),
  gstNumber: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    orderId: z.string().uuid({
      message: 'Invalid order ID format',
    }),
    customerId: z.string().uuid({
      message: 'Invalid customer ID format',
    }),
    invoiceDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    dueDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    items: z
      .array(invoiceItemSchema)
      .min(1, {
        message: 'At least one item is required',
      })
      .max(INVOICE_CONSTANTS.MAX_ITEMS_PER_INVOICE, {
        message: `Maximum ${INVOICE_CONSTANTS.MAX_ITEMS_PER_INVOICE} items allowed`,
      }),
    billingAddress: addressSchema,
    shippingAddress: addressSchema.optional(),
    currency: z
      .string()
      .length(3)
      .toUpperCase()
      .default('INR')
      .optional(),
    notes: z.string().max(500).optional(),
    terms: z.string().max(1000).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    dueDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
    notes: z.string().max(500).optional(),
    terms: z.string().max(1000).optional(),
  }),
});

export const generateInvoiceSchema = z.object({
  body: z.object({
    orderId: z.string().uuid({
      message: 'Invalid order ID format',
    }),
  }),
});

export const sendInvoiceSchema = z.object({
  body: z.object({
    email: z.string().email({
      message: 'Invalid email address',
    }),
  }),
});

export const markAsPaidSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid({
      message: 'Invalid payment ID format',
    }),
    paidAmount: z.number().positive().optional(),
  }),
});

export const cancelInvoiceSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(3, {
        message: 'Cancellation reason must be at least 3 characters',
      })
      .optional(),
  }),
});

export const voidInvoiceSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(3, {
        message: 'Void reason must be at least 3 characters',
      })
      .optional(),
  }),
});

export const applyDiscountSchema = z.object({
  body: z.object({
    discountAmount: z.number().positive().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    reason: z.string().optional(),
  }).refine(
    (data) => data.discountAmount !== undefined || data.discountPercentage !== undefined,
    {
      message: 'Either discountAmount or discountPercentage must be provided',
    }
  ),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1).max(1000, {
      message: 'Note must be between 1 and 1000 characters',
    }),
  }),
});

export const bulkGenerateSchema = z.object({
  body: z.object({
    orderIds: z
      .array(z.string().uuid())
      .min(1, {
        message: 'At least one order ID is required',
      })
      .max(50, {
        message: 'Maximum 50 orders can be processed at once',
      }),
  }),
});

export const invoiceQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().min(1))
      .default('1')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(
        z
          .number()
          .min(1)
          .max(INVOICE_CONSTANTS.MAX_PAGE_SIZE)
      )
      .default(String(INVOICE_CONSTANTS.DEFAULT_PAGE_SIZE))
      .optional(),
    status: z
      .nativeEnum(InvoiceStatus)
      .or(
        z
          .string()
          .transform((val) =>
            val.split(',').map((s) => s.trim() as InvoiceStatus)
          )
      )
      .optional(),
    customerId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    invoiceNumber: z.string().optional(),
    fromDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    toDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    minAmount: z
      .string()
      .regex(/^\d+\.?\d*$/)
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    maxAmount: z
      .string()
      .regex(/^\d+\.?\d*$/)
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    isPaid: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .optional(),
    isOverdue: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .optional(),
    sortBy: z
      .enum([
        'createdAt',
        'updatedAt',
        'invoiceDate',
        'dueDate',
        'totalAmount',
        'status',
      ])
      .default('createdAt')
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'])
      .default('desc')
      .optional(),
  }),
});

export const downloadInvoiceSchema = z.object({
  query: z.object({
    format: z
      .enum(['pdf', 'html'], {
        errorMap: () => ({ message: 'Format must be pdf or html' }),
      })
      .default('pdf')
      .optional(),
  }),
});

export const exportInvoicesSchema = z.object({
  query: z.object({
    format: z
      .enum(['csv', 'excel', 'pdf', 'json'], {
        errorMap: () => ({ message: 'Invalid export format' }),
      })
      .default('csv'),
    fromDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    toDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
  }),
});

export const getInvoiceStatisticsSchema = z.object({
  query: z.object({
    fromDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    toDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    groupBy: z
      .enum(['day', 'week', 'month', 'year'])
      .default('month')
      .optional(),
  }),
});

export const scheduleInvoiceSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    scheduledDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val)),
    autoSend: z.boolean().default(false),
  }),
});

export const recurringInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(invoiceItemSchema).min(1),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val)),
    endDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val))
      .optional(),
    billingAddress: addressSchema,
    currency: z.string().length(3).default('INR'),
  }),
});

export const creditNoteSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
    reason: z.string().min(3),
    items: z.array(invoiceItemSchema).optional(),
  }),
});

export const debitNoteSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
    reason: z.string().min(3),
    items: z.array(invoiceItemSchema).optional(),
  }),
});

export const proformaInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(invoiceItemSchema).min(1),
    billingAddress: addressSchema,
    shippingAddress: addressSchema.optional(),
    validUntil: z
      .string()
      .datetime()
      .transform((val) => new Date(val)),
    notes: z.string().optional(),
  }),
});

export const adjustInvoiceSchema = z.object({
  body: z.object({
    adjustmentType: z.enum(['ADD', 'SUBTRACT']),
    amount: z.number().positive(),
    reason: z.string().min(3),
    description: z.string().optional(),
  }),
});

export const attachDocumentSchema = z.object({
  body: z.object({
    documentType: z.enum(['CONTRACT', 'PURCHASE_ORDER', 'DELIVERY_NOTE', 'OTHER']),
    documentUrl: z.string().url(),
    description: z.string().optional(),
  }),
});

export const updatePaymentTermsSchema = z.object({
  body: z.object({
    paymentTerms: z.enum([
      'NET_7',
      'NET_15',
      'NET_30',
      'NET_60',
      'NET_90',
      'DUE_ON_RECEIPT',
      'CUSTOM',
    ]),
    customDays: z.number().min(1).max(365).optional(),
  }),
});

export const addLineItemSchema = z.object({
  body: z.object({
    item: invoiceItemSchema,
  }),
});

export const removeLineItemSchema = z.object({
  body: z.object({
    lineItemIndex: z.number().min(0),
  }),
});

export const updateLineItemSchema = z.object({
  body: z.object({
    lineItemIndex: z.number().min(0),
    item: invoiceItemSchema.partial(),
  }),
});

export const applyTaxSchema = z.object({
  body: z.object({
    taxType: z.enum(['CGST', 'SGST', 'IGST', 'GST', 'VAT', 'CUSTOM']),
    taxRate: z.number().min(0).max(100),
    applyToAllItems: z.boolean().default(true),
  }),
});

export const convertCurrencySchema = z.object({
  body: z.object({
    targetCurrency: z.string().length(3),
    exchangeRate: z.number().positive().optional(),
  }),
});

export const cloneInvoiceSchema = z.object({
  body: z.object({
    updateInvoiceDate: z.boolean().default(true),
    updateDueDate: z.boolean().default(true),
  }),
});

export const mergeInvoicesSchema = z.object({
  body: z.object({
    invoiceIds: z
      .array(z.string().uuid())
      .min(2, {
        message: 'At least two invoices are required to merge',
      })
      .max(10, {
        message: 'Maximum 10 invoices can be merged at once',
      }),
    customerId: z.string().uuid(),
  }),
});

export const splitInvoiceSchema = z.object({
  body: z.object({
    splits: z
      .array(
        z.object({
          amount: z.number().positive(),
          dueDate: z
            .string()
            .datetime()
            .transform((val) => new Date(val)),
          description: z.string().optional(),
        })
      )
      .min(2)
      .max(5),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type BulkGenerateInput = z.infer<typeof bulkGenerateSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type DownloadInvoiceInput = z.infer<typeof downloadInvoiceSchema>;
export type ExportInvoicesInput = z.infer<typeof exportInvoicesSchema>;
export type ScheduleInvoiceInput = z.infer<typeof scheduleInvoiceSchema>;
export type RecurringInvoiceInput = z.infer<typeof recurringInvoiceSchema>;
export type CreditNoteInput = z.infer<typeof creditNoteSchema>;
export type DebitNoteInput = z.infer<typeof debitNoteSchema>;
export type ProformaInvoiceInput = z.infer<typeof proformaInvoiceSchema>;
export type AdjustInvoiceInput = z.infer<typeof adjustInvoiceSchema>;
export type AttachDocumentInput = z.infer<typeof attachDocumentSchema>;
export type UpdatePaymentTermsInput = z.infer<typeof updatePaymentTermsSchema>;
export type AddLineItemInput = z.infer<typeof addLineItemSchema>;
export type RemoveLineItemInput = z.infer<typeof removeLineItemSchema>;
export type UpdateLineItemInput = z.infer<typeof updateLineItemSchema>;
export type ApplyTaxInput = z.infer<typeof applyTaxSchema>;
export type ConvertCurrencyInput = z.infer<typeof convertCurrencySchema>;
export type CloneInvoiceInput = z.infer<typeof cloneInvoiceSchema>;
export type MergeInvoicesInput = z.infer<typeof mergeInvoicesSchema>;
export type SplitInvoiceInput = z.infer<typeof splitInvoiceSchema>;