export const CATEGORY_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },

  VALIDATION: {
    NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100,
    },
    SLUG: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100,
      PATTERN: /^[a-z0-9-]+$/,
    },
    DESCRIPTION: {
      MAX_LENGTH: 1000,
    },
    META_TITLE: {
      MAX_LENGTH: 200,
    },
    META_DESCRIPTION: {
      MAX_LENGTH: 500,
    },
    META_KEYWORDS: {
      MAX_LENGTH: 500,
    },
    ORDER: {
      MIN: 0,
      MAX: 9999,
    },
  },

  TYPES: {
    KITCHEN: 'KITCHEN',
    BEDROOM: 'BEDROOM',
  } as const,

  SORT_OPTIONS: {
    NAME_ASC: 'name_asc',
    NAME_DESC: 'name_desc',
    ORDER: 'order',
    NEWEST: 'newest',
    OLDEST: 'oldest',
  } as const,

  CACHE: {
    TTL: {
      CATEGORY_DETAIL: 3600,
      CATEGORY_LIST: 1800,
      FEATURED_CATEGORIES: 1800,
      HIERARCHY: 3600,
      SEARCH_RESULTS: 900,
      STATISTICS: 1800,
    },
    KEYS: {
      CATEGORY_BY_ID: 'category:id:',
      CATEGORY_BY_SLUG: 'category:slug:',
      CATEGORIES_LIST: 'categories:list:',
      FEATURED_CATEGORIES: 'categories:featured:',
      CATEGORY_HIERARCHY: 'categories:hierarchy',
      SEARCH_RESULTS: 'categories:search:',
      CATEGORY_STATISTICS: 'categories:statistics',
      CATEGORY_BY_TYPE: 'categories:type:',
      ACTIVE_CATEGORIES: 'categories:active',
    },
  },

  ERRORS: {
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_ALREADY_EXISTS: 'Category with this name or slug already exists',
    CATEGORY_SLUG_EXISTS: 'Category with this slug already exists',
    PARENT_CATEGORY_NOT_FOUND: 'Parent category not found',
    INVALID_TYPE: 'Invalid category type',
    INVALID_SORT_OPTION: 'Invalid sort option',
    INVALID_PAGINATION: 'Invalid pagination parameters',
    INVALID_SLUG: 'Invalid category slug',
    INVALID_SEARCH_QUERY: 'Invalid search query',
    INVALID_REORDER_DATA: 'Invalid reorder data',
    CANNOT_SET_SELF_AS_PARENT: 'Cannot set category as its own parent',
    CATEGORY_HAS_PRODUCTS: 'Cannot delete category with associated products',
    CATEGORY_HAS_CHILDREN: 'Cannot delete category with child categories',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
    BULK_OPERATION_FAILED: 'Bulk operation failed',
    CIRCULAR_REFERENCE: 'Circular reference detected in category hierarchy',
    MAX_DEPTH_EXCEEDED: 'Maximum category depth exceeded',
    DUPLICATE_ORDER: 'Duplicate order values detected',
  },

  SUCCESS_MESSAGES: {
    CATEGORY_CREATED: 'Category created successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',
    CATEGORIES_BULK_DELETED: 'Categories deleted successfully',
    CATEGORY_ACTIVATED: 'Category activated successfully',
    CATEGORY_DEACTIVATED: 'Category deactivated successfully',
    CATEGORY_FEATURED: 'Category marked as featured',
    CATEGORY_UNFEATURED: 'Category unmarked as featured',
    CATEGORIES_REORDERED: 'Categories reordered successfully',
  },

  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
    MAX_RESULTS: 50,
  },

  FEATURED: {
    DEFAULT_LIMIT: 6,
    MAX_LIMIT: 20,
  },

  HIERARCHY: {
    MAX_DEPTH: 3,
    ROOT_PARENT_ID: null,
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
    CATEGORY_CREATED: 'category.created',
    CATEGORY_UPDATED: 'category.updated',
    CATEGORY_DELETED: 'category.deleted',
    CATEGORY_REORDERED: 'category.reordered',
    CATEGORY_TOGGLED: 'category.toggled',
    CATEGORY_BULK_DELETED: 'category.bulk_deleted',
  },

  AUDIT: {
    ACTIONS: {
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete',
      REORDER: 'reorder',
      TOGGLE: 'toggle',
      BULK_DELETE: 'bulk_delete',
    },
  },

  QUERY_INCLUDES: {
    FULL: {
      parent: true,
      children: true,
      products: true,
      _count: {
        select: { products: true },
      },
    },
    WITH_PARENT: {
      parent: true,
      _count: {
        select: { products: true },
      },
    },
    WITH_CHILDREN: {
      children: true,
      _count: {
        select: { products: true },
      },
    },
    BASIC: {
      _count: {
        select: { products: true },
      },
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
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
    UPLOAD_PATH: 'uploads/categories',
  },

  REGEX: {
    SLUG: /^[a-z0-9-]+$/,
    URL: /^https?:\/\/.+/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  },

  DEFAULT_VALUES: {
    IS_ACTIVE: true,
    IS_FEATURED: false,
    ORDER: 0,
    PARENT_ID: null,
    DESCRIPTION: null,
    IMAGE: null,
    ICON: null,
  },

  SEO: {
    TITLE_SUFFIX: ' | Lomash Wood',
    DEFAULT_DESCRIPTION: 'Browse our premium kitchen and bedroom designs at Lomash Wood',
    IMAGE_ALT_PREFIX: 'Lomash Wood -',
  },

  ANALYTICS: {
    TRACK_VIEWS: true,
    TRACK_CLICKS: true,
    TRACK_CONVERSIONS: true,
  },

  MENU: {
    MAX_DEPTH: 2,
    SHOW_PRODUCT_COUNT: true,
  },

  BREADCRUMB: {
    MAX_ITEMS: 5,
    SEPARATOR: ' > ',
    SHOW_HOME: true,
  },
} as const;

export const CATEGORY_ERROR_CODES = {
  CAT001: 'CATEGORY_NOT_FOUND',
  CAT002: 'CATEGORY_ALREADY_EXISTS',
  CAT003: 'INVALID_TYPE',
  CAT004: 'INVALID_SORT_OPTION',
  CAT005: 'INVALID_PAGINATION',
  CAT006: 'INVALID_SLUG',
  CAT007: 'PARENT_CATEGORY_NOT_FOUND',
  CAT008: 'CATEGORY_SLUG_EXISTS',
  CAT009: 'CANNOT_SET_SELF_AS_PARENT',
  CAT010: 'CATEGORY_HAS_PRODUCTS',
  CAT011: 'CATEGORY_HAS_CHILDREN',
  CAT012: 'INSUFFICIENT_PERMISSIONS',
  CAT013: 'BULK_OPERATION_FAILED',
  CAT014: 'CIRCULAR_REFERENCE',
  CAT015: 'MAX_DEPTH_EXCEEDED',
  CAT016: 'INVALID_SEARCH_QUERY',
  CAT017: 'INVALID_REORDER_DATA',
  CAT018: 'DUPLICATE_ORDER',
  CAT019: 'VALIDATION_ERROR',
  CAT020: 'INTERNAL_ERROR',
} as const;

export type CategoryErrorCode = keyof typeof CATEGORY_ERROR_CODES;

export const CATEGORY_PERMISSIONS = {
  CREATE: 'category:create',
  READ: 'category:read',
  UPDATE: 'category:update',
  DELETE: 'category:delete',
  TOGGLE: 'category:toggle',
  REORDER: 'category:reorder',
  BULK_DELETE: 'category:bulk_delete',
  EXPORT: 'category:export',
  IMPORT: 'category:import',
} as const;

export type CategoryPermission =
  typeof CATEGORY_PERMISSIONS[keyof typeof CATEGORY_PERMISSIONS];

export const CATEGORY_FILTER_PRESETS = {
  ACTIVE_KITCHEN: {
    type: 'KITCHEN',
    isActive: true,
  },
  ACTIVE_BEDROOM: {
    type: 'BEDROOM',
    isActive: true,
  },
  FEATURED: {
    isFeatured: true,
    isActive: true,
  },
  ROOT_CATEGORIES: {
    parentId: null,
    isActive: true,
  },
} as const;

export const CATEGORY_DISPLAY_OPTIONS = {
  CARD: 'card',
  LIST: 'list',
  GRID: 'grid',
  TREE: 'tree',
  MENU: 'menu',
} as const;

export const CATEGORY_IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
} as const;

export const CATEGORY_ICON_SIZES = {
  SMALL: { width: 32, height: 32 },
  MEDIUM: { width: 64, height: 64 },
  LARGE: { width: 128, height: 128 },
} as const;