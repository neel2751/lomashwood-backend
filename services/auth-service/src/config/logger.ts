

interface LoggerOptions {
  level?: string;
  base?: Record<string, unknown> | null;
  timestamp?: (() => string) | boolean;
  redact?: {
    paths: string[];
    censor?: string | ((value: unknown) => unknown);
  };
  transport?: {
    target: string;
    options?: Record<string, unknown>;
  };
}

export interface Logger {
  fatal:  (obj: Record<string, unknown> | string, msg?: string) => void;
  error:  (obj: Record<string, unknown> | string, msg?: string) => void;
  warn:   (obj: Record<string, unknown> | string, msg?: string) => void;
  info:   (obj: Record<string, unknown> | string, msg?: string) => void;
  debug:  (obj: Record<string, unknown> | string, msg?: string) => void;
  trace:  (obj: Record<string, unknown> | string, msg?: string) => void;
  child:  (bindings: Record<string, unknown>) => Logger;
  level:  string;
}

const stdTimeFunctions = {
  isoTime: () => `,"time":"${new Date().toISOString()}"`,
};

function pino(options: LoggerOptions): Logger {
  const level = options.level ?? 'info';

  const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
  const levelIndex = levels.indexOf(level);

  const log = (lvl: string, obj: Record<string, unknown> | string, msg?: string): void => {
    if (levels.indexOf(lvl) > levelIndex) return;
    const message = typeof obj === 'string' ? obj : (msg ?? '');
    const meta    = typeof obj === 'object' ? obj : {};
    console.log(JSON.stringify({ level: lvl, time: new Date().toISOString(), ...options.base, ...meta, msg: message }));
  };

  const instance: Logger = {
    level,
    fatal: (o, m) => log('fatal', o, m),
    error: (o, m) => log('error', o, m),
    warn:  (o, m) => log('warn',  o, m),
    info:  (o, m) => log('info',  o, m),
    debug: (o, m) => log('debug', o, m),
    trace: (o, m) => log('trace', o, m),
    child: (bindings) => pino({ ...options, base: { ...(options.base ?? {}), ...bindings } }),
  };

  return instance;
}

pino.stdTimeFunctions = stdTimeFunctions;

const env = {
  LOG_LEVEL:    process.env['LOG_LEVEL']    ?? 'info',
  LOG_FORMAT:   process.env['LOG_FORMAT']   ?? 'pretty',
  SERVICE_NAME: process.env['SERVICE_NAME'] ?? 'auth-service',
  NODE_ENV:     process.env['NODE_ENV']     ?? 'development',
};

const isDevelopment = env.NODE_ENV === 'development';


const baseConfig: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: {
    service: env.SERVICE_NAME,
    env:     env.NODE_ENV,
    pid:     process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.body.password',
      'req.body.passwordHash',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.confirmPassword',
      'req.body.token',
      'req.body.secret',
      'res.headers["set-cookie"]',
      '*.passwordHash',
      '*.secret',
      '*.tokenHash',
      '*.codeHash',
    ],
    censor: '[REDACTED]',
  },
};

const prettyConfig: LoggerOptions = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize:      true,
      levelFirst:    true,
      translateTime: 'SYS:HH:MM:ss.l',
      messageFormat: '[{service}] {msg}',
      ignore:        'pid,hostname,service,env',
      singleLine:    false,
    },
  },
};

export const logger: Logger = isDevelopment && env.LOG_FORMAT === 'pretty'
  ? pino(prettyConfig)
  : pino(baseConfig);

export function createChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.child({
    requestId,
    ...(userId !== undefined ? { userId } : {}),
  });
}