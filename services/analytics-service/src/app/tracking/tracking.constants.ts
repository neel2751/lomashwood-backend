export const TRACKING_ROUTES = {
  BASE: '/tracking',
  EVENT: '/event',
  BATCH: '/batch',
  SESSION: '/session',
  SESSION_END: '/session/end',
  PAGEVIEW: '/pageview',
  CONFIG: '/config',
  CONFIG_BY_KEY: '/config/:key',
} as const;

export const TRACKING_CACHE_KEYS = {
  config: (key: string) => `tracking:config:${key}`,
  allConfigs: () => `tracking:configs:all`,
  sessionExists: (sessionId: string) => `tracking:session:${sessionId}`,
} as const;

export const TRACKING_CACHE_TTL = {
  CONFIG: 3600,
  SESSION: 1800,
} as const;

export const TRACKING_BATCH_LIMITS = {
  MAX_EVENTS: 100,
  MAX_PAYLOAD_BYTES: 2097152,
} as const;

export const TRACKING_ERRORS = {
  SESSION_NOT_FOUND: 'Session not found',
  CONFIG_NOT_FOUND: 'Tracking config not found',
  CONFIG_KEY_EXISTS: 'Tracking config with this key already exists',
  BATCH_TOO_LARGE: `Batch exceeds maximum of ${TRACKING_BATCH_LIMITS.MAX_EVENTS} events`,
  INVALID_SESSION: 'Invalid or expired session',
} as const;

export const VISITOR_ID_HEADER = 'x-visitor-id';
export const SESSION_ID_HEADER = 'x-session-id';
export const USER_ID_HEADER = 'x-user-id';