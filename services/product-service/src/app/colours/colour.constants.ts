export const COLOUR_CONSTANTS = {
  VALIDATION: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
    HEX_CODE_REGEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    HEX_CODE_SHORT_REGEX: /^[A-Fa-f0-9]{3}$/,
    HEX_CODE_LONG_REGEX: /^[A-Fa-f0-9]{6}$/
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
    ALLOWED_FIELDS: ['name', 'createdAt', 'sortOrder', 'updatedAt'],
    ALLOWED_ORDERS: ['asc', 'desc']
  },

  CATEGORIES: {
    KITCHEN: 'KITCHEN',
    BEDROOM: 'BEDROOM',
    BOTH: 'BOTH'
  },

  STATUS: {
    ACTIVE: true,
    INACTIVE: false
  },

  BRIGHTNESS: {
    THRESHOLD: 127.5,
    MIN: 0,
    MAX: 255
  },

  CONTRAST_COLORS: {
    LIGHT: '#000000',
    DARK: '#FFFFFF'
  },

  ERROR_CODES: {
    COLOUR_NOT_FOUND: 'COLOUR_NOT_FOUND',
    COLOUR_ALREADY_EXISTS: 'COLOUR_ALREADY_EXISTS',
    INVALID_HEX_CODE: 'INVALID_HEX_CODE',
    INVALID_CATEGORY: 'INVALID_CATEGORY',
    INVALID_SORT_FIELD: 'INVALID_SORT_FIELD',
    INVALID_SORT_ORDER: 'INVALID_SORT_ORDER',
    INVALID_PAGINATION: 'INVALID_PAGINATION',
    DUPLICATE_COLOUR_NAME: 'DUPLICATE_COLOUR_NAME',
    DUPLICATE_HEX_CODE: 'DUPLICATE_HEX_CODE',
    COLOUR_IN_USE: 'COLOUR_IN_USE',
    BULK_OPERATION_FAILED: 'BULK_OPERATION_FAILED',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  },

  ERROR_MESSAGES: {
    COLOUR_NOT_FOUND: 'Colour not found',
    COLOUR_ALREADY_EXISTS: 'A colour with this name or hex code already exists',
    INVALID_HEX_CODE: 'Invalid hex code format. Use #RRGGBB or #RGB',
    INVALID_CATEGORY: 'Invalid category. Must be KITCHEN, BEDROOM, or BOTH',
    INVALID_SORT_FIELD: 'Invalid sort field',
    INVALID_SORT_ORDER: 'Invalid sort order. Must be asc or desc',
    INVALID_PAGINATION: 'Invalid pagination parameters',
    DUPLICATE_COLOUR_NAME: 'A colour with this name already exists',
    DUPLICATE_HEX_CODE: 'A colour with this hex code already exists',
    COLOUR_IN_USE: 'Cannot delete colour as it is associated with products',
    BULK_OPERATION_FAILED: 'Bulk operation completed with errors',
    VALIDATION_ERROR: 'Validation error occurred'
  },

  SUCCESS_MESSAGES: {
    COLOUR_CREATED: 'Colour created successfully',
    COLOUR_UPDATED: 'Colour updated successfully',
    COLOUR_DELETED: 'Colour deleted successfully',
    COLOUR_STATUS_UPDATED: 'Colour status updated successfully',
    BULK_CREATE_SUCCESS: 'Colours created successfully',
    BULK_DELETE_SUCCESS: 'Colours deleted successfully'
  },

  CACHE: {
    TTL: 3600,
    KEY_PREFIX: 'colour:',
    LIST_KEY: 'colours:list',
    SEARCH_KEY_PREFIX: 'colours:search:',
    CATEGORY_KEY_PREFIX: 'colours:category:'
  },

  SEARCH: {
    MIN_QUERY_LENGTH: 1,
    MAX_QUERY_LENGTH: 100,
    FUZZY_THRESHOLD: 0.6
  },

  DEFAULT_VALUES: {
    IS_ACTIVE: true,
    CATEGORY: 'BOTH',
    SORT_ORDER: 0,
    METADATA: {}
  },

  FIELD_NAMES: {
    ID: 'id',
    NAME: 'name',
    HEX_CODE: 'hexCode',
    DESCRIPTION: 'description',
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
    IS_ACTIVE: 'isActive'
  },

  COMMON_COLOURS: [
    { name: 'White', hexCode: '#FFFFFF' },
    { name: 'Black', hexCode: '#000000' },
    { name: 'Red', hexCode: '#FF0000' },
    { name: 'Green', hexCode: '#00FF00' },
    { name: 'Blue', hexCode: '#0000FF' },
    { name: 'Yellow', hexCode: '#FFFF00' },
    { name: 'Cyan', hexCode: '#00FFFF' },
    { name: 'Magenta', hexCode: '#FF00FF' },
    { name: 'Gray', hexCode: '#808080' },
    { name: 'Light Gray', hexCode: '#D3D3D3' },
    { name: 'Dark Gray', hexCode: '#A9A9A9' },
    { name: 'Silver', hexCode: '#C0C0C0' },
    { name: 'Beige', hexCode: '#F5F5DC' },
    { name: 'Brown', hexCode: '#A52A2A' },
    { name: 'Navy', hexCode: '#000080' },
    { name: 'Cream', hexCode: '#FFFDD0' },
    { name: 'Ivory', hexCode: '#FFFFF0' },
    { name: 'Charcoal', hexCode: '#36454F' }
  ],

  POPULAR_KITCHEN_COLOURS: [
    { name: 'Pure White', hexCode: '#FFFFFF' },
    { name: 'Cream', hexCode: '#FFFDD0' },
    { name: 'Light Gray', hexCode: '#D3D3D3' },
    { name: 'Navy Blue', hexCode: '#000080' },
    { name: 'Charcoal', hexCode: '#36454F' },
    { name: 'Sage Green', hexCode: '#9DC183' },
    { name: 'Oak', hexCode: '#B87333' }
  ],

  POPULAR_BEDROOM_COLOURS: [
    { name: 'Soft White', hexCode: '#F5F5F5' },
    { name: 'Beige', hexCode: '#F5F5DC' },
    { name: 'Light Blue', hexCode: '#ADD8E6' },
    { name: 'Lavender', hexCode: '#E6E6FA' },
    { name: 'Mint Green', hexCode: '#98FF98' },
    { name: 'Blush Pink', hexCode: '#FFC0CB' },
    { name: 'Warm Gray', hexCode: '#B0A8A0' }
  ],

  RGB_WEIGHTS: {
    RED: 299,
    GREEN: 587,
    BLUE: 114
  },

  HEX_FORMATS: {
    SHORT: 3,
    LONG: 6,
    WITH_HASH_SHORT: 4,
    WITH_HASH_LONG: 7
  },

  EVENT_TYPES: {
    COLOUR_CREATED: 'colour.created',
    COLOUR_UPDATED: 'colour.updated',
    COLOUR_DELETED: 'colour.deleted',
    COLOUR_STATUS_CHANGED: 'colour.status.changed',
    COLOURS_BULK_CREATED: 'colours.bulk.created',
    COLOURS_BULK_DELETED: 'colours.bulk.deleted'
  },

  PERMISSIONS: {
    CREATE: 'colour:create',
    READ: 'colour:read',
    UPDATE: 'colour:update',
    DELETE: 'colour:delete',
    BULK_CREATE: 'colour:bulk:create',
    BULK_DELETE: 'colour:bulk:delete',
    MANAGE_ALL: 'colour:manage:all'
  },

  ROLES: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER'
  }
} as const;

export type ColourErrorCode = typeof COLOUR_CONSTANTS.ERROR_CODES[keyof typeof COLOUR_CONSTANTS.ERROR_CODES];
export type ColourEventType = typeof COLOUR_CONSTANTS.EVENT_TYPES[keyof typeof COLOUR_CONSTANTS.EVENT_TYPES];
export type ColourPermission = typeof COLOUR_CONSTANTS.PERMISSIONS[keyof typeof COLOUR_CONSTANTS.PERMISSIONS];
export type ColourRole = typeof COLOUR_CONSTANTS.ROLES[keyof typeof COLOUR_CONSTANTS.ROLES];