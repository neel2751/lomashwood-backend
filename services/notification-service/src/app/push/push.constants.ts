export const PUSH_CONSTANTS = {
  DEFAULT_TTL_SECONDS: 86400, // 24 hours
  MAX_TTL_SECONDS: 2419200,   // 28 days (FCM max)
  MAX_BATCH_SIZE: 500,
  MAX_DATA_PAYLOAD_SIZE_BYTES: 4096,
  MAX_NOTIFICATION_PAYLOAD_SIZE_BYTES: 4096,
  DEFAULT_PRIORITY: 'NORMAL',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const PUSH_ROUTES = {
  BASE: '/push',
  SEND: '/send',
  SEND_BULK: '/send/bulk',
  SEND_TO_USER: '/send/user/:userId',
  REGISTER_TOKEN: '/tokens',
  UNREGISTER_TOKEN: '/tokens/:token',
  LIST: '/',
  GET_BY_ID: '/:id',
} as const;

export const PUSH_ERRORS = {
  SEND_FAILED: 'PUSH_SEND_FAILED',
  INVALID_TOKEN: 'PUSH_INVALID_TOKEN',
  TOKEN_NOT_REGISTERED: 'PUSH_TOKEN_NOT_REGISTERED',
  PROVIDER_UNAVAILABLE: 'PUSH_PROVIDER_UNAVAILABLE',
  PAYLOAD_TOO_LARGE: 'PUSH_PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'PUSH_RATE_LIMITED',
  UNKNOWN_PROVIDER: 'PUSH_UNKNOWN_PROVIDER',
  USER_NOT_FOUND: 'PUSH_USER_NOT_FOUND',
  NO_TOKENS_REGISTERED: 'PUSH_NO_TOKENS_REGISTERED',
} as const;

export const PUSH_EVENTS = {
  SENT: 'push.sent',
  FAILED: 'push.failed',
  DELIVERED: 'push.delivered',
  TOKEN_REGISTERED: 'push.token.registered',
  TOKEN_UNREGISTERED: 'push.token.unregistered',
} as const;

export const PUSH_CACHE_KEYS = {
  USER_TOKENS: (userId: string) => `push:tokens:user:${userId}`,
  NOTIFICATION: (id: string) => `push:notification:${id}`,
} as const;