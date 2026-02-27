export const EXPORT_ROUTES = {
  BASE: '/exports',
  BY_ID: '/:id',
  DOWNLOAD: '/:id/download',
  CANCEL: '/:id/cancel',
  RETRY: '/:id/retry',
} as const;

export const EXPORT_CACHE_KEYS = {
  export: (id: string) => `export:${id}`,
  userExports: (userId: string) => `exports:user:${userId}`,
} as const;

export const EXPORT_CACHE_TTL = {
  EXPORT: 300,
  USER_LIST: 120,
} as const;

export const EXPORT_ERRORS = {
  NOT_FOUND: 'Export not found',
  NOT_OWNED: 'You do not have access to this export',
  NOT_COMPLETED: 'Export is not yet completed',
  ALREADY_EXPIRED: 'Export has expired and is no longer available',
  FILE_NOT_FOUND: 'Export file could not be located',
  CANNOT_CANCEL: 'Only pending or processing exports can be cancelled',
  CANNOT_RETRY: 'Only failed exports can be retried',
  REPORT_NOT_FOUND: 'Associated report not found',
  MAX_ROWS_EXCEEDED: 'Export exceeds the maximum allowed row limit',
} as const;

export const EXPORT_FILE_EXPIRY_HOURS = 24;
export const EXPORT_MAX_ROWS = 100_000;
export const EXPORT_TEMP_DIR = '/tmp/analytics-exports';

export const EXPORT_MIME_TYPES: Record<string, string> = {
  CSV: 'text/csv',
  JSON: 'application/json',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export const EXPORT_FILE_EXTENSIONS: Record<string, string> = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
} as const;