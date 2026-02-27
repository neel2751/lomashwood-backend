import { env } from './env';

export const corsConfig = {
  origins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86_400,
} as const;