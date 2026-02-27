export interface CreateInventoryDto {
  productId: string;
  variantId: string;
  quantity: number;
  lowStockThreshold?: number;
  warehouseLocation?: string;
  sku?: string;
}

export interface UpdateInventoryDto {
  quantity?: number;
  lowStockThreshold?: number;
  warehouseLocation?: string;
  sku?: string;
}

export interface InventoryQueryDto {
  page?: number;
  limit?: number;
  status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  productId?: string;
  warehouseLocation?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReserveInventoryDto {
  productId: string;
  variantId: string;
  quantity: number;
  orderId?: string;
}

export interface AdjustInventoryDto {
  productId: string;
  variantId: string;
  quantity: number;
  reason?: string;
}

export interface InventoryResponseDto {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  warehouseLocation: string | null;
  sku: string | null;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  product?: ProductBasicInfo;
  variant?: VariantBasicInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBasicInfo {
  id: string;
  name: string;
  category: 'KITCHEN' | 'BEDROOM';
  sku: string | null;
  images?: string[];
}

export interface VariantBasicInfo {
  id: string;
  title: string;
  sku: string | null;
  price?: number;
  colour?: ColourBasicInfo;
  size?: SizeBasicInfo;
}

export interface ColourBasicInfo {
  id: string;
  name: string;
  hexCode: string;
}

export interface SizeBasicInfo {
  id: string;
  title: string;
  description: string | null;
}

export interface InventoryStatsDto {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  inStockItems: number;
  totalQuantity: number;
  totalReserved: number;
  availableQuantity: number;
}

export interface BulkCreateInventoryDto {
  items: CreateInventoryDto[];
}

export interface CheckAvailabilityDto {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface InventoryAvailabilityResponseDto {
  available: boolean;
  requestedQuantity: number;
  availableQuantity: number;
  productId: string;
  variantId: string;
}

export interface InventoryAdjustmentDto {
  inventoryId: string;
  previousQuantity: number;
  newQuantity: number;
  adjustmentType: 'INCREMENT' | 'DECREMENT' | 'RESERVE' | 'RELEASE';
  quantity: number;
  reason?: string;
  performedBy: string;
  timestamp: Date;
}

export interface InventoryHistoryDto {
  id: string;
  inventoryId: string;
  actionType: 'CREATED' | 'UPDATED' | 'RESERVED' | 'RELEASED' | 'INCREMENTED' | 'DECREMENTED' | 'DELETED';
  previousQuantity: number | null;
  newQuantity: number;
  previousReservedQuantity: number | null;
  newReservedQuantity: number;
  reason?: string;
  performedBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface LowStockAlertDto {
  inventoryId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantTitle: string;
  currentQuantity: number;
  lowStockThreshold: number;
  availableQuantity: number;
  warehouseLocation: string | null;
  sku: string | null;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface InventoryTransferDto {
  inventoryId: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number;
  reason?: string;
  performedBy: string;
}

export interface InventoryReportDto {
  reportType: 'STOCK_LEVEL' | 'MOVEMENT' | 'VALUATION' | 'LOW_STOCK';
  startDate?: Date;
  endDate?: Date;
  warehouseLocation?: string;
  category?: 'KITCHEN' | 'BEDROOM';
  format: 'JSON' | 'CSV' | 'EXCEL' | 'PDF';
}

export interface StockMovementDto {
  inventoryId: string;
  productId: string;
  variantId: string;
  movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reference?: string;
  reason?: string;
  performedBy: string;
  timestamp: Date;
}

export interface InventoryValuationDto {
  totalValue: number;
  totalQuantity: number;
  averageValue: number;
  breakdown: {
    category: 'KITCHEN' | 'BEDROOM';
    quantity: number;
    value: number;
  }[];
}

export interface InventoryForecastDto {
  inventoryId: string;
  productId: string;
  variantId: string;
  currentQuantity: number;
  projectedQuantity: number;
  forecastDate: Date;
  averageDailySales: number;
  daysUntilStockout: number;
  recommendedReorderQuantity: number;
}

export interface ReorderPointDto {
  inventoryId: string;
  productId: string;
  variantId: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  averageDailySales: number;
  safetyStock: number;
}

export interface InventorySnapshotDto {
  snapshotDate: Date;
  totalItems: number;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  valueSnapshot: number;
  itemsByStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  itemsByCategory: {
    kitchen: number;
    bedroom: number;
  };
}