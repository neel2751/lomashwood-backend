import { Request, Response, NextFunction } from 'express';
import { env } from './env';

export interface CorsOptions {
  origins: string[];
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export const corsOptions: CorsOptions = {
  origins: env.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Api-Key',
    'Accept',
    'Origin',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-Total-Pages',
  ],
  credentials: true,
  maxAge: 86400,
};

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) return true;

  for (const allowed of allowedOrigins) {
    if (allowed === origin) return true;

    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      if (origin.endsWith(`.${domain}`) || origin === domain) return true;
    }
  }

  return false;
}

export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const origin = req.headers.origin as string;
  const { origins, methods, allowedHeaders, exposedHeaders, credentials, maxAge } = corsOptions;

  if (origin && isOriginAllowed(origin, origins)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', origins[0] ?? '*');
  }

  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
  res.setHeader('Access-Control-Allow-Credentials', String(credentials));
  res.setHeader('Access-Control-Max-Age', String(maxAge));
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

export function buildCorsConfig(): {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
} {
  return {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin, corsOptions.origins)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    exposedHeaders: corsOptions.exposedHeaders,
    credentials: corsOptions.credentials,
    maxAge: corsOptions.maxAge,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}