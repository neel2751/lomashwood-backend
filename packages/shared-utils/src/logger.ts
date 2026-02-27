import pino, { type Logger, type LoggerOptions } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig {
  readonly level: LogLevel;
  readonly service: string;
  readonly version?: string | undefined;
  readonly environment?: string | undefined;
  readonly pretty?: boolean | undefined;
}

export interface RequestLogContext {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly statusCode?: number | undefined;
  readonly durationMs?: number | undefined;
  readonly userId?: string | undefined;
  readonly ip?: string | undefined;
  readonly userAgent?: string | undefined;
}

export interface ErrorLogContext {
  readonly err: Error;
  readonly requestId?: string | undefined;
  readonly userId?: string | undefined;
  readonly context?: Record<string, unknown> | undefined;
}

export interface EventLogContext {
  readonly event: string;
  readonly topic?: string | undefined;
  readonly messageId?: string | undefined;
  readonly durationMs?: number | undefined;
  readonly context?: Record<string, unknown> | undefined;
}

export interface DatabaseLogContext {
  readonly query?: string | undefined;
  readonly durationMs: number;
  readonly rows?: number | undefined;
  readonly error?: Error | undefined;
}

const buildPinoOptions = (config: LoggerConfig): LoggerOptions => {
  const options: LoggerOptions = {
    level: config.level,
    base: {
      service: config.service,
      version: config.version ?? 'unknown',
      env: config.environment ?? process.env['NODE_ENV'] ?? 'development',
      pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
      bindings: (bindings: Record<string, unknown>) => ({
        service: bindings['service'],
        version: bindings['version'],
        env: bindings['env'],
        pid: bindings['pid'],
      }),
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    redact: {
      paths: [
        'password',
        'newPassword',
        'currentPassword',
        'confirmPassword',
        'token',
        'refreshToken',
        'accessToken',
        'secret',
        'apiKey',
        'authorization',
        'cookie',
        '*.password',
        '*.token',
        '*.secret',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  };
  
  if (config.pretty === true) {
    options.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    };
  }
  
  return options;
};

export function createLogger(config: LoggerConfig): Logger {
  return pino(buildPinoOptions(config));
}

export function createChildLogger(
  parent: Logger,
  bindings: Record<string, unknown>,
): Logger {
  return parent.child(bindings);
}

export function createRequestLogger(
  parent: Logger,
  context: Pick<RequestLogContext, 'requestId' | 'userId'>,
): Logger {
  return parent.child({
    requestId: context.requestId,
    userId: context.userId ?? undefined,
  });
}

export function logRequest(logger: Logger, context: RequestLogContext): void {
  logger.info(
    {
      requestId: context.requestId,
      method: context.method,
      url: context.url,
      statusCode: context.statusCode,
      durationMs: context.durationMs,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
    },
    `${context.method} ${context.url} ${context.statusCode?.toString() ?? ''}`.trim(),
  );
}

export function logError(logger: Logger, context: ErrorLogContext): void {
  logger.error(
    {
      err: context.err,
      requestId: context.requestId,
      userId: context.userId,
      context: context.context,
    },
    context.err.message,
  );
}

export function logEvent(logger: Logger, context: EventLogContext): void {
  logger.info(
    {
      event: context.event,
      topic: context.topic,
      messageId: context.messageId,
      durationMs: context.durationMs,
      context: context.context,
    },
    `Event: ${context.event}`,
  );
}

export function logDatabaseQuery(logger: Logger, context: DatabaseLogContext): void {
  if (context.error !== undefined) {
    logger.error(
      { err: context.error, durationMs: context.durationMs },
      'Database query failed',
    );
    return;
  }

  const level: LogLevel = context.durationMs > 1000 ? 'warn' : 'debug';

  logger[level](
    {
      durationMs: context.durationMs,
      rows: context.rows,
      query: context.query,
    },
    `Database query completed in ${context.durationMs}ms`,
  );
}