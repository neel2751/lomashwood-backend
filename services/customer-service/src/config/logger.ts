import pino, { Logger } from 'pino';
import { env } from './env';

const transport =
  env.LOG_PRETTY || env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }
    : {};

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'customer-service',
    env: env.NODE_ENV,
    version: env.npm_package_version ?? '1.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings(bindings) {
      return { pid: bindings['pid'], host: bindings['hostname'] };
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
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
      'payload.password',
      '*.token',
      '*.secret',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
  ...transport,
});

export function createChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}