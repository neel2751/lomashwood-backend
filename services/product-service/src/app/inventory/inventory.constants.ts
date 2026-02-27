export const INVENTORY_EVENTS = {
  CREATED: 'inventory.created',
  UPDATED: 'inventory.updated',
  DELETED: 'inventory.deleted',
  RESERVED: 'inventory.reserved',
  RELEASED: 'inventory.released',
  INCREMENTED: 'inventory.incremented',
  DECREMENTED: 'inventory.decremented',
  LOW_STOCK: 'inventory.low_stock',
  OUT_OF_STOCK: 'inventory.out_of_stock',
  RESTOCKED: 'inventory.restocked',
  TRANSFERRED: 'inventory.transferred',
  ADJUSTED: 'inventory.adjusted'
} as const;

export const INVENTORY_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK'
} as const;

export const INVENTORY_ACTIONS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  RESERVED: 'RESERVED',
  RELEASED: 'RELEASED',
  INCREMENTED: 'INCREMENTED',
  DECREMENTED: 'DECREMENTED',
  DELETED: 'DELETED',
  TRANSFERRED: 'TRANSFERRED',
  ADJUSTED: 'ADJUSTED'
} as const;

export const MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN',
  DAMAGED: 'DAMAGED',
  LOST: 'LOST'
} as const;

export const ADJUSTMENT_REASONS = {
  STOCK_TAKE: 'Stock Take Adjustment',
  DAMAGE: 'Damaged Items',
  THEFT: 'Theft/Loss',
  RETURN: 'Customer Return',
  SUPPLIER_RETURN: 'Supplier Return',
  FOUND: 'Found Items',
  EXPIRED: 'Expired Items',
  CORRECTION: 'Data Correction',
  WAREHOUSE_TRANSFER: 'Warehouse Transfer',
  MANUAL_ADJUSTMENT: 'Manual Adjustment',
  SYSTEM_ADJUSTMENT: 'System Adjustment',
  QUALITY_ISSUE: 'Quality Issue',
  DISPLAY_DAMAGE: 'Display Damage',
  RECOUNT: 'Recount Discrepancy'
} as const;

export const DEFAULT_INVENTORY_SETTINGS = {
  LOW_STOCK_THRESHOLD: 10,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  REORDER_POINT_MULTIPLIER: 1.5,
  SAFETY_STOCK_DAYS: 7,
  DEFAULT_LEAD_TIME_DAYS: 14
} as const;

export const INVENTORY_SORT_FIELDS = {
  QUANTITY: 'quantity',
  RESERVED_QUANTITY: 'reservedQuantity',
  LOW_STOCK_THRESHOLD: 'lowStockThreshold',
  STATUS: 'status',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  WAREHOUSE_LOCATION: 'warehouseLocation',
  SKU: 'sku'
} as const;

export const INVENTORY_ERRORS = {
  NOT_FOUND: 'Inventory not found',
  ALREADY_EXISTS: 'Inventory already exists for this product variant',
  INSUFFICIENT_STOCK: 'Insufficient inventory available',
  INVALID_QUANTITY: 'Invalid quantity specified',
  INVALID_THRESHOLD: 'Invalid low stock threshold',
  CANNOT_DELETE_RESERVED: 'Cannot delete inventory with reserved items',
  CANNOT_RELEASE_MORE_THAN_RESERVED: 'Cannot release more than reserved quantity',
  INVALID_WAREHOUSE: 'Invalid warehouse location',
  INVALID_SKU: 'Invalid SKU format',
  PRODUCT_NOT_FOUND: 'Product not found',
  VARIANT_NOT_FOUND: 'Variant not found',
  DUPLICATE_SKU: 'SKU already exists',
  NEGATIVE_QUANTITY: 'Quantity cannot be negative',
  INVALID_STATUS: 'Invalid inventory status'
} as const;

export const INVENTORY_VALIDATION = {
  SKU_MIN_LENGTH: 1,
  SKU_MAX_LENGTH: 100,
  WAREHOUSE_MIN_LENGTH: 1,
  WAREHOUSE_MAX_LENGTH: 255,
  REASON_MIN_LENGTH: 1,
  REASON_MAX_LENGTH: 500,
  MIN_QUANTITY: 0,
  MAX_QUANTITY: 999999,
  MIN_THRESHOLD: 0,
  MAX_THRESHOLD: 10000,
  MIN_RESERVED: 0
} as const;

export const INVENTORY_CACHE_KEYS = {
  INVENTORY_BY_ID: (id: string) => `inventory:${id}`,
  INVENTORY_BY_PRODUCT: (productId: string) => `inventory:product:${productId}`,
  INVENTORY_BY_SKU: (sku: string) => `inventory:sku:${sku}`,
  INVENTORY_BY_WAREHOUSE: (location: string) => `inventory:warehouse:${location}`,
  INVENTORY_STATS: 'inventory:stats',
  LOW_STOCK_ITEMS: 'inventory:low-stock',
  OUT_OF_STOCK_ITEMS: 'inventory:out-of-stock',
  RESERVED_ITEMS: 'inventory:reserved',
  INVENTORY_LIST: (query: string) => `inventory:list:${query}`
} as const;

export const INVENTORY_CACHE_TTL = {
  INVENTORY_BY_ID: 300,
  INVENTORY_BY_PRODUCT: 180,
  INVENTORY_BY_SKU: 300,
  INVENTORY_BY_WAREHOUSE: 180,
  INVENTORY_STATS: 60,
  LOW_STOCK_ITEMS: 120,
  OUT_OF_STOCK_ITEMS: 120,
  RESERVED_ITEMS: 60,
  INVENTORY_LIST: 120
} as const;

export const INVENTORY_PERMISSIONS = {
  CREATE: 'inventory:create',
  READ: 'inventory:read',
  UPDATE: 'inventory:update',
  DELETE: 'inventory:delete',
  RESERVE: 'inventory:reserve',
  RELEASE: 'inventory:release',
  ADJUST: 'inventory:adjust',
  TRANSFER: 'inventory:transfer',
  VIEW_STATS: 'inventory:view-stats',
  VIEW_HISTORY: 'inventory:view-history',
  EXPORT: 'inventory:export'
} as const;

export const INVENTORY_ROLES = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
  SALES_STAFF: 'SALES_STAFF',
  VIEWER: 'VIEWER'
} as const;

export const WAREHOUSE_LOCATIONS = {
  MAIN: 'Main Warehouse',
  SHOWROOM_LONDON: 'London Showroom',
  SHOWROOM_MANCHESTER: 'Manchester Showroom',
  SHOWROOM_BIRMINGHAM: 'Birmingham Showroom',
  STORAGE_A: 'Storage Unit A',
  STORAGE_B: 'Storage Unit B',
  RETURNS: 'Returns Area',
  QUALITY_CHECK: 'Quality Check Area',
  DAMAGED: 'Damaged Goods',
  TRANSIT: 'In Transit'
} as const;

export const STOCK_ALERT_THRESHOLDS = {
  CRITICAL: 5,
  LOW: 10,
  MEDIUM: 25,
  HIGH: 50
} as const;

export const REORDER_STRATEGIES = {
  FIXED_QUANTITY: 'FIXED_QUANTITY',
  ECONOMIC_ORDER_QUANTITY: 'ECONOMIC_ORDER_QUANTITY',
  MIN_MAX: 'MIN_MAX',
  PERIODIC_REVIEW: 'PERIODIC_REVIEW',
  JUST_IN_TIME: 'JUST_IN_TIME'
} as const;

export const INVENTORY_REPORT_TYPES = {
  STOCK_LEVEL: 'STOCK_LEVEL',
  MOVEMENT: 'MOVEMENT',
  VALUATION: 'VALUATION',
  LOW_STOCK: 'LOW_STOCK',
  TURNOVER: 'TURNOVER',
  AGING: 'AGING',
  FORECAST: 'FORECAST',
  REORDER: 'REORDER'
} as const;

export const EXPORT_FORMATS = {
  JSON: 'JSON',
  CSV: 'CSV',
  EXCEL: 'EXCEL',
  PDF: 'PDF'
} as const;

export const INVENTORY_METRICS = {
  TURNOVER_RATE: 'turnover_rate',
  DAYS_OF_SUPPLY: 'days_of_supply',
  STOCK_OUT_RATE: 'stock_out_rate',
  CARRYING_COST: 'carrying_cost',
  FILL_RATE: 'fill_rate',
  ACCURACY_RATE: 'accuracy_rate'
} as const;

export const NOTIFICATION_TRIGGERS = {
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  REORDER_POINT: 'REORDER_POINT',
  EXCESS_STOCK: 'EXCESS_STOCK',
  SLOW_MOVING: 'SLOW_MOVING',
  FAST_MOVING: 'FAST_MOVING',
  DAMAGED: 'DAMAGED',
  EXPIRED: 'EXPIRED'
} as const;

export const STOCK_MOVEMENT_SOURCES = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  SALES_ORDER: 'SALES_ORDER',
  RETURN: 'RETURN',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
  PRODUCTION: 'PRODUCTION',
  CONSUMPTION: 'CONSUMPTION',
  WASTE: 'WASTE'
} as const;

export const INVENTORY_PRIORITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
} as const;