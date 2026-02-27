import { env } from './env';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LogMeta {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  requestId?: string;
  userId?: string;
  meta?: LogMeta;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[35m',
  verbose: '\x1b[37m',
};

const RESET_COLOR = '\x1b[0m';

function formatPretty(entry: LogEntry): string {
  const color = LEVEL_COLORS[entry.level] ?? RESET_COLOR;
  const level = entry.level.toUpperCase().padEnd(7);
  const timestamp = entry.timestamp;
  const service = `[${entry.service}]`;
  const requestId = entry.requestId ? ` rid=${entry.requestId}` : '';
  const userId = entry.userId ? ` uid=${entry.userId}` : '';

  let output = `${color}${level}${RESET_COLOR} ${timestamp} ${service}${requestId}${userId} ${entry.message}`;

  if (entry.meta && Object.keys(entry.meta).length > 0) {
    output += `\n  meta: ${JSON.stringify(entry.meta, null, 2)}`;
  }

  if (entry.error) {
    output += `\n  error: ${entry.error.message}`;
    if (entry.error.stack) {
      output += `\n  stack: ${entry.error.stack}`;
    }
  }

  return output;
}

function formatJson(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = env.logging.level as LogLevel;
  return LOG_LEVELS[level] <= LOG_LEVELS[configuredLevel];
}

function buildEntry(
  level: LogLevel,
  message: string,
  meta?: LogMeta,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: env.serviceName,
  };

  if (meta) {
    const { requestId, userId, ...rest } = meta as LogMeta & {
      requestId?: string;
      userId?: string;
    };

    if (requestId) entry.requestId = String(requestId);
    if (userId) entry.userId = String(userId);
    if (Object.keys(rest).length > 0) entry.meta = rest;
  }

  if (error) {
    entry.error = {
      message: error.message,
      stack: env.isProduction ? undefined : error.stack,
      code: (error as Error & { code?: string }).code,
    };
  }

  return entry;
}

function write(entry: LogEntry): void {
  const output =
    env.logging.format === 'pretty' ? formatPretty(entry) : formatJson(entry);

  if (entry.level === 'error' || entry.level === 'warn') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  error(message: string, meta?: LogMeta, error?: Error): void {
    if (!shouldLog('error')) return;
    write(buildEntry('error', message, meta, error));
  },

  warn(message: string, meta?: LogMeta): void {
    if (!shouldLog('warn')) return;
    write(buildEntry('warn', message, meta));
  },

  info(message: string, meta?: LogMeta): void {
    if (!shouldLog('info')) return;
    write(buildEntry('info', message, meta));
  },

  debug(message: string, meta?: LogMeta): void {
    if (!shouldLog('debug')) return;
    write(buildEntry('debug', message, meta));
  },

  verbose(message: string, meta?: LogMeta): void {
    if (!shouldLog('verbose')) return;
    write(buildEntry('verbose', message, meta));
  },

  child(defaultMeta: LogMeta): typeof logger {
    return {
      error: (message, meta, error) =>
        logger.error(message, { ...defaultMeta, ...meta }, error),
      warn: (message, meta) =>
        logger.warn(message, { ...defaultMeta, ...meta }),
      info: (message, meta) =>
        logger.info(message, { ...defaultMeta, ...meta }),
      debug: (message, meta) =>
        logger.debug(message, { ...defaultMeta, ...meta }),
      verbose: (message, meta) =>
        logger.verbose(message, { ...defaultMeta, ...meta }),
      child: (meta) => logger.child({ ...defaultMeta, ...meta }),
    };
  },
};

export type Logger = typeof logger;