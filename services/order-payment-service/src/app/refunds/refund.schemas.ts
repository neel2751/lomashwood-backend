import { z } from 'zod';
import { RefundStatus } from '@prisma/client';
import { REFUND_REASONS, REFUND_CONSTANTS } from './refund.constants';

const UUIDSchema = z.string().uuid({ message: 'Must be a valid UUID' });

const CurrencySchema = z
  .string()
  .length(3)
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, { message: 'Must be a valid ISO 4217 currency code' });

const AmountSchema = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .positive({ message: 'Amount must be greater than zero' })
  .multipleOf(0.01, { message: 'Amount must have at most 2 decimal places' })
  .max(REFUND_CONSTANTS.MAX_REFUND_AMOUNT, {
    message: `Amount cannot exceed ${REFUND_CONSTANTS.MAX_REFUND_AMOUNT}`,
  });

const ReasonSchema = z
  .string()
  .min(1, { message: 'Reason is required' })
  .max(500, { message: 'Reason must be at most 500 characters' });

const NotesSchema = z
  .string()
  .max(1000, { message: 'Notes must be at most 1000 characters' })
  .optional();

const MetadataSchema = z
  .record(z.string(), z.unknown())
  .optional();

export const CreateRefundSchema = z
  .object({
    orderId: UUIDSchema,
    amount: AmountSchema.optional(),
    reason: ReasonSchema,
    notes: NotesSchema,
    metadata: MetadataSchema,
  })
  .strict();

export const BulkRefundSchema = z
  .object({
    orderIds: z
      .array(UUIDSchema)
      .min(1, { message: 'At least one orderId is required' })
      .max(REFUND_CONSTANTS.MAX_BULK_REFUND_SIZE, {
        message: `Cannot exceed ${REFUND_CONSTANTS.MAX_BULK_REFUND_SIZE} orders per bulk request`,
      }),
    reason: ReasonSchema,
  })
  .strict();

export const CancelRefundSchema = z
  .object({
    refundId: UUIDSchema,
  })
  .strict();

export const RetryRefundSchema = z
  .object({
    refundId: UUIDSchema,
  })
  .strict();

export const GetRefundSchema = z
  .object({
    refundId: UUIDSchema,
  })
  .strict();

export const GetRefundsByOrderSchema = z
  .object({
    orderId: UUIDSchema,
  })
  .strict();

export const GetRefundSummarySchema = z
  .object({
    orderId: UUIDSchema,
  })
  .strict();

export const CheckEligibilitySchema = z
  .object({
    orderId: UUIDSchema,
  })
  .strict();

export const ListRefundsSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1, { message: 'Page must be at least 1' })),

    limit: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? parseInt(v, 10) : 20))
      .pipe(
        z
          .number()
          .int()
          .min(1, { message: 'Limit must be at least 1' })
          .max(100, { message: 'Limit cannot exceed 100' }),
      ),

    sortBy: z
      .enum(['createdAt', 'updatedAt', 'amount', 'status', 'settledAt', 'processedAt'])
      .optional()
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

    orderId: UUIDSchema.optional(),

    paymentId: UUIDSchema.optional(),

    status: z
      .union([
        z.nativeEnum(RefundStatus),
        z.array(z.nativeEnum(RefundStatus)).min(1),
      ])
      .optional(),

    requestedBy: z.string().uuid().optional(),

    currency: CurrencySchema.optional(),

    stripeRefundId: z
      .string()
      .startsWith('re_', { message: 'Must be a valid Stripe refund ID' })
      .optional(),

    amountMin: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? parseFloat(v) : undefined))
      .pipe(
        z
          .number()
          .positive()
          .optional(),
      ),

    amountMax: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? parseFloat(v) : undefined))
      .pipe(
        z
          .number()
          .positive()
          .optional(),
      ),

    createdFrom: z
      .string()
      .datetime({ message: 'createdFrom must be a valid ISO 8601 datetime' })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),

    createdTo: z
      .string()
      .datetime({ message: 'createdTo must be a valid ISO 8601 datetime' })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),

    settledFrom: z
      .string()
      .datetime({ message: 'settledFrom must be a valid ISO 8601 datetime' })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),

    settledTo: z
      .string()
      .datetime({ message: 'settledTo must be a valid ISO 8601 datetime' })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),

    search: z
      .string()
      .max(200, { message: 'Search term must be at most 200 characters' })
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.amountMin !== undefined && data.amountMax !== undefined) {
        return data.amountMin <= data.amountMax;
      }
      return true;
    },
    { message: 'amountMin must be less than or equal to amountMax', path: ['amountMin'] },
  )
  .refine(
    (data) => {
      if (data.createdFrom && data.createdTo) {
        return data.createdFrom <= data.createdTo;
      }
      return true;
    },
    { message: 'createdFrom must be before or equal to createdTo', path: ['createdFrom'] },
  )
  .refine(
    (data) => {
      if (data.settledFrom && data.settledTo) {
        return data.settledFrom <= data.settledTo;
      }
      return true;
    },
    { message: 'settledFrom must be before or equal to settledTo', path: ['settledFrom'] },
  );

export type CreateRefundDto = z.infer<typeof CreateRefundSchema>;
export type BulkRefundDto = z.infer<typeof BulkRefundSchema>;
export type CancelRefundDto = z.infer<typeof CancelRefundSchema>;
export type RetryRefundDto = z.infer<typeof RetryRefundSchema>;
export type GetRefundDto = z.infer<typeof GetRefundSchema>;
export type GetRefundsByOrderDto = z.infer<typeof GetRefundsByOrderSchema>;
export type GetRefundSummaryDto = z.infer<typeof GetRefundSummarySchema>;
export type CheckEligibilityDto = z.infer<typeof CheckEligibilitySchema>;
export type ListRefundsDto = z.infer<typeof ListRefundsSchema>;