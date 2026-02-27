import { OrderStatus } from '@prisma/client';

export interface CreateOrderDto {
  customerId: string;
  items: OrderItemDto[];
  shippingAddress: AddressDto;
  billingAddress: AddressDto;
  couponCode?: string;
  notes?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  productSku?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  productImage?: string;
  productDetails?: any;
}

export interface AddressDto {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface UpdateOrderDto {
  shippingAddress?: AddressDto;
  billingAddress?: AddressDto;
  notes?: string;
  internalNotes?: string;
  customerEmail?: string;
  customerPhone?: string;
  estimatedDeliveryDate?: Date;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export interface GetOrdersQuery {
  page: number;
  limit: number;
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  
  items: OrderItemResponse[];
  
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  
  couponCode?: string;
  
  shippingAddress: AddressDto;
  billingAddress: AddressDto;
  
  notes?: string;
  internalNotes?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  
  payments?: PaymentSummary[];
  
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  productImage?: string;
  productDetails?: any;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  status: string;
  method: string;
  provider: string;
  createdAt: Date;
}

export interface OrderListResponse {
  orders: OrderResponse[];
  pagination: PaginationMetadata;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
}

export interface CreateOrderData {
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  couponCode?: string;
  shippingAddress: any;
  billingAddress: any;
  notes?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: any;
  items: {
    create: Array<{
      productId: string;
      productName: string;
      productSku?: string;
      variantId?: string;
      variantName?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      taxRate: number;
      taxAmount: number;
      discountAmount: number;
      productImage?: string;
      productDetails?: any;
    }>;
  };
}