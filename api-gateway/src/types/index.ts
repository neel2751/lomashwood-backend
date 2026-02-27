export * from './request.types';
export * from './response.types';
export * from './service.types';

export interface HttpMethod {
  GET: 'GET';
  POST: 'POST';
  PUT: 'PUT';
  PATCH: 'PATCH';
  DELETE: 'DELETE';
}

export interface HttpStatusCode {
  OK: 200;
  CREATED: 201;
  ACCEPTED: 202;
  NO_CONTENT: 204;
  BAD_REQUEST: 400;
  UNAUTHORIZED: 401;
  FORBIDDEN: 403;
  NOT_FOUND: 404;
  CONFLICT: 409;
  UNPROCESSABLE_ENTITY: 422;
  TOO_MANY_REQUESTS: 429;
  INTERNAL_SERVER_ERROR: 500;
  BAD_GATEWAY: 502;
  SERVICE_UNAVAILABLE: 503;
  GATEWAY_TIMEOUT: 504;
}

export interface ErrorCode {
  VALIDATION_ERROR: 'VALIDATION_ERROR';
  UNAUTHORIZED: 'UNAUTHORIZED';
  FORBIDDEN: 'FORBIDDEN';
  NOT_FOUND: 'NOT_FOUND';
  CONFLICT: 'CONFLICT';
  INTERNAL_ERROR: 'INTERNAL_ERROR';
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE';
  TIMEOUT: 'TIMEOUT';
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED';
  INVALID_TOKEN: 'INVALID_TOKEN';
  TOKEN_EXPIRED: 'TOKEN_EXPIRED';
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS';
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED';
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY';
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK';
  PAYMENT_FAILED: 'PAYMENT_FAILED';
  BOOKING_UNAVAILABLE: 'BOOKING_UNAVAILABLE';
}

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  port: number;
  apiVersion: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    max: number;
  };
  services: {
    auth: ServiceEndpoint;
    product: ServiceEndpoint;
    order: ServiceEndpoint;
    appointment: ServiceEndpoint;
    content: ServiceEndpoint;
    customer: ServiceEndpoint;
    notification: ServiceEndpoint;
    analytics: ServiceEndpoint;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
}

export interface ServiceEndpoint {
  url: string;
  timeout: number;
  retries: number;
  healthCheckPath: string;
}

export interface RouteConfig {
  path: string;
  method: keyof HttpMethod;
  handler: Function;
  middleware?: Function[];
  validation?: {
    params?: any;
    query?: any;
    body?: any;
  };
  auth?: boolean;
  roles?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface MiddlewareContext {
  requestId: string;
  startTime: number;
  user?: AuthenticatedUser;
  serviceMetrics?: ServiceMetrics;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'CONSULTANT';
  isEmailVerified: boolean;
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastHealthCheck?: Date;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  ttl: number;
  prefix: string;
  enabled: boolean;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  maxDelay?: number;
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  resetTimeout: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
}

export interface NotificationPayload {
  type: 'EMAIL' | 'SMS' | 'PUSH';
  recipient: string;
  template?: string;
  data?: Record<string, any>;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  scheduledAt?: Date;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  variants?: Record<string, any>;
  conditions?: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  attribute: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
  value: any;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetAt: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: Record<string, ServiceHealthStatus>;
}

export interface ServiceHealthStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

export interface BulkOperationRequest<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
  options?: {
    continueOnError?: boolean;
    validateBeforeExecute?: boolean;
  };
}

export interface BulkOperationResponse {
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: BulkOperationResult[];
  errors?: BulkOperationError[];
}

export interface BulkOperationResult {
  id?: string;
  status: 'success' | 'failure';
  data?: any;
  error?: string;
}

export interface BulkOperationError {
  index: number;
  id?: string;
  error: string;
  code: string;
}

export interface SearchCriteria {
  query: string;
  fields?: string[];
  filters?: Record<string, any>;
  sort?: SortCriteria[];
  page?: number;
  limit?: number;
}

export interface SortCriteria {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ExportRequest {
  format: 'JSON' | 'CSV' | 'XLSX' | 'PDF';
  filters?: Record<string, any>;
  fields?: string[];
  filename?: string;
}

export interface ExportResponse {
  url: string;
  filename: string;
  size: number;
  expiresAt: Date;
}

export interface ImportRequest {
  format: 'JSON' | 'CSV' | 'XLSX';
  file: FileUpload;
  options?: {
    skipErrors?: boolean;
    validateOnly?: boolean;
  };
}

export interface ImportResponse {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors?: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];