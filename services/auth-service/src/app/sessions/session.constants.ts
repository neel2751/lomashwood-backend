export const SESSION_CONSTANTS = {
  TOKEN: {
    ACCESS_TOKEN_EXPIRATION: 15 * 60,
    REFRESH_TOKEN_EXPIRATION: 7 * 24 * 60 * 60,
    TOKEN_VERSION: 1,
    ALGORITHM: 'HS256',
    ISSUER: 'lomash-wood-auth',
    AUDIENCE: 'lomash-wood-api',
  },

  SESSION: {
    MAX_CONCURRENT_SESSIONS: 5,
    INACTIVITY_TIMEOUT: 30 * 60,
    EXTENSION_DURATION: 15 * 60,
    MAX_SESSION_LIFETIME: 30 * 24 * 60 * 60,
    CLEANUP_INTERVAL: 60 * 60,
    CLEANUP_BATCH_SIZE: 1000,
  },

  VALIDATION: {
    MIN_SESSION_LIFETIME: 5 * 60,
    MAX_SESSION_LIFETIME: 365 * 24 * 60 * 60,
    TOKEN_GRACE_PERIOD: 30,
    CLOCK_TOLERANCE: 60,
  },

  DEVICE: {
    MAX_DEVICE_NAME_LENGTH: 255,
    MAX_USER_AGENT_LENGTH: 500,
    MAX_LOCATION_LENGTH: 255,
    FINGERPRINT_ALGORITHM: 'sha256',
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },

  SORTING: {
    DEFAULT_SORT_BY: 'createdAt',
    DEFAULT_SORT_ORDER: 'desc',
    ALLOWED_SORT_FIELDS: ['createdAt', 'updatedAt', 'lastActivityAt', 'expiresAt'],
    ALLOWED_SORT_ORDERS: ['asc', 'desc'],
  },

  CLEANUP: {
    DEFAULT_OLDER_THAN_DAYS: 30,
    MAX_OLDER_THAN_DAYS: 365,
    MIN_OLDER_THAN_DAYS: 1,
    INCLUDE_EXPIRED_BY_DEFAULT: true,
    INCLUDE_REVOKED_BY_DEFAULT: false,
  },

  CACHE: {
    SESSION_CACHE_PREFIX: 'session:',
    USER_SESSIONS_PREFIX: 'user-sessions:',
    ACTIVE_COUNT_PREFIX: 'active-count:',
    CACHE_TTL: 5 * 60,
    CACHE_REFRESH_THRESHOLD: 1 * 60,
  },

  EVENTS: {
    SESSION_CREATED: 'session.created',
    SESSION_REFRESHED: 'session.refreshed',
    SESSION_REVOKED: 'session.revoked',
    SESSION_EXPIRED: 'session.expired',
    SESSION_ACTIVITY: 'session.activity',
    SESSION_DELETED: 'session.deleted',
    SESSIONS_BULK_REVOKED: 'sessions.bulk_revoked',
    SESSIONS_CLEANUP: 'sessions.cleanup',
  },

  ERRORS: {
    SESSION_NOT_FOUND: 'Session not found',
    SESSION_EXPIRED: 'Session has expired',
    SESSION_REVOKED: 'Session has been revoked',
    SESSION_INACTIVE: 'Session is inactive',
    INVALID_TOKEN: 'Invalid session token',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    UNAUTHORIZED_ACCESS: 'Unauthorized access to session',
    SESSION_LIMIT_EXCEEDED: 'Maximum concurrent sessions exceeded',
    INVALID_SESSION_DATA: 'Invalid session data provided',
    SESSION_UPDATE_FAILED: 'Failed to update session',
    SESSION_DELETE_FAILED: 'Failed to delete session',
    SESSION_CREATE_FAILED: 'Failed to create session',
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

  SECURITY: {
    REQUIRE_DEVICE_FINGERPRINT: false,
    ENFORCE_IP_VALIDATION: false,
    TRACK_LOCATION: true,
    TRACK_DEVICE_INFO: true,
    EXTEND_ON_ACTIVITY: true,
    REVOKE_ON_PASSWORD_CHANGE: true,
    REVOKE_ON_EMAIL_CHANGE: true,
    REVOKE_ON_ROLE_CHANGE: true,
  },

  RATE_LIMIT: {
    CREATE_SESSION_LIMIT: 10,
    CREATE_SESSION_WINDOW: 15 * 60,
    REFRESH_SESSION_LIMIT: 20,
    REFRESH_SESSION_WINDOW: 15 * 60,
    VALIDATE_SESSION_LIMIT: 100,
    VALIDATE_SESSION_WINDOW: 60,
  },

  METADATA: {
    MAX_METADATA_SIZE: 10240,
    ALLOWED_METADATA_KEYS: [
      'loginMethod',
      'twoFactorEnabled',
      'rememberMe',
      'loginSource',
      'browserInfo',
      'osInfo',
      'screenResolution',
    ],
  },

  DEVICE_TYPES: {
    DESKTOP: 'desktop',
    MOBILE: 'mobile',
    TABLET: 'tablet',
    OTHER: 'other',
  },

  SESSION_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
    INACTIVE: 'inactive',
  },

  ACTIVITY_TYPES: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    REFRESH: 'refresh',
    API_CALL: 'api_call',
    PAGE_VIEW: 'page_view',
    ACTION: 'action',
  },

  REVOKE_REASONS: {
    USER_LOGOUT: 'user_logout',
    PASSWORD_CHANGE: 'password_change',
    EMAIL_CHANGE: 'email_change',
    ROLE_CHANGE: 'role_change',
    ADMIN_REVOKE: 'admin_revoke',
    SECURITY_BREACH: 'security_breach',
    INACTIVITY: 'inactivity',
    EXPIRATION: 'expiration',
    CONCURRENT_LIMIT: 'concurrent_limit',
  },

  LOGS: {
    LOG_LEVEL_DEBUG: 'debug',
    LOG_LEVEL_INFO: 'info',
    LOG_LEVEL_WARN: 'warn',
    LOG_LEVEL_ERROR: 'error',
    LOG_SESSION_OPERATIONS: true,
    LOG_VALIDATION_FAILURES: true,
    LOG_CLEANUP_OPERATIONS: true,
  },

  DATABASE: {
    SESSION_TABLE: 'sessions',
    USER_TABLE: 'users',
    SESSION_ACTIVITY_TABLE: 'session_activities',
    SOFT_DELETE_FIELD: 'deletedAt',
    TIMESTAMP_FIELDS: ['createdAt', 'updatedAt', 'deletedAt'],
  },

  QUERY: {
    INCLUDE_USER: true,
    INCLUDE_METADATA: false,
    INCLUDE_DELETED: false,
    DEFAULT_SELECT: [
      'id',
      'userId',
      'expiresAt',
      'ipAddress',
      'userAgent',
      'deviceType',
      'deviceName',
      'location',
      'isActive',
      'lastActivityAt',
      'createdAt',
      'updatedAt',
    ],
  },
};

export const SESSION_MESSAGES = {
  SUCCESS: {
    SESSION_CREATED: 'Session created successfully',
    SESSION_UPDATED: 'Session updated successfully',
    SESSION_DELETED: 'Session deleted successfully',
    SESSION_REFRESHED: 'Session refreshed successfully',
    SESSION_VALIDATED: 'Session validated successfully',
    SESSIONS_REVOKED: 'Sessions revoked successfully',
    SESSIONS_CLEANED: 'Sessions cleaned up successfully',
  },

  ERROR: {
    SESSION_NOT_FOUND: 'The requested session could not be found',
    SESSION_EXPIRED: 'Your session has expired. Please log in again',
    SESSION_REVOKED: 'This session has been revoked',
    SESSION_INACTIVE: 'This session is no longer active',
    INVALID_TOKEN: 'Invalid or malformed session token',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    UNAUTHORIZED_ACCESS: 'You do not have permission to access this session',
    SESSION_LIMIT_EXCEEDED: 'Maximum number of concurrent sessions reached',
    INVALID_SESSION_DATA: 'The provided session data is invalid',
    SESSION_UPDATE_FAILED: 'Unable to update session. Please try again',
    SESSION_DELETE_FAILED: 'Unable to delete session. Please try again',
    SESSION_CREATE_FAILED: 'Unable to create session. Please try again',
    VALIDATION_FAILED: 'Session validation failed',
    REFRESH_FAILED: 'Unable to refresh session',
    CLEANUP_FAILED: 'Session cleanup operation failed',
  },

  INFO: {
    NO_SESSIONS_FOUND: 'No sessions found for the specified criteria',
    NO_ACTIVE_SESSIONS: 'No active sessions found',
    NO_EXPIRED_SESSIONS: 'No expired sessions to clean up',
    SESSION_WILL_EXPIRE: 'Your session will expire soon',
    SESSION_EXTENDED: 'Session lifetime has been extended',
  },
};

export const SESSION_REGEX = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  IP_V4: /^(\d{1,3}\.){3}\d{1,3}$/,
  IP_V6: /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i,
  JWT_TOKEN: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
};

export const SESSION_DEFAULTS = {
  IS_ACTIVE: true,
  DEVICE_TYPE: 'other',
  PAGE: 1,
  LIMIT: 10,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc',
  EXTEND_BY: 900,
  INCLUDE_EXPIRED: true,
  INCLUDE_REVOKED: false,
  EXCEPT_CURRENT_SESSION: false,
};

export default SESSION_CONSTANTS;