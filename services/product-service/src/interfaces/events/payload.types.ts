export interface BaseEventPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
}

export interface EventPayload extends BaseEventPayload {
  data: any;
}

export interface ProductCreatedPayload extends BaseEventPayload {
  productId: string;
  category: 'KITCHEN' | 'BEDROOM';
  title: string;
  description: string;
  price: number;
  images: string[];
  colours: string[];
  rangeName: string;
  createdBy: string;
}

export interface ProductUpdatedPayload extends BaseEventPayload {
  productId: string;
  changes: string[];
  updatedBy: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
}

export interface ProductDeletedPayload extends BaseEventPayload {
  productId: string;
  category: 'KITCHEN' | 'BEDROOM';
  title: string;
  deletedBy: string;
  reason?: string;
}

export interface InventoryUpdatedPayload extends BaseEventPayload {
  productId: string;
  stockLevel: number;
  previousStockLevel: number;
  availableStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  updatedBy: string;
}

export interface PriceChangedPayload extends BaseEventPayload {
  productId: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  effectiveDate: string;
  changedBy: string;
  reason?: string;
}

export interface CategoryCreatedPayload extends BaseEventPayload {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdBy: string;
}

export interface CategoryUpdatedPayload extends BaseEventPayload {
  categoryId: string;
  changes: string[];
  updatedBy: string;
}

export interface CategoryDeletedPayload extends BaseEventPayload {
  categoryId: string;
  name: string;
  deletedBy: string;
}

export interface ColourCreatedPayload extends BaseEventPayload {
  colourId: string;
  name: string;
  hexCode: string;
  createdBy: string;
}

export interface ColourUpdatedPayload extends BaseEventPayload {
  colourId: string;
  changes: string[];
  updatedBy: string;
}

export interface ColourDeletedPayload extends BaseEventPayload {
  colourId: string;
  name: string;
  deletedBy: string;
}

export interface SizeCreatedPayload extends BaseEventPayload {
  sizeId: string;
  productId: string;
  title: string;
  description?: string;
  image?: string;
  createdBy: string;
}

export interface SizeUpdatedPayload extends BaseEventPayload {
  sizeId: string;
  productId: string;
  changes: string[];
  updatedBy: string;
}

export interface SizeDeletedPayload extends BaseEventPayload {
  sizeId: string;
  productId: string;
  deletedBy: string;
}

export interface OrderCreatedPayload extends BaseEventPayload {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  currency: string;
  status: string;
}

export interface OrderUpdatedPayload extends BaseEventPayload {
  orderId: string;
  status: string;
  previousStatus: string;
  updatedBy: string;
}

export interface OrderCancelledPayload extends BaseEventPayload {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  reason?: string;
  cancelledBy: string;
}

export interface OrderCompletedPayload extends BaseEventPayload {
  orderId: string;
  customerId: string;
  totalAmount: number;
  completedAt: string;
}

export interface PaymentSucceededPayload extends BaseEventPayload {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
}

export interface PaymentFailedPayload extends BaseEventPayload {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  reason: string;
  errorCode?: string;
}

export interface StockLowPayload extends BaseEventPayload {
  productId: string;
  stockLevel: number;
  threshold: number;
  productTitle: string;
}

export interface StockOutPayload extends BaseEventPayload {
  productId: string;
  productTitle: string;
  previousStock: number;
}

export interface PriceSignificantChangePayload extends BaseEventPayload {
  productId: string;
  oldPrice: number;
  newPrice: number;
  changePercentage: number;
  productTitle: string;
}

export interface ProductViewedPayload extends BaseEventPayload {
  productId: string;
  customerId?: string;
  sessionId: string;
  source: string;
  userAgent?: string;
}

export interface ProductAddedToCartPayload extends BaseEventPayload {
  productId: string;
  customerId?: string;
  sessionId: string;
  quantity: number;
  price: number;
}

export interface ProductRemovedFromCartPayload extends BaseEventPayload {
  productId: string;
  customerId?: string;
  sessionId: string;
  quantity: number;
}

export interface ProductSearchedPayload extends BaseEventPayload {
  searchQuery: string;
  filters?: Record<string, any>;
  resultsCount: number;
  customerId?: string;
  sessionId: string;
}

export interface CategoryViewedPayload extends BaseEventPayload {
  categoryId: string;
  categoryName: string;
  customerId?: string;
  sessionId: string;
}

export interface BulkImportStartedPayload extends BaseEventPayload {
  importId: string;
  totalRecords: number;
  importType: string;
  initiatedBy: string;
}

export interface BulkImportCompletedPayload extends BaseEventPayload {
  importId: string;
  successCount: number;
  failureCount: number;
  duration: number;
}

export interface BulkImportFailedPayload extends BaseEventPayload {
  importId: string;
  error: string;
  processedCount: number;
}

export interface ProductImageUploadedPayload extends BaseEventPayload {
  productId: string;
  imageUrl: string;
  imageSize: number;
  imageFormat: string;
  uploadedBy: string;
}

export interface ProductImageDeletedPayload extends BaseEventPayload {
  productId: string;
  imageUrl: string;
  deletedBy: string;
}

export type AnyEventPayload =
  | ProductCreatedPayload
  | ProductUpdatedPayload
  | ProductDeletedPayload
  | InventoryUpdatedPayload
  | PriceChangedPayload
  | CategoryCreatedPayload
  | CategoryUpdatedPayload
  | CategoryDeletedPayload
  | ColourCreatedPayload
  | ColourUpdatedPayload
  | ColourDeletedPayload
  | SizeCreatedPayload
  | SizeUpdatedPayload
  | SizeDeletedPayload
  | OrderCreatedPayload
  | OrderUpdatedPayload
  | OrderCancelledPayload
  | OrderCompletedPayload
  | PaymentSucceededPayload
  | PaymentFailedPayload
  | StockLowPayload
  | StockOutPayload
  | PriceSignificantChangePayload
  | ProductViewedPayload
  | ProductAddedToCartPayload
  | ProductRemovedFromCartPayload
  | ProductSearchedPayload
  | CategoryViewedPayload
  | BulkImportStartedPayload
  | BulkImportCompletedPayload
  | BulkImportFailedPayload
  | ProductImageUploadedPayload
  | ProductImageDeletedPayload;

export function createEventPayload<T extends BaseEventPayload>(
  eventType: string,
  data: Omit<T, keyof BaseEventPayload>,
  metadata?: Record<string, any>
): T {
  return {
    eventId: generateEventId(),
    eventType,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'product-service',
    metadata,
    ...data,
  } as T;
}

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidEventPayload(payload: any): payload is BaseEventPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.eventId === 'string' &&
    typeof payload.eventType === 'string' &&
    typeof payload.timestamp === 'string' &&
    typeof payload.version === 'string' &&
    typeof payload.source === 'string'
  );
}

export function extractEventMetadata(payload: BaseEventPayload): Record<string, any> {
  return {
    eventId: payload.eventId,
    eventType: payload.eventType,
    timestamp: payload.timestamp,
    version: payload.version,
    source: payload.source,
    correlationId: payload.correlationId,
    causationId: payload.causationId,
  };
}