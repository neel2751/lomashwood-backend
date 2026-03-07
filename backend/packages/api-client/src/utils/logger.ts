export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export interface LogContext {
  service?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private defaultContext: LogContext = {};

  constructor(isDevelopment: boolean = false) {
    this.isDevelopment = isDevelopment;
    this.defaultContext = {};
  }

  public log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === LogLevel.DEBUG) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.defaultContext,
      ...context,
    };

    if (this.isDevelopment) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m',
        [LogLevel.WARN]: '\x1b[33m',
        [LogLevel.INFO]: '\x1b[36m',
        [LogLevel.HTTP]: '\x1b[35m',
        [LogLevel.VERBOSE]: '\x1b[34m',
        [LogLevel.DEBUG]: '\x1b[90m',
        [LogLevel.SILLY]: '\x1b[37m',
      };

      const reset = '\x1b[0m';
      const color = colors[level] || '';

      console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`, logEntry);
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  http(message: string, context?: LogContext): void {
    this.log(LogLevel.HTTP, message, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.log(LogLevel.VERBOSE, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  silly(message: string, context?: LogContext): void {
    this.log(LogLevel.SILLY, message, context);
  }

  child(context: LogContext): Logger {
    const childLogger = new Logger(this.isDevelopment);
    childLogger.defaultContext = { ...this.defaultContext, ...context };
    return childLogger;
  }

  request(requestId: string, userId?: string, sessionId?: string): Logger {
    return this.child({
      requestId,
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
    });
  }

  service(serviceName: string): Logger {
    return this.child({ service: serviceName });
  }
}

const isDev = process.env.NODE_ENV === 'development';
export const logger = new Logger(isDev);

export const createServiceLogger = (serviceName: string): Logger => {
  return new Logger(isDev).service(serviceName);
};

export const createRequestLogger = (req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const userId = req.user?.id;
  const sessionId = req.session?.id;

  req.logger = logger.request(requestId, userId, sessionId);
  req.requestId = requestId;

  next();
};

const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getLogLevel = (): LogLevel => {
  const env = process.env.NODE_ENV;

  switch (env) {
    case 'production':
      return LogLevel.INFO;
    case 'test':
      return LogLevel.WARN;
    case 'development':
    default:
      return LogLevel.DEBUG;
  }
};

export const logError = (error: Error, context?: LogContext): void => {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
  });
};

export const logPerformance = (operation: string, duration: number, context?: LogContext): void => {
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    ...context,
    operation,
    duration,
    type: 'performance',
  });
};

export const logApiCall = (method: string, url: string, statusCode: number, duration: number, context?: LogContext): void => {
  const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
  logger.log(level, `${method} ${url} - ${statusCode} (${duration}ms)`, {
    ...context,
    method,
    url,
    statusCode,
    duration,
    type: 'api_call',
  });
};

export const logDatabaseQuery = (query: string, duration: number, context?: LogContext): void => {
  logger.debug(`Database query: ${query} (${duration}ms)`, {
    ...context,
    query,
    duration,
    type: 'database_query',
  });
};

export const logAuthEvent = (event: string, userId?: string, context?: LogContext): void => {
  logger.info(`Auth event: ${event}`, {
    ...context,
    event,
    ...(userId && { userId }),
    type: 'auth_event',
  });
};

export const logBusinessEvent = (event: string, data?: any, context?: LogContext): void => {
  logger.info(`Business event: ${event}`, {
    ...context,
    event,
    data,
    type: 'business_event',
  });
};

export default logger;