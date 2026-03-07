export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'],
  
  // Cache
  CACHE_TTL: 3600, // 1 hour
  CACHE_KEY_PREFIX: 'lomashwood:',
  
  // Security
  BCRYPT_ROUNDS: 12,
  JWT_EXPIRES_IN: '24h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX: 100,
  
  // Dates
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  
  // API
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1',
} as const;
