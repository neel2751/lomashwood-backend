import pino, { Logger, LoggerOptions } from 'pino';
import { env } from './env';


const baseOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: {
    service: env.SERVICE_NAME,
    env: env.NODE_ENV,
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'body.token',
      'body.secret',
      '*.AWS_SECRET_ACCESS_KEY',
      '*.INTERNAL_SERVICE_SECRET',
    ],
    censor: '[REDACTED]',
  },
};


const devOptions: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
};

export const logger: Logger =
  env.LOG_PRETTY || env.NODE_ENV === 'development'
    ? pino(devOptions)
    : pino(baseOptions);

/**
 * Create a child logger for a specific module
 * @param module - The module name
 * @returns A logger instance with module context
 * @example
 * const logger = createLogger('my-module');
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}