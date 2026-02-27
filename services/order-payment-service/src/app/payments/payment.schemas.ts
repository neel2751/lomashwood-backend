import { z } from 'zod';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { PAYMENT_CONSTANTS } from './payment.constants';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid({
      message: 'Invalid order ID format',
    }),
    customerId: z.string().uuid({
      message: 'Invalid customer ID format',
    }),
    amount: z
      .number()
      .min(PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT, {
        message: `Minimum payment amount is ₹${PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT}`,
      })
      .max(PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT, {
        message: `Maximum payment amount is ₹${PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT}`,
      }),
    currency: z
      .string()
      .length(3)
      .toUpperCase()
      .default('INR')
      .optional(),
    method: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: 'Invalid payment method' }),
    }),
    provider: z.enum(['stripe', 'razorpay'], {
      errorMap: () => ({ message: 'Invalid payment provider' }),
    }),
    metadata: z.record(z.any()).optional(),
  }),
});

export const processPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid({
      message: 'Invalid payment ID format',
    }),
    transactionId: z.string().optional(),
    signature: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid({
      message: 'Invalid payment ID format',
    }),
    transactionId: z.string().min(1, {
      message: 'Transaction ID is required',
    }),
    signature: z.string().optional(),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive({
        message: 'Refund amount must be positive',
      })
      .optional(),
    reason: z.string().min(3, {
      message: 'Refund reason must be at least 3 characters',
    }),
    metadata: z.record(z.any()).optional(),
  }),
});

export const capturePaymentSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive({
        message: 'Capture amount must be positive',
      })
      .optional(),
  }),
});

export const cancelPaymentSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(3, {
        message: 'Cancellation reason must be at least 3 characters',
      })
      .optional(),
  }),
});

export const savePaymentMethodSchema = z.object({
  body: z.object({
    paymentMethodId: z.string().min(1, {
      message: 'Payment method ID is required',
    }),
    setAsDefault: z.boolean().default(false),
  }),
});

export const retryPaymentSchema = z.object({
  body: z.object({
    paymentMethodId: z.string().optional(),
  }),
});

export const reconcilePaymentsSchema = z.object({
  body: z.object({
    fromDate: z
      .string()
      .datetime({
        message: 'Invalid from date format',
      })
      .or(z.date()),
    toDate: z
      .string()
      .datetime({
        message: 'Invalid to date format',
      })
      .or(z.date()),
  }),
});

export const exportPaymentsSchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'excel', 'pdf', 'json'], {
      errorMap: () => ({ message: 'Invalid export format' }),
    }).default('csv'),
    fromDate: z
      .string()
      .datetime({
        message: 'Invalid from date format',
      })
      .optional(),
    toDate: z
      .string()
      .datetime({
        message: 'Invalid to date format',
      })
      .optional(),
  }),
});

export const paymentQuerySchema = z.object({
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
          .max(PAYMENT_CONSTANTS.MAX_PAGE_SIZE)
      )
      .default(String(PAYMENT_CONSTANTS.DEFAULT_PAGE_SIZE))
      .optional(),
    status: z
      .nativeEnum(PaymentStatus)
      .or(
        z
          .string()
          .transform((val) =>
            val.split(',').map((s) => s.trim() as PaymentStatus)
          )
      )
      .optional(),
    method: z
      .nativeEnum(PaymentMethod)
      .or(
        z
          .string()
          .transform((val) =>
            val.split(',').map((m) => m.trim() as PaymentMethod)
          )
      )
      .optional(),
    provider: z.string().optional(),
    orderId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    transactionId: z.string().optional(),
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
    sortBy: z
      .enum([
        'createdAt',
        'updatedAt',
        'amount',
        'status',
        'paidAt',
      ])
      .default('createdAt')
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'])
      .default('desc')
      .optional(),
  }),
});

export const webhookStripeSchema = z.object({
  body: z.any(),
});

export const webhookRazorpaySchema = z.object({
  body: z.any(),
});

export const validateAmountSchema = z.object({
  body: z.object({
    orderId: z.string().uuid({
      message: 'Invalid order ID format',
    }),
    amount: z.number().positive({
      message: 'Amount must be positive',
    }),
  }),
});

export const getPaymentsByCustomerSchema = z.object({
  query: z.object({
    customerId: z.string().uuid({
      message: 'Invalid customer ID format',
    }),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().min(1).max(100))
      .default('10')
      .optional(),
  }),
});

export const getPaymentHistorySchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid payment ID format',
    }),
  }),
});

export const getPaymentStatisticsSchema = z.object({
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
      .default('day')
      .optional(),
  }),
});

export const getPaymentAnalyticsSchema = z.object({
  query: z.object({
    period: z
      .enum(['day', 'week', 'month', 'year'])
      .default('month')
      .optional(),
    groupBy: z
      .enum(['hour', 'day', 'week', 'month'])
      .default('day')
      .optional(),
  }),
});

export const bulkRefundSchema = z.object({
  body: z.object({
    paymentIds: z
      .array(z.string().uuid())
      .min(1, {
        message: 'At least one payment ID is required',
      })
      .max(50, {
        message: 'Maximum 50 payments can be refunded at once',
      }),
    reason: z.string().min(3, {
      message: 'Refund reason must be at least 3 characters',
    }),
  }),
});

export const schedulePaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    amount: z
      .number()
      .min(PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT)
      .max(PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT),
    currency: z.string().length(3).default('INR'),
    method: z.nativeEnum(PaymentMethod),
    scheduledAt: z
      .string()
      .datetime()
      .transform((val) => new Date(val)),
    metadata: z.record(z.any()).optional(),
  }),
});

export const splitPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    totalAmount: z
      .number()
      .min(PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT),
    splits: z
      .array(
        z.object({
          amount: z.number().positive(),
          method: z.nativeEnum(PaymentMethod),
          description: z.string().optional(),
        })
      )
      .min(2, {
        message: 'At least 2 payment splits required',
      })
      .max(5, {
        message: 'Maximum 5 payment splits allowed',
      }),
  }),
});

export const partialRefundSchema = z.object({
  body: z.object({
    amount: z.number().positive({
      message: 'Refund amount must be positive',
    }),
    reason: z.string().min(3),
    lineItems: z
      .array(
        z.object({
          orderItemId: z.string().uuid(),
          amount: z.number().positive(),
        })
      )
      .optional(),
  }),
});

export const createPayoutSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3).default('INR'),
    destination: z.string().min(1),
    description: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const disputeResponseSchema = z.object({
  body: z.object({
    disputeId: z.string().min(1),
    evidence: z.object({
      customerName: z.string().optional(),
      customerEmailAddress: z.string().email().optional(),
      customerPurchaseIp: z.string().optional(),
      billingAddress: z.string().optional(),
      receipt: z.string().optional(),
      customerSignature: z.string().optional(),
      uncategorizedText: z.string().optional(),
    }),
  }),
});

export const updatePaymentMetadataSchema = z.object({
  body: z.object({
    metadata: z.record(z.any()),
  }),
});

export const calculateFeesSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    method: z.nativeEnum(PaymentMethod),
    provider: z.enum(['stripe', 'razorpay']),
  }),
});

export const createSubscriptionPaymentSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    planId: z.string().min(1),
    amount: z.number().positive(),
    interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    startDate: z
      .string()
      .datetime()
      .transform((val) => new Date(val)),
  }),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type CapturePaymentInput = z.infer<typeof capturePaymentSchema>;
export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>;
export type SavePaymentMethodInput = z.infer<typeof savePaymentMethodSchema>;
export type RetryPaymentInput = z.infer<typeof retryPaymentSchema>;
export type ReconcilePaymentsInput = z.infer<typeof reconcilePaymentsSchema>;
export type ExportPaymentsInput = z.infer<typeof exportPaymentsSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type ValidateAmountInput = z.infer<typeof validateAmountSchema>;
export type BulkRefundInput = z.infer<typeof bulkRefundSchema>;
export type SchedulePaymentInput = z.infer<typeof schedulePaymentSchema>;
export type SplitPaymentInput = z.infer<typeof splitPaymentSchema>;
export type PartialRefundInput = z.infer<typeof partialRefundSchema>;
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
export type DisputeResponseInput = z.infer<typeof disputeResponseSchema>;
export type UpdatePaymentMetadataInput = z.infer<typeof updatePaymentMetadataSchema>;
export type CalculateFeesInput = z.infer<typeof calculateFeesSchema>;
export type CreateSubscriptionPaymentInput = z.infer<typeof createSubscriptionPaymentSchema>;