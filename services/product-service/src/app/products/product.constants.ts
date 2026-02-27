export const PRODUCT_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },

  VALIDATION: {
    TITLE: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 255,
    },
    DESCRIPTION: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 5000,
    },
    RANGE_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100,
    },
    PRICE: {
      MIN: 0,
      MAX: 1000000,
    },
    IMAGES: {
      MIN_COUNT: 1,
      MAX_COUNT: 20,
      MAX_SIZE_MB: 10,
      ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    },
    COLOURS: {
      MIN_COUNT: 1,
      MAX_COUNT: 50,
    },
    SIZES: {
      MAX_COUNT: 20,
    },
    SALES: {
      MAX_COUNT: 10,
    },
    PACKAGES: {
      MAX_COUNT: 10,
    },
  },

  CATEGORIES: {
    KITCHEN: 'KITCHEN',
    BEDROOM: 'BEDROOM',
  } as const,

  SORT_OPTIONS: {
    PRICE_ASC: 'price_asc',
    PRICE_DESC: 'price_desc',
    POPULARITY: 'popularity',
    NEWEST: 'newest',
    TITLE_ASC: 'title_asc',
    TITLE_DESC: 'title_desc',
  } as const,

  CACHE: {
    TTL: {
      PRODUCT_DETAIL: 3600,
      PRODUCT_LIST: 1800,
      FEATURED_PRODUCTS: 1800,
      SEARCH_RESULTS: 900,
      RELATED_PRODUCTS: 1800,
      FILTERS: 3600,
    },
    KEYS: {
      PRODUCT_BY_ID: 'product:id:',
      PRODUCTS_LIST: 'products:list:',
      FEATURED_PRODUCTS: 'products:featured:',
      SEARCH_RESULTS: 'products:search:',
      RELATED_PRODUCTS: 'products:related:',
      PRODUCT_FILTERS: 'products:filters',
      PRODUCT_RANGES: 'products:ranges',
      PRODUCT_COLOURS: 'products:colours',
      PRODUCT_STATISTICS: 'products:statistics',
    },
  },

  ERRORS: {
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_ALREADY_EXISTS: 'Product with this title already exists',
    INVALID_CATEGORY: 'Invalid product category',
    INVALID_SORT_OPTION: 'Invalid sort option',
    INVALID_PRICE_RANGE: 'Invalid price range',
    INVALID_PAGINATION: 'Invalid pagination parameters',
    COLOUR_NOT_FOUND: 'One or more colours not found',
    SALE_NOT_FOUND: 'One or more sales not found',
    PACKAGE_NOT_FOUND: 'One or more packages not found',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
    PRODUCT_IN_USE: 'Product is currently in use and cannot be deleted',
    BULK_OPERATION_FAILED: 'Bulk operation failed',
    INVALID_IMAGE_FORMAT: 'Invalid image format',
    IMAGE_SIZE_EXCEEDED: 'Image size exceeded maximum limit',
    DUPLICATE_IMAGES: 'Duplicate images detected',
    INVALID_COLOUR_HEX: 'Invalid colour hex code',
    PRODUCT_INACTIVE: 'Product is inactive',
    PRODUCT_NOT_AVAILABLE: 'Product is not available',
  },

  SUCCESS_MESSAGES: {
    PRODUCT_CREATED: 'Product created successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PRODUCT_DELETED: 'Product deleted successfully',
    PRODUCTS_BULK_DELETED: 'Products deleted successfully',
    PRODUCT_ACTIVATED: 'Product activated successfully',
    PRODUCT_DEACTIVATED: 'Product deactivated successfully',
    PRODUCT_FEATURED: 'Product marked as featured',
    PRODUCT_UNFEATURED: 'Product unmarked as featured',
  },

  FILTERS: {
    STYLE_OPTIONS: [
      'Modern',
      'Traditional',
      'Contemporary',
      'Shaker',
      'Minimalist',
      'Classic',
      'Rustic',
      'Industrial',
      'Transitional',
    ],
    FINISH_OPTIONS: [
      'Gloss',
      'Matt',
      'Satin',
      'Woodgrain',
      'Painted',
      'Laminate',
      'Acrylic',
      'Vinyl',
    ],
  },

  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 50,
  },

  FEATURED: {
    DEFAULT_LIMIT: 8,
    MAX_LIMIT: 20,
  },

  RELATED: {
    DEFAULT_LIMIT: 6,
    MAX_LIMIT: 12,
  },

  EXPORT: {
    MAX_RECORDS: 10000,
    FORMATS: ['csv', 'json', 'xlsx'],
    DEFAULT_FORMAT: 'csv',
  },

  BULK_OPERATIONS: {
    MAX_IDS: 100,
    TIMEOUT_MS: 30000,
  },

  EVENTS: {
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
    PRODUCT_TOGGLED: 'product.toggled',
    PRODUCT_BULK_DELETED: 'product.bulk_deleted',
  },

  AUDIT: {
    ACTIONS: {
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete',
      TOGGLE: 'toggle',
      BULK_DELETE: 'bulk_delete',
    },
  },

  PRICE_RANGES: [
    { label: 'Under £1000', min: 0, max: 1000 },
    { label: '£1000 - £2500', min: 1000, max: 2500 },
    { label: '£2500 - £5000', min: 2500, max: 5000 },
    { label: '£5000 - £10000', min: 5000, max: 10000 },
    { label: 'Over £10000', min: 10000, max: 1000000 },
  ],

  QUERY_INCLUDES: {
    FULL: {
      colours: true,
      sales: true,
      packages: true,
    },
    BASIC: {
      colours: true,
    },
    MINIMAL: {},
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
  },

  FILE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ],
    UPLOAD_PATH: 'uploads/products',
  },

  REGEX: {
    HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    URL: /^https?:\/\/.+/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  },

  DEFAULT_VALUES: {
    IS_ACTIVE: true,
    IS_FEATURED: false,
    PRICE: null,
    SIZES: [],
    SALE_IDS: [],
    PACKAGE_IDS: [],
  },

  ANALYTICS: {
    TRACK_VIEWS: true,
    TRACK_SEARCHES: true,
    TRACK_FILTERS: true,
  },

  SEO: {
    TITLE_SUFFIX: ' | Lomash Wood',
    DEFAULT_DESCRIPTION: 'Premium kitchen and bedroom designs by Lomash Wood',
    IMAGE_ALT_PREFIX: 'Lomash Wood -',
  },
} as const;

export const PRODUCT_ERROR_CODES = {
  PRD001: 'PRODUCT_NOT_FOUND',
  PRD002: 'PRODUCT_ALREADY_EXISTS',
  PRD003: 'INVALID_CATEGORY',
  PRD004: 'INVALID_SORT_OPTION',
  PRD005: 'INVALID_PRICE_RANGE',
  PRD006: 'INVALID_PAGINATION',
  PRD007: 'COLOUR_NOT_FOUND',
  PRD008: 'SALE_NOT_FOUND',
  PRD009: 'PACKAGE_NOT_FOUND',
  PRD010: 'INSUFFICIENT_PERMISSIONS',
  PRD011: 'PRODUCT_IN_USE',
  PRD012: 'BULK_OPERATION_FAILED',
  PRD013: 'INVALID_IMAGE_FORMAT',
  PRD014: 'IMAGE_SIZE_EXCEEDED',
  PRD015: 'DUPLICATE_IMAGES',
  PRD016: 'INVALID_COLOUR_HEX',
  PRD017: 'PRODUCT_INACTIVE',
  PRD018: 'PRODUCT_NOT_AVAILABLE',
  PRD019: 'VALIDATION_ERROR',
  PRD020: 'INTERNAL_ERROR',
} as const;

export type ProductErrorCode = keyof typeof PRODUCT_ERROR_CODES;

export const PRODUCT_PERMISSIONS = {
  CREATE: 'product:create',
  READ: 'product:read',
  UPDATE: 'product:update',
  DELETE: 'product:delete',
  TOGGLE: 'product:toggle',
  BULK_DELETE: 'product:bulk_delete',
  EXPORT: 'product:export',
  IMPORT: 'product:import',
} as const;

export type ProductPermission = typeof PRODUCT_PERMISSIONS[keyof typeof PRODUCT_PERMISSIONS];