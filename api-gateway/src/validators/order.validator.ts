import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
      selectedColourId: z.string().uuid('Invalid colour ID').optional(),
      selectedUnitId: z.string().uuid('Invalid unit ID').optional(),
      price: z.number().positive('Price must be positive'),
    })).min(1, 'At least one item is required'),
    shippingAddress: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
      email: z.string().email('Invalid email format'),
      postcode: z.string().min(3, 'Postcode is required'),
      address: z.string().min(5, 'Address must be at least 5 characters'),
      city: z.string().optional(),
      country: z.string().optional(),
    }),
    billingAddress: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
      email: z.string().email('Invalid email format'),
      postcode: z.string().min(3, 'Postcode is required'),
      address: z.string().min(5, 'Address must be at least 5 characters'),
      city: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    couponCode: z.string().optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
});

export const getOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Cancellation reason must be at least 10 characters'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    couponCode: z.string().min(3, 'Coupon code is required'),
    orderTotal: z.number().positive('Order total must be positive'),
  }),
});

export const calculateShippingSchema = z.object({
  body: z.object({
    postcode: z.string().min(3, 'Postcode is required'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })).min(1, 'At least one item is required'),
  }),
});

export const createQuoteSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
      selectedColourId: z.string().uuid('Invalid colour ID').optional(),
      selectedUnitId: z.string().uuid('Invalid unit ID').optional(),
    })).min(1, 'At least one item is required'),
    customerDetails: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
      email: z.string().email('Invalid email format'),
      postcode: z.string().min(3, 'Postcode is required'),
      address: z.string().min(5, 'Address must be at least 5 characters'),
    }),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  }),
});

export const getOrderInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const trackOrderSchema = z.object({
  params: z.object({
    orderNumber: z.string().min(5, 'Invalid order number'),
  }),
});

export const addOrderNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    note: z.string().min(5, 'Note must be at least 5 characters').max(500, 'Note cannot exceed 500 characters'),
    isInternal: z.boolean().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type GetOrdersInput = z.infer<typeof getOrdersSchema>['query'];
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>['params'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>['body'];
export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>['body'];
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>['body'];
export type GetOrderInvoiceInput = z.infer<typeof getOrderInvoiceSchema>['params'];
export type TrackOrderInput = z.infer<typeof trackOrderSchema>['params'];
export type AddOrderNoteInput = z.infer<typeof addOrderNoteSchema>;