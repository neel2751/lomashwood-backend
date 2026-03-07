import { z } from 'zod';

// Order schema
export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  items: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    productName: z.string(),
    productImage: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    options: z.record(z.any()).optional(),
  })),
  subtotal: z.number(),
  tax: z.number(),
  shipping: z.number(),
  discount: z.number(),
  total: z.number(),
  currency: z.string(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  notes: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  trackingNumber: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    options: z.record(z.any()).optional(),
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  notes: z.string().optional(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
});

export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusSchema>;

// Payment schema
export const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']),
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'bank_transfer']),
  provider: z.string(),
  transactionId: z.string().optional(),
  gatewayResponse: z.record(z.any()).optional(),
  failureReason: z.string().optional(),
  refundedAmount: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'bank_transfer']),
  provider: z.string(),
  returnUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export type CreatePaymentRequest = z.infer<typeof CreatePaymentSchema>;

export const PaymentWebhookSchema = z.object({
  provider: z.string(),
  eventType: z.string(),
  data: z.record(z.any()),
  signature: z.string(),
});

export type PaymentWebhookRequest = z.infer<typeof PaymentWebhookSchema>;

// Invoice schema
export const InvoiceSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  invoiceNumber: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    taxRate: z.number(),
    taxAmount: z.number(),
  })),
  subtotal: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  currency: z.string(),
  dueDate: z.string().datetime(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const GenerateInvoiceSchema = z.object({
  orderId: z.string(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

export type GenerateInvoiceRequest = z.infer<typeof GenerateInvoiceSchema>;

// Refund schema
export const RefundSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  paymentId: z.string(),
  customerId: z.string(),
  amount: z.number(),
  reason: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'processed', 'failed']),
  refundId: z.string().optional(),
  processedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Refund = z.infer<typeof RefundSchema>;

export const CreateRefundSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  reason: z.string(),
});

export type CreateRefundRequest = z.infer<typeof CreateRefundSchema>;

export const UpdateRefundSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processed', 'failed']).optional(),
  notes: z.string().optional(),
});

export type UpdateRefundRequest = z.infer<typeof UpdateRefundSchema>;
