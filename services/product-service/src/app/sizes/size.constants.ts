export const SIZE_CONSTANTS = {
  VALIDATION: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
    TITLE_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    MIN_DIMENSION: 0,
    MAX_DIMENSION: 100000
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100
  },

  BULK_OPERATIONS: {
    MAX_CREATE: 50,
    MAX_DELETE: 50,
    MAX_UPDATE: 50
  },

  SORT: {
    DEFAULT_FIELD: 'sortOrder',
    DEFAULT_ORDER: 'asc',
    ALLOWED_FIELDS: ['name', 'title', 'createdAt', 'sortOrder', 'updatedAt'],
    ALLOWED_ORDERS: ['asc', 'desc']
  },

  CATEGORIES: {
    KITCHEN: 'KITCHEN',
    BEDROOM: 'BEDROOM',
    BOTH: 'BOTH'
  },

  UNITS: {
    MM: 'mm',
    CM: 'cm',
    INCH: 'inch',
    FEET: 'feet'
  },

  STATUS: {
    ACTIVE: true,
    INACTIVE: false
  },

  DIMENSION_TOLERANCE: {
    DEFAULT: 0,
    STRICT: 0,
    LOOSE: 10,
    VERY_LOOSE: 50
  },

  UNIT_CONVERSIONS: {
    MM_TO_CM: 0.1,
    MM_TO_INCH: 0.0393701,
    MM_TO_FEET: 0.00328084,
    CM_TO_MM: 10,
    CM_TO_INCH: 0.393701,
    CM_TO_FEET: 0.0328084,
    INCH_TO_MM: 25.4,
    INCH_TO_CM: 2.54,
    INCH_TO_FEET: 0.0833333,
    FEET_TO_MM: 304.8,
    FEET_TO_CM: 30.48,
    FEET_TO_INCH: 12
  },

  ERROR_CODES: {
    SIZE_NOT_FOUND: 'SIZE_NOT_FOUND',
    SIZE_ALREADY_EXISTS: 'SIZE_ALREADY_EXISTS',
    INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
    INVALID_UNIT: 'INVALID_UNIT',
    INVALID_CATEGORY: 'INVALID_CATEGORY',
    INVALID_SORT_FIELD: 'INVALID_SORT_FIELD',
    INVALID_SORT_ORDER: 'INVALID_SORT_ORDER',
    INVALID_PAGINATION: 'INVALID_PAGINATION',
    DUPLICATE_SIZE_NAME: 'DUPLICATE_SIZE_NAME',
    SIZE_IN_USE: 'SIZE_IN_USE',
    BULK_OPERATION_FAILED: 'BULK_OPERATION_FAILED',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  },

  ERROR_MESSAGES: {
    SIZE_NOT_FOUND: 'Size not found',
    SIZE_ALREADY_EXISTS: 'A size with this name already exists',
    INVALID_DIMENSIONS: 'Invalid dimensions provided',
    INVALID_UNIT: 'Invalid unit. Must be mm, cm, inch, or feet',
    INVALID_CATEGORY: 'Invalid category. Must be KITCHEN, BEDROOM, or BOTH',
    INVALID_SORT_FIELD: 'Invalid sort field',
    INVALID_SORT_ORDER: 'Invalid sort order. Must be asc or desc',
    INVALID_PAGINATION: 'Invalid pagination parameters',
    DUPLICATE_SIZE_NAME: 'A size with this name already exists',
    SIZE_IN_USE: 'Cannot delete size as it is associated with products',
    BULK_OPERATION_FAILED: 'Bulk operation completed with errors',
    VALIDATION_ERROR: 'Validation error occurred'
  },

  SUCCESS_MESSAGES: {
    SIZE_CREATED: 'Size created successfully',
    SIZE_UPDATED: 'Size updated successfully',
    SIZE_DELETED: 'Size deleted successfully',
    SIZE_STATUS_UPDATED: 'Size status updated successfully',
    BULK_CREATE_SUCCESS: 'Sizes created successfully',
    BULK_DELETE_SUCCESS: 'Sizes deleted successfully'
  },

  CACHE: {
    TTL: 3600,
    KEY_PREFIX: 'size:',
    LIST_KEY: 'sizes:list',
    SEARCH_KEY_PREFIX: 'sizes:search:',
    CATEGORY_KEY_PREFIX: 'sizes:category:'
  },

  SEARCH: {
    MIN_QUERY_LENGTH: 1,
    MAX_QUERY_LENGTH: 100,
    FUZZY_THRESHOLD: 0.6
  },

  DEFAULT_VALUES: {
    IS_ACTIVE: true,
    CATEGORY: 'BOTH',
    UNIT: 'mm',
    SORT_ORDER: 0,
    METADATA: {}
  },

  FIELD_NAMES: {
    ID: 'id',
    NAME: 'name',
    TITLE: 'title',
    DESCRIPTION: 'description',
    IMAGE: 'image',
    WIDTH: 'width',
    HEIGHT: 'height',
    DEPTH: 'depth',
    UNIT: 'unit',
    CATEGORY: 'category',
    IS_ACTIVE: 'isActive',
    SORT_ORDER: 'sortOrder',
    METADATA: 'metadata',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    DELETED_AT: 'deletedAt'
  },

  QUERY_PARAMS: {
    PAGE: 'page',
    LIMIT: 'limit',
    SORT_BY: 'sortBy',
    SORT_ORDER: 'sortOrder',
    SEARCH: 'q',
    CATEGORY: 'category',
    IS_ACTIVE: 'isActive',
    WIDTH: 'width',
    HEIGHT: 'height',
    DEPTH: 'depth',
    TOLERANCE: 'tolerance'
  },

  COMMON_KITCHEN_SIZES: [
    {
      name: 'Standard Base Cabinet',
      title: 'Standard Kitchen Base Cabinet',
      width: 600,
      height: 900,
      depth: 600,
      unit: 'mm',
      category: 'KITCHEN'
    },
    {
      name: 'Standard Wall Cabinet',
      title: 'Standard Kitchen Wall Cabinet',
      width: 600,
      height: 720,
      depth: 300,
      unit: 'mm',
      category: 'KITCHEN'
    },
    {
      name: 'Standard Tall Cabinet',
      title: 'Standard Kitchen Tall Cabinet',
      width: 600,
      height: 2100,
      depth: 600,
      unit: 'mm',
      category: 'KITCHEN'
    },
    {
      name: 'Corner Base Cabinet',
      title: 'Kitchen Corner Base Cabinet',
      width: 900,
      height: 900,
      depth: 900,
      unit: 'mm',
      category: 'KITCHEN'
    }
  ],

  COMMON_BEDROOM_SIZES: [
    {
      name: 'Standard Wardrobe',
      title: 'Standard Bedroom Wardrobe',
      width: 1200,
      height: 2400,
      depth: 600,
      unit: 'mm',
      category: 'BEDROOM'
    },
    {
      name: 'Single Door Wardrobe',
      title: 'Single Door Bedroom Wardrobe',
      width: 600,
      height: 2400,
      depth: 600,
      unit: 'mm',
      category: 'BEDROOM'
    },
    {
      name: 'Bedside Table',
      title: 'Standard Bedside Table',
      width: 450,
      height: 600,
      depth: 400,
      unit: 'mm',
      category: 'BEDROOM'
    },
    {
      name: 'Chest of Drawers',
      title: 'Standard Chest of Drawers',
      width: 800,
      height: 1200,
      depth: 450,
      unit: 'mm',
      category: 'BEDROOM'
    }
  ],

  STANDARD_DIMENSIONS: {
    KITCHEN: {
      BASE_CABINET_HEIGHT: 900,
      WALL_CABINET_HEIGHT: 720,
      TALL_CABINET_HEIGHT: 2100,
      COUNTER_DEPTH: 600,
      WALL_CABINET_DEPTH: 300,
      STANDARD_WIDTH: 600
    },
    BEDROOM: {
      WARDROBE_HEIGHT: 2400,
      WARDROBE_DEPTH: 600,
      BEDSIDE_HEIGHT: 600,
      BEDSIDE_DEPTH: 400,
      CHEST_HEIGHT: 1200
    }
  },

  DIMENSION_RANGES: {
    KITCHEN: {
      WIDTH: { MIN: 300, MAX: 1200 },
      HEIGHT: { MIN: 600, MAX: 2400 },
      DEPTH: { MIN: 300, MAX: 700 }
    },
    BEDROOM: {
      WIDTH: { MIN: 400, MAX: 2400 },
      HEIGHT: { MIN: 600, MAX: 2700 },
      DEPTH: { MIN: 400, MAX: 700 }
    }
  },

  EVENT_TYPES: {
    SIZE_CREATED: 'size.created',
    SIZE_UPDATED: 'size.updated',
    SIZE_DELETED: 'size.deleted',
    SIZE_STATUS_CHANGED: 'size.status.changed',
    SIZES_BULK_CREATED: 'sizes.bulk.created',
    SIZES_BULK_DELETED: 'sizes.bulk.deleted'
  },

  PERMISSIONS: {
    CREATE: 'size:create',
    READ: 'size:read',
    UPDATE: 'size:update',
    DELETE: 'size:delete',
    BULK_CREATE: 'size:bulk:create',
    BULK_DELETE: 'size:bulk:delete',
    MANAGE_ALL: 'size:manage:all'
  },

  ROLES: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER'
  },

  VOLUME_UNITS: {
    CUBIC_MM: 'mm³',
    CUBIC_CM: 'cm³',
    CUBIC_INCH: 'in³',
    CUBIC_FEET: 'ft³'
  },

  DISPLAY_FORMATS: {
    FULL: 'full',
    SHORT: 'short',
    MINIMAL: 'minimal'
  }
} as const;

export type SizeErrorCode = typeof SIZE_CONSTANTS.ERROR_CODES[keyof typeof SIZE_CONSTANTS.ERROR_CODES];
export type SizeEventType = typeof SIZE_CONSTANTS.EVENT_TYPES[keyof typeof SIZE_CONSTANTS.EVENT_TYPES];
export type SizePermission = typeof SIZE_CONSTANTS.PERMISSIONS[keyof typeof SIZE_CONSTANTS.PERMISSIONS];
export type SizeRole = typeof SIZE_CONSTANTS.ROLES[keyof typeof SIZE_CONSTANTS.ROLES];
export type SizeUnit = typeof SIZE_CONSTANTS.UNITS[keyof typeof SIZE_CONSTANTS.UNITS];
export type SizeCategory = typeof SIZE_CONSTANTS.CATEGORIES[keyof typeof SIZE_CONSTANTS.CATEGORIES];