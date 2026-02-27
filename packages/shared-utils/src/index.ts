export {
  createLogger,
  createChildLogger,
  createRequestLogger,
  logRequest,
  logError,
  logEvent,
  logDatabaseQuery,
} from './logger.js';

export type {
  LogLevel,
  LoggerConfig,
  RequestLogContext,
  ErrorLogContext,
  EventLogContext,
  DatabaseLogContext,
} from './logger.js';

export {
  generateUuid,
  generateSecureToken,
  generateSlug,
  generateUniqueSlug,
  generateOtp,
  generateAlphanumericToken,
  generateReferenceNumber,
  hashPassword,
  verifyPassword,
  hashSha256,
  hashSha512,
  createHmacSha256,
  verifyHmacSha256,
  safeCompare,
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  maskEmail,
  maskPhone,
  truncateSha,
} from './crypto.js';

export {
  toDate,
  isValidDate,
  nowUtc,
  toIso,
  toDateString,
  addTime,
  subtractTime,
  diffInMs,
  diffInSeconds,
  diffInMinutes,
  diffInHours,
  diffInDays,
  isBefore,
  isAfter,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  isWithinRange,
  isExpired,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  dateRangeForPeriod,
  formatDuration,
  formatRelative,
  parseTimeString,
  timeStringToMinutes,
  minutesToTimeString,
  isTimeSlotAvailable,
  getExpiryDate,
  secondsUntil,
} from './date.js';

export type {
  DateInput,
  TimeUnit,
  DateRange,
  TimeSlotRange,
} from './date.js';

export {
  parsePaginationParams,
  buildPaginationMeta,
  toPrismaOffsetArgs,
  buildPaginatedResult,
  buildCursorPaginationMeta,
  buildCursorPaginatedResult,
  toPrismaCursorArgs,
  calculateOffset,
  getPageFromOffset,
  isLastPage,
  isFirstPage,
  clampLimit,
} from './pagination.js';

export type {
  PaginationParams,
  PaginationMeta,
  PaginatedResult,
  CursorPaginationParams,
  CursorPaginationMeta,
  CursorPaginatedResult,
  PrismaOffsetArgs,
} from './pagination.js';

export {
  withRetry,
  withTimeout,
  withDeadline,
  isRetryableError,
  isRetryableHttpStatus,
  CircuitBreaker,
  CircuitBreakerOpenError,
  MaxRetriesExceededError,
} from './retry.js';

export type {
  RetryOptions,
  RetryResult,
  RetryableError,
  CircuitBreakerOptions,
  CircuitBreakerState,
} from './retry.js';

export {
  getEnv,
  getEnvOrDefault,
  getEnvOptional,
  getEnvInt,
  getEnvFloat,
  getEnvBool,
  getEnvEnum,
  getEnvArray,
  getEnvUrl,
  getNodeEnv,
  isDevelopment,
  isProduction,
  isTest,
  isStaging,
  validateRequiredEnvVars,
  assertRequiredEnvVars,
  EnvValidationError,
} from './env.js';

export type {
  NodeEnv,
  EnvValidationResult,
} from './env.js';