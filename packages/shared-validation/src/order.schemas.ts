import { z } from "zod";

export const OrderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const PaymentMethodEnum = z.enum([
  "STRIPE",
  "RAZORPAY",
  "BANK_TRANSFER",
  "CASH",
]);

export const AddressSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  addressLine1: z.string().min(5).max(255).trim(),
  addressLine2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  county: z.string().max(100).trim().optional(),
  postcode: z.string().min(3).max(10).trim().toUpperCase(),
  country: z.string().length(2).toUpperCase().default("GB"),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
});

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  sizeId: z.string().uuid().optional(),
  colourId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(999),
  unitPrice: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(50),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  sameAsBilling: z.boolean().optional().default(true),
  couponCode: z.string().max(50).trim().toUpperCase().optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: PaymentMethodEnum,
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional(),
  cancellationReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const OrderFilterSchema = z.object({
  status: OrderStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["created_asc", "created_desc", "amount_asc", "amount_desc"])
    .optional()
    .default("created_desc"),
});

export const CreatePaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: PaymentMethodEnum,
  currency: z.string().length(3).toUpperCase().default("GBP"),
  savePaymentMethod: z.boolean().optional().default(false),
  returnUrl: z.string().url().optional(),
});

export const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export const RefundSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.enum([
    "DUPLICATE",
    "FRAUDULENT",
    "CUSTOMER_REQUEST",
    "PRODUCT_DEFECT",
    "OTHER",
  ]),
  description: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

export const CouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  categories: z.array(z.enum(["KITCHEN", "BEDROOM"])).optional().default([]),
  productIds: z.array(z.string().uuid()).optional().default([]),
});

export const ApplyCouponSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
  orderId: z.string().uuid().optional(),
  cartTotal: z.number().positive(),
});

export const InvoiceFilterSchema = z.object({
  orderId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type OrderStatusEnumType = z.infer<typeof OrderStatusEnum>;
export type PaymentStatusEnumType = z.infer<typeof PaymentStatusEnum>;
export type PaymentMethodEnumType = z.infer<typeof PaymentMethodEnum>;
export type AddressInput = z.infer<typeof AddressSchema>;
export type OrderItemInput = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderFilterInput = z.infer<typeof OrderFilterSchema>;
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>;
export type StripeWebhookInput = z.infer<typeof StripeWebhookSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;
export type CouponInput = z.infer<typeof CouponSchema>;
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;
export type InvoiceFilterInput = z.infer<typeof InvoiceFilterSchema>;