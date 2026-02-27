import pino, { type Logger } from 'pino';

import { env } from './env';

function createLogger(): Logger {
  const targets: pino.TransportTargetOptions[] = [];

  if (env.NODE_ENV === 'development' || env.LOG_FORMAT === 'pretty') {
    targets.push({
      target: 'pino-pretty',
      level: env.LOG_LEVEL,
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '[{service}] {msg}',
        singleLine: false,
      },
    });
  } else {
    targets.push({
      target: 'pino/file',
      level: env.LOG_LEVEL,
      options: { destination: 1 },
    });
  }

  if (env.LOG_FILE_ENABLED && env.LOG_FILE_PATH) {
    targets.push({
      target: 'pino/file',
      level: env.LOG_LEVEL,
      options: { destination: env.LOG_FILE_PATH, mkdir: true },
    });
  }

  return pino(
    {
      level: env.LOG_LEVEL,
      base: {
        service: env.SERVICE_NAME,
        version: env.SERVICE_VERSION,
        env: env.NODE_ENV,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
          pid: bindings['pid'],
          host: bindings['hostname'],
        }),
      },
      serializers: {
        error: pino.stdSerializers.err,
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
      redact: {
        paths: [
          'password',
          'token',
          'accessToken',
          'refreshToken',
          'secret',
          'apiKey',
          '*.password',
          '*.token',
          '*.secret',
          'req.headers.authorization',
          'req.headers.cookie',
        ],
        censor: '[REDACTED]',
      },
    },
    targets.length === 1
      ? pino.transport(targets[0]!)
      : pino.transport({ targets }),
  );
}

export const logger: Logger = createLogger();