

import { Order, OrderItem, OrderStatus, PaymentStatus } from '@prisma/client';


export interface OrderEntity extends Order {
  items?: OrderItemEntity[];
  payment?: OrderPaymentInfo;
  shipping?: OrderShippingInfo;
  customer?: OrderCustomerInfo;
}

export interface OrderItemEntity extends OrderItem {
  product?: OrderProductInfo;
}


export interface CreateOrderDTO {
  customerId: string;
  items: CreateOrderItemDTO[];
  shippingAddress: ShippingAddressDTO;
  billingAddress: BillingAddressDTO;
  paymentMethodId?: string;
  couponCode?: string;
  notes?: string;
  deliveryPreference?: DeliveryPreference;
}

export interface CreateOrderItemDTO {
  productId: string;
  variantId?: string;
  quantity: number;
  customization?: ProductCustomizationDTO;
}

export interface ProductCustomizationDTO {
  finishType?: string;
  hardwareType?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  specialInstructions?: string;
}

export interface UpdateOrderDTO {
  status?: OrderStatus;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  notes?: string;
}

export interface UpdateOrderItemDTO {
  quantity?: number;
  unitPrice?: number;
  discount?: number;
}

export interface ShippingAddressDTO {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
}

export interface BillingAddressDTO {
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


export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItemResponseDTO[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: ShippingAddressDTO;
  billingAddress: BillingAddressDTO;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemResponseDTO {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  customization?: ProductCustomizationDTO;
}

export interface OrderListResponseDTO {
  orders: OrderResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderSummaryDTO {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
}


export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  fromDate?: Date;
  toDate?: Date;
  searchTerm?: string;
  sortBy?: OrderSortField;
  sortOrder?: 'asc' | 'desc';
}

export type OrderSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'orderNumber'
  | 'totalAmount'
  | 'status';

export interface OrderFilterCriteria {
  customerId?: string;
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  minAmount?: number;
  maxAmount?: number;
  hasDiscount?: boolean;
}


export interface OrderCalculation {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  breakdown: {
    itemsTotal: number;
    appliedCoupon?: CouponApplicationResult;
    shippingCharges: ShippingCalculation;
    taxBreakdown: TaxBreakdown;
  };
}

export interface CouponApplicationResult {
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  appliedTo: 'order' | 'shipping' | 'items';
}

export interface ShippingCalculation {
  baseCharge: number;
  additionalCharges: number;
  discount: number;
  finalCharge: number;
  method: string;
  estimatedDays: number;
}

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
  total: number;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: OrderValidationError[];
  warnings: OrderValidationWarning[];
}

export interface OrderValidationError {
  field: string;
  message: string;
  code: string;
}

export interface OrderValidationWarning {
  field: string;
  message: string;
  code: string;
}


export interface OrderProductInfo {
  id: string;
  name: string;
  sku: string;
  image?: string;
  category: string;
  inStock: boolean;
  availableQuantity: number;
}

export interface OrderCustomerInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface OrderPaymentInfo {
  id: string;
  method: string;
  status: PaymentStatus;
  transactionId?: string;
  paidAmount: number;
  paidAt?: Date;
}

export interface OrderShippingInfo {
  method: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippedAt?: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
  changedBy: string;
  changedAt: Date;
}

export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: Date;
}


export enum DeliveryPreference {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SCHEDULED = 'SCHEDULED',
  PICKUP = 'PICKUP',
}

export enum OrderSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  ADMIN = 'ADMIN',
  SHOWROOM = 'SHOWROOM',
  PHONE = 'PHONE',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  FREE_SHIPPING = 'FREE_SHIPPING',
}


export interface CreateOrderResult {
  order: OrderResponseDTO;
  paymentIntent?: {
    clientSecret: string;
    paymentIntentId: string;
  };
}

export interface CancelOrderResult {
  order: OrderResponseDTO;
  refund?: {
    refundId: string;
    amount: number;
    status: string;
  };
}

export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  period: {
    from: Date;
    to: Date;
  };
}


export interface OrderRepositoryFilters {
  customerId?: string;
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

export interface OrderRepositoryOptions {
  includeItems?: boolean;
  includePayment?: boolean;
  includeCustomer?: boolean;
  includeShipping?: boolean;
}


export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  items: OrderItemSummary[];
  createdAt: Date;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedAt: Date;
}

export interface OrderCancelledEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  cancelReason: string;
  refundAmount?: number;
  cancelledAt: Date;
}

export interface OrderItemSummary {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}


export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Order with ID ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}

export class OrderValidationError extends Error {
  constructor(message: string, public errors: OrderValidationError[]) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

export class OrderCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderCancellationError';
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`
    );
    this.name = 'InsufficientStockError';
  }
}

export class InvalidCouponError extends Error {
  constructor(couponCode: string, reason: string) {
    super(`Invalid coupon ${couponCode}: ${reason}`);
    this.name = 'InvalidCouponError';
  }
}