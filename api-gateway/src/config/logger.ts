import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env, isDevelopment, isProduction, isTest } from './env';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray',
};

winston.addColors(logColors);

const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  customFormat
);

const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

const consoleTransport = new winston.transports.Console({
  format: isDevelopment ? developmentFormat : productionFormat,
  level: env.LOG_LEVEL,
});

const createFileTransport = (level: string): DailyRotateFile => {
  return new DailyRotateFile({
    filename: path.join(env.LOG_FILE_PATH, `${level}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    level,
    maxSize: '20m',
    maxFiles: '14d',
    format: productionFormat,
    zippedArchive: true,
  });
};

const createCombinedFileTransport = (): DailyRotateFile => {
  return new DailyRotateFile({
    filename: path.join(env.LOG_FILE_PATH, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: productionFormat,
    zippedArchive: true,
  });
};

const transports: winston.transport[] = [consoleTransport];

if (env.LOG_FILE_ENABLED && !isTest) {
  transports.push(createFileTransport('error'));
  transports.push(createFileTransport('warn'));
  transports.push(createCombinedFileTransport());
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: logLevels,
  format: isProduction ? productionFormat : developmentFormat,
  transports,
  exitOnError: false,
  silent: isTest,
});

export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export const logRequest = (req: any) => {
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.headers['x-request-id'],
  });
};

export const logResponse = (req: any, res: any, responseTime: number) => {
  logger.http('Outgoing response', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    requestId: req.headers['x-request-id'],
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

export const logServiceCall = (
  serviceName: string,
  endpoint: string,
  method: string,
  duration?: number
) => {
  logger.info('Service call', {
    serviceName,
    endpoint,
    method,
    duration: duration ? `${duration}ms` : undefined,
  });
};

export const logServiceError = (
  serviceName: string,
  endpoint: string,
  error: Error
) => {
  logger.error('Service call failed', {
    serviceName,
    endpoint,
    error: error.message,
    stack: error.stack,
  });
};

export const logDatabaseQuery = (query: string, duration: number) => {
  logger.debug('Database query', {
    query,
    duration: `${duration}ms`,
  });
};

export const logDatabaseError = (query: string, error: Error) => {
  logger.error('Database query failed', {
    query,
    error: error.message,
    stack: error.stack,
  });
};

export const logCacheHit = (key: string) => {
  logger.debug('Cache hit', { key });
};

export const logCacheMiss = (key: string) => {
  logger.debug('Cache miss', { key });
};

export const logCacheError = (operation: string, key: string, error: Error) => {
  logger.error('Cache operation failed', {
    operation,
    key,
    error: error.message,
  });
};

export const logAuthEvent = (event: string, userId?: string, email?: string) => {
  logger.info('Authentication event', {
    event,
    userId,
    email,
  });
};

export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  logger.warn('Security event', {
    event,
    ...details,
  });
};

export const logPaymentEvent = (
  event: string,
  orderId?: string,
  paymentId?: string,
  amount?: number
) => {
  logger.info('Payment event', {
    event,
    orderId,
    paymentId,
    amount,
  });
};

export const logBookingEvent = (
  event: string,
  bookingId?: string,
  userId?: string
) => {
  logger.info('Booking event', {
    event,
    bookingId,
    userId,
  });
};

export const logEmailEvent = (
  event: string,
  to: string,
  template?: string
) => {
  logger.info('Email event', {
    event,
    to,
    template,
  });
};

export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  const level = duration > 3000 ? 'warn' : 'info';
  logger.log(level, 'Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

export const logBusinessMetric = (
  metric: string,
  value: number,
  metadata?: Record<string, any>
) => {
  logger.info('Business metric', {
    metric,
    value,
    ...metadata,
  });
};

export const logFeatureFlag = (
  flag: string,
  enabled: boolean,
  userId?: string
) => {
  logger.debug('Feature flag', {
    flag,
    enabled,
    userId,
  });
};

export const logValidationError = (
  field: string,
  error: string,
  value?: any
) => {
  logger.warn('Validation error', {
    field,
    error,
    value,
  });
};

export const logRateLimitExceeded = (
  ip: string,
  endpoint: string,
  limit: number
) => {
  logger.warn('Rate limit exceeded', {
    ip,
    endpoint,
    limit,
  });
};

export const logCircuitBreakerOpen = (serviceName: string) => {
  logger.error('Circuit breaker opened', { serviceName });
};

export const logCircuitBreakerClosed = (serviceName: string) => {
  logger.info('Circuit breaker closed', { serviceName });
};

export const logHealthCheck = (
  service: string,
  status: 'healthy' | 'unhealthy',
  details?: Record<string, any>
) => {
  const level = status === 'healthy' ? 'info' : 'error';
  logger.log(level, 'Health check', {
    service,
    status,
    ...details,
  });
};

export const logStartup = (port: number, environment: string) => {
  logger.info('Application started', {
    port,
    environment,
    nodeVersion: process.version,
    pid: process.pid,
  });
};

export const logShutdown = (signal: string) => {
  logger.info('Application shutting down', {
    signal,
    uptime: process.uptime(),
  });
};

if (isDevelopment) {
  logger.debug('Logger initialized in development mode', {
    level: env.LOG_LEVEL,
    fileLogging: env.LOG_FILE_ENABLED,
  });
}

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});