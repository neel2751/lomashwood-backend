import cors, { CorsOptions } from 'cors';
import { env } from './env';
import { logger } from './logger';



const ALLOWED_ORIGINS: Set<string> = new Set(env.CORS_ORIGINS);



export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    
    if (!origin) {
      if (env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }
      
      callback(new Error('CORS: Origin header is required in production'), false);
      return;
    }

    if (ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
      return;
    }

    logger.warn({ origin }, '[CORS] Rejected request from disallowed origin');
    callback(new Error(`CORS: Origin '${origin}' is not allowed`), false);
  },

  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-User-Payload',
    'X-Internal-Secret',
    'Accept',
    'Accept-Language',
  ],

  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Content-Disposition',
  ],

  credentials: true,

  
  maxAge: 600,

  
  preflightContinue: false,
  optionsSuccessStatus: 204,
};



export const corsMiddleware = cors(corsOptions);


export const corsConfig = corsOptions;

export const adminCorsMiddleware = cors({
  ...corsOptions,
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    const adminOrigins = env.CORS_ORIGINS.filter((o) =>
      o.includes('admin') || o.includes('cms'),
    );

    if (!origin || !adminOrigins.includes(origin)) {
      logger.warn({ origin }, '[CORS] Admin route rejected non-admin origin');
      callback(new Error('CORS: Admin access denied'), false);
      return;
    }

    callback(null, true);
  },
});