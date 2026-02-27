import { CorsOptions } from 'cors';
import { env } from './env';

function parseAllowedOrigins(): string[] {
  if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.trim() === '') return [];
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
}

export const corsConfig: CorsOptions = {
  origin(requestOrigin, callback) {
    const allowedOrigins = parseAllowedOrigins();

    if (env.NODE_ENV === 'development' || allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }

    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${requestOrigin}' is not permitted`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Correlation-ID',
    'X-Api-Key',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};