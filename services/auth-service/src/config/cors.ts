import { type CorsOptions } from 'cors';

import { env } from '@config/env';

export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    if (origin === undefined) {
      callback(null, true);
      return;
    }

    if (env.CORS_ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" is not allowed.`));
    }
  },
  methods:            env.CORS_ALLOWED_METHODS,
  allowedHeaders:     env.CORS_ALLOWED_HEADERS,
  exposedHeaders:     env.CORS_EXPOSED_HEADERS,
  credentials:        env.CORS_CREDENTIALS,
  maxAge:             env.CORS_MAX_AGE,
  optionsSuccessStatus: 204,
};