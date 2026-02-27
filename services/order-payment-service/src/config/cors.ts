import cors, { CorsOptions, CorsOptionsDelegate } from 'cors';
import { Request } from 'express';
import { env } from './env';
import { logger } from './logger';

const ALLOWED_METHODS  = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS  = [
  'Content-Type',
  'Authorization',
  'X-Request-ID',
  'X-Api-Version',
  'X-Idempotency-Key',
];
const EXPOSED_HEADERS  = [
  'X-Request-ID',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
];
const MAX_AGE_SECONDS  = 86_400;

const WEBHOOK_PATHS = [
  '/v1/webhooks/stripe',
  '/v1/webhooks/razorpay',
];

function buildCorsOptions(): CorsOptionsDelegate<Request> {
  const allowedOrigins = env.CORS_ORIGINS;

  return (req: Request, callback) => {
    if (WEBHOOK_PATHS.some((p) => req.path.startsWith(p))) {
      callback(null, { origin: false });
      return;
    }

    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      callback(null, {
        origin:             true,
        methods:            ALLOWED_METHODS,
        allowedHeaders:     ALLOWED_HEADERS,
        exposedHeaders:     EXPOSED_HEADERS,
        credentials:        true,
        maxAge:             MAX_AGE_SECONDS,
        preflightContinue:  false,
        optionsSuccessStatus: 204,
      } satisfies CorsOptions);
      return;
    }

    const origin = req.headers['origin'];

    if (!origin) {
      callback(null, { origin: false });
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, {
        origin:               true,
        methods:              ALLOWED_METHODS,
        allowedHeaders:       ALLOWED_HEADERS,
        exposedHeaders:       EXPOSED_HEADERS,
        credentials:          true,
        maxAge:               MAX_AGE_SECONDS,
        preflightContinue:    false,
        optionsSuccessStatus: 204,
      } satisfies CorsOptions);
      return;
    }

    logger.warn('CORS request from disallowed origin blocked', { origin });
    callback(new Error(`Origin "${origin}" is not allowed by CORS policy`));
  };
}

export const corsMiddleware = cors(buildCorsOptions());