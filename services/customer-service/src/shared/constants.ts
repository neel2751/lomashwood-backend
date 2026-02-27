export const HttpStatus = {
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
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export const Pagination = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder];

export const CustomerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export const TicketRefPrefix = 'TKT';
export const TicketRefLength = 8;

export const GDPR = {
  INACTIVITY_THRESHOLD_DAYS: 730,
  ANONYMIZATION_BATCH_SIZE: 50,
  DATA_EXPORT_TTL_HOURS: 24,
} as const;

export const CACHE = {
  ENABLED: process.env['NODE_ENV'] !== 'test',
} as const;

export const DATE_FORMATS = {
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_FULL: 'dd MMMM yyyy, HH:mm',
} as const;