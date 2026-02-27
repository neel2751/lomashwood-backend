import { z } from 'zod';
import { OrderStatus } from '@prisma/client';


export const AddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  county: z.string().max(100).optional(),
  postcode: z.string().min(1, 'Postcode is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
  phone: z.string().max(20).optional(),
});


export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required').max(255),
  productSku: z.string().max(100).optional(),
  variantId: z.string().optional(),
  variantName: z.string().max(255).optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(999),
  unitPrice: z.number().int().min(0, 'Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).default(20),
  productImage: z.string().url().optional().or(z.literal('')),
  productDetails: z.any().optional(),
});


export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(100, 'Order cannot contain more than 100 items'),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  customerEmail: z.string().email('Invalid email address').optional(),
  customerPhone: z.string().max(20).optional(),
}).refine(
  (data) => {
    const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
    return totalItems <= 999;
  },
  {
    message: 'Total quantity of all items cannot exceed 999',
  }
);


export const UpdateOrderSchema = z.object({
  shippingAddress: AddressSchema.optional(),
  billingAddress: AddressSchema.optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  customerEmail: z.string().email('Invalid email address').optional(),
  customerPhone: z.string().max(20).optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);


export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  notes: z.string().max(500).optional(),
});


export const GetOrdersQuerySchema = z
  .object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    status: z.nativeEnum(OrderStatus).optional(),
    customerId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .transform((data) => ({
    page: Math.max(1, data.page),
    limit: Math.min(100, Math.max(1, data.limit)),
    status: data.status,
    customerId: data.customerId,
    startDate: data.startDate,
    endDate: data.endDate,
    sortBy: data.sortBy,
    sortOrder: data.sortOrder,
  }))
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  );

export const AddTrackingInfoSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required').max(100),
  trackingUrl: z.string().url('Invalid tracking URL').optional(),
  carrier: z.string().max(100).optional(),
});


export const CancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});


export const AddOrderNotesSchema = z.object({
  notes: z.string().min(1, 'Notes cannot be empty').max(1000),
});


export const SearchOrdersSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(255),
});


export const GetRevenueByPeriodSchema = z.object({
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date',
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    if (data.groupBy === 'day' && diffDays > 365) {
      return false;
    }
    if (data.groupBy === 'week' && diffDays > 730) {
      return false;
    }
    if (data.groupBy === 'month' && diffDays > 1825) {
      return false;
    }
    return true;
  },
  {
    message: 'Date range too large for selected grouping (max: 1 year for day, 2 years for week, 5 years for month)',
  }
);


export const GetTopCustomersSchema = z.object({
  limit: z.string().transform(Number).default('10'),
}).transform((data) => ({
  limit: Math.min(100, Math.max(1, data.limit)),
}));


export const GetStalePendingOrdersSchema = z.object({
  hours: z.string().transform(Number).default('24'),
}).transform((data) => ({
  hours: Math.min(720, Math.max(1, data.hours)), // Max 30 days
}));


export const BulkUpdateStatusSchema = z.object({
  orderIds: z
    .array(z.string().min(1))
    .min(1, 'At least one order ID is required')
    .max(100, 'Cannot update more than 100 orders at once'),
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
});

export const BulkExportOrdersSchema = z.object({
  orderIds: z
    .array(z.string().min(1))
    .min(1, 'At least one order ID is required')
    .max(500, 'Cannot export more than 500 orders at once'),
});


export const OrderIdParamSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
});


export const OrderNumberParamSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required').regex(
    /^ORD-[A-Z0-9]+-[A-Z0-9]+$/,
    'Invalid order number format'
  ),
});


export const CustomerIdParamSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});


export const ProductIdParamSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});


export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
  }
);


export const PaginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).transform((data) => ({
  page: Math.max(1, data.page),
  limit: Math.min(100, Math.max(1, data.limit)),
}));


export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type GetOrdersQueryInput = z.infer<typeof GetOrdersQuerySchema>;
export type AddTrackingInfoInput = z.infer<typeof AddTrackingInfoSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type SearchOrdersInput = z.infer<typeof SearchOrdersSchema>;
export type GetRevenueByPeriodInput = z.infer<typeof GetRevenueByPeriodSchema>;
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;
export type BulkExportOrdersInput = z.infer<typeof BulkExportOrdersSchema>;


export const ORDER_VALIDATION_ERRORS = {
  INVALID_STATUS: 'Invalid order status provided',
  INVALID_DATE_RANGE: 'Invalid date range specified',
  INVALID_QUANTITY: 'Order quantity exceeds maximum allowed',
  INVALID_EMAIL: 'Invalid email address format',
  INVALID_PHONE: 'Invalid phone number format',
  INVALID_POSTCODE: 'Invalid postcode format',
  EMPTY_ORDER: 'Order must contain at least one item',
  TOO_MANY_ITEMS: 'Order contains too many items',
  INVALID_ORDER_NUMBER: 'Invalid order number format',
} as const;


export const validateOrderStatus = (status: string): boolean => {
  return Object.values(OrderStatus).includes(status as OrderStatus);
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime());
};

export const validatePostcode = (postcode: string, country: string = 'United Kingdom'): boolean => {
  if (country === 'United Kingdom') {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode);
  }
  return postcode.length > 0;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};