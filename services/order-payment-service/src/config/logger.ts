import pino, { Logger, LoggerOptions } from 'pino';
import { env } from './env';

const SERVICE_NAME = 'order-payment-service';

function buildLoggerOptions(): LoggerOptions {
  const base: LoggerOptions = {
    level: env.LOG_LEVEL,
    base: {
      service: SERVICE_NAME,
      version: env.APP_VERSION,
      env:     env.NODE_ENV,
      pid:     process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return {
          pid:     bindings['pid'],
          host:    bindings['hostname'],
          service: SERVICE_NAME,
        };
      },
    },
    serializers: {
      err:   pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req:   pino.stdSerializers.req,
      res:   pino.stdSerializers.res,
    },
    redact: {
      paths: [
        'password',
        'passwordHash',
        'secret',
        'token',
        'accessToken',
        'refreshToken',
        'authorization',
        'cookie',
        'stripe_secret_key',
        'razorpay_key_secret',
        '*.password',
        '*.secret',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  };

  if (env.LOG_PRETTY) {
    return {
      ...base,
      transport: {
        target:  'pino-pretty',
        options: {
          colorize:        true,
          translateTime:   'SYS:standard',
          ignore:          'pid,hostname',
          messageFormat:   '{service} — {msg}',
          singleLine:      false,
          levelFirst:      true,
        },
      },
    };
  }

  return base;
}

export const logger: Logger = pino(buildLoggerOptions());

export function createChildLogger(
  bindings: Record<string, unknown>,
): Logger {
  return logger.child(bindings);
}

export function createRequestLogger(
  requestId: string,
  userId?: string,
): Logger {
  return logger.child({
    requestId,
    ...(userId ? { userId } : {}),
  });
}

export function createJobLogger(jobName: string): Logger {
  return logger.child({ job: jobName });
}

export function createServiceLogger(serviceName: string): Logger {
  return logger.child({ context: serviceName });
}