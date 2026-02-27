export const PRODUCT_CONSTANTS = {
  CATEGORIES: {
    KITCHEN: 'KITCHEN',
    BEDROOM: 'BEDROOM'
  } as const,
  
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_TITLE_LENGTH: 3,
  MIN_DESCRIPTION_LENGTH: 10,
  
  MAX_IMAGES_PER_PRODUCT: 20,
  MIN_IMAGES_PER_PRODUCT: 1,
  
  MAX_COLOURS_PER_PRODUCT: 50,
  MIN_COLOURS_PER_PRODUCT: 1,
  
  MAX_SIZES_PER_PRODUCT: 30,
  
  DEFAULT_CURRENCY: 'GBP',
  MIN_PRICE: 0.01,
  MAX_PRICE: 1000000,
  
  PRICE_DECIMAL_PLACES: 2
} as const;

export const INVENTORY_CONSTANTS = {
  MIN_QUANTITY: 0,
  MAX_QUANTITY: 999999,
  DEFAULT_LOW_STOCK_THRESHOLD: 10,
  DEFAULT_REORDER_POINT: 20,
  
  CHANGE_TYPES: {
    ADJUSTMENT: 'ADJUSTMENT',
    SALE: 'SALE',
    RESTOCK: 'RESTOCK',
    RETURN: 'RETURN',
    DAMAGE: 'DAMAGE',
    INITIAL: 'INITIAL'
  } as const
} as const;

export const PRICING_CONSTANTS = {
  PRICE_TYPES: {
    BASE: 'BASE',
    SALE: 'SALE',
    PROMOTIONAL: 'PROMOTIONAL',
    SEASONAL: 'SEASONAL',
    CLEARANCE: 'CLEARANCE'
  } as const,
  
  MAX_DISCOUNT_PERCENTAGE: 90,
  MIN_DISCOUNT_PERCENTAGE: 0,
  
  SIGNIFICANT_PRICE_CHANGE_THRESHOLD: 5
} as const;

export const COLOUR_CONSTANTS = {
  HEX_CODE_PATTERN: /^#[0-9A-Fa-f]{6}$/,
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2
} as const;

export const SIZE_CONSTANTS = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_TITLE_LENGTH: 1
} as const;

export const CATEGORY_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_NAME_LENGTH: 2,
  MAX_SLUG_LENGTH: 150
} as const;

export const IMAGE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
  MAX_ALT_TEXT_LENGTH: 200,
  DEFAULT_IMAGE_QUALITY: 85,
  THUMBNAIL_WIDTH: 300,
  MEDIUM_WIDTH: 800,
  LARGE_WIDTH: 1200
} as const;

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
} as const;

export const SORT_CONSTANTS = {
  SORT_FIELDS: {
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    TITLE: 'title',
    PRICE: 'price',
    POPULARITY: 'popularity'
  } as const,
  
  SORT_ORDERS: {
    ASC: 'asc',
    DESC: 'desc'
  } as const,
  
  DEFAULT_SORT_FIELD: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc'
} as const;

export const FILTER_CONSTANTS = {
  PRICE_RANGES: [
    { min: 0, max: 1000 },
    { min: 1000, max: 5000 },
    { min: 5000, max: 10000 },
    { min: 10000, max: 25000 },
    { min: 25000, max: 50000 },
    { min: 50000, max: null }
  ] as const
} as const;

export const CACHE_CONSTANTS = {
  TTL: {
    PRODUCT_DETAIL: 300,
    PRODUCT_LIST: 180,
    CATEGORY_LIST: 600,
    COLOUR_LIST: 3600,
    SIZE_LIST: 3600,
    INVENTORY: 60,
    PRICING: 300
  } as const,
  
  KEYS: {
    PRODUCT: 'product',
    PRODUCT_LIST: 'product:list',
    CATEGORY: 'category',
    COLOUR: 'colour',
    SIZE: 'size',
    INVENTORY: 'inventory',
    PRICING: 'pricing'
  } as const
} as const;

export const EVENT_CONSTANTS = {
  TOPICS: {
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
    INVENTORY_UPDATED: 'inventory.updated',
    PRICE_CHANGED: 'price.changed',
    CATEGORY_CREATED: 'category.created',
    CATEGORY_UPDATED: 'category.updated',
    COLOUR_CREATED: 'colour.created',
    SIZE_CREATED: 'size.created'
  } as const,
  
  VERSION: '1.0'
} as const;

export const VALIDATION_CONSTANTS = {
  UUID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/
} as const;

export const HTTP_CONSTANTS = {
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  } as const,
  
  HEADERS: {
    AUTHORIZATION: 'Authorization',
    CONTENT_TYPE: 'Content-Type',
    ACCEPT: 'Accept',
    USER_AGENT: 'User-Agent',
    X_REQUEST_ID: 'X-Request-ID',
    X_CORRELATION_ID: 'X-Correlation-ID',
    X_FORWARDED_FOR: 'X-Forwarded-For'
  } as const
} as const;

export const RATE_LIMIT_CONSTANTS = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 100,
  STRICT_MODE: false,
  SKIP_SUCCESSFUL_REQUESTS: false
} as const;

export const TIMEOUT_CONSTANTS = {
  DATABASE_QUERY: 30000,
  HTTP_REQUEST: 10000,
  CACHE_OPERATION: 5000,
  EVENT_PUBLISH: 3000
} as const;

export const JOB_CONSTANTS = {
  SYNC_INVENTORY: {
    CRON: '0 */6 * * *',
    NAME: 'sync-inventory'
  },
  REPRICE_PRODUCTS: {
    CRON: '0 0 * * *',
    NAME: 'reprice-products'
  },
  PURGE_OUTDATED_PRODUCTS: {
    CRON: '0 2 * * 0',
    NAME: 'purge-outdated-products'
  },
  REBUILD_SEARCH_INDEX: {
    CRON: '0 3 * * *',
    NAME: 'rebuild-search-index'
  }
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'TIMEOUT'
} as const;

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly'
} as const;

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;