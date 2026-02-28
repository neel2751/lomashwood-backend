import type { PaginationParams } from "./api.types";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "authorised"
  | "captured"
  | "failed"
  | "voided"
  | "refunded";

export type RefundStatus = "pending" | "approved" | "rejected" | "processed";

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  productCategory?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: Record<string, string>;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  orderNumber?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerReference?: string;
  capturedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  orderId: string;
  orderNumber?: string;
  invoiceNumber: string;
  url: string;
  total: number;
  issuedAt: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Refund = {
  id: string;
  orderId: string;
  orderNumber?: string;
  paymentId?: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderTimeline = {
  id: string;
  orderId: string;
  event: string;
  description?: string;
  performedBy?: string;
  createdAt: string;
};

export type CreateRefundPayload = {
  orderId: string;
  paymentId?: string;
  amount: number;
  reason: string;
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
  notes?: string;
};

export type OrderFilterParams = PaginationParams & {
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
};

export type PaymentFilterParams = PaginationParams & {
  search?: string;
  status?: PaymentStatus;
  orderId?: string;
  startDate?: string;
  endDate?: string;
};

export type RefundFilterParams = PaginationParams & {
  search?: string;
  status?: RefundStatus;
  orderId?: string;
  startDate?: string;
  endDate?: string;
};