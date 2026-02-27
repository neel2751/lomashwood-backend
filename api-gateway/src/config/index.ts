import { env, isDevelopment, isProduction, isTest, isStaging } from './env';
import { corsOptions, corsOptionsForUpload, corsOptionsForWebhooks, securityHeaders, cspDirectives } from './cors';
import { servicesConfig, serviceEndpoints, getServiceConfig, buildServiceUrl, config as servicesConfiguration } from './services';
import { logger, stream, logStartup, logShutdown } from './logger';
import {
  globalRateLimiter,
  authRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  apiKeyRateLimiter,
  uploadRateLimiter,
  bookingRateLimiter,
  brochureRateLimiter,
  contactRateLimiter,
  newsletterRateLimiter,
  reviewRateLimiter,
  searchRateLimiter,
  webhookRateLimiter,
  adminRateLimiter,
  createCustomRateLimiter,
  cleanupRateLimitStore,
  disconnectRedis,
} from './rate-limit';

export interface AppConfig {
  env: {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    apiVersion: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
    isStaging: boolean;
  };
  
  server: {
    port: number;
    trustProxy: boolean;
    requestTimeout: number;
    maxRequestBodySize: string;
    maxFileSize: number;
    gracefulShutdownTimeout: number;
  };
  
  cors: {
    origin: string;
    credentials: boolean;
    options: typeof corsOptions;
    uploadOptions: typeof corsOptionsForUpload;
    webhookOptions: typeof corsOptionsForWebhooks;
  };
  
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    sessionSecret: string;
    sessionMaxAge: number;
    sessionSecure: boolean;
    sessionHttpOnly: boolean;
    sessionSameSite: 'strict' | 'lax' | 'none';
    headers: typeof securityHeaders;
    cspDirectives: typeof cspDirectives;
    helmetEnabled: boolean;
  };
  
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessful: boolean;
    skipFailed: boolean;
    limiters: {
      global: typeof globalRateLimiter;
      auth: typeof authRateLimiter;
      register: typeof registerRateLimiter;
      passwordReset: typeof passwordResetRateLimiter;
      apiKey: typeof apiKeyRateLimiter;
      upload: typeof uploadRateLimiter;
      booking: typeof bookingRateLimiter;
      brochure: typeof brochureRateLimiter;
      contact: typeof contactRateLimiter;
      newsletter: typeof newsletterRateLimiter;
      review: typeof reviewRateLimiter;
      search: typeof searchRateLimiter;
      webhook: typeof webhookRateLimiter;
      admin: typeof adminRateLimiter;
      custom: typeof createCustomRateLimiter;
    };
  };
  
  cache: {
    enabled: boolean;
    ttl: number;
    redisUrl?: string;
    redisHost: string;
    redisPort: number;
    redisPassword?: string;
    redisDb: number;
    keyPrefix: string;
  };
  
  logging: {
    level: string;
    format: string;
    fileEnabled: boolean;
    filePath: string;
    logger: typeof logger;
    stream: typeof stream;
  };
  
  services: typeof servicesConfiguration;
  
  features: {
    appointments: boolean;
    brochure: boolean;
    newsletter: boolean;
    reviews: boolean;
    loyalty: boolean;
    showroomBooking: boolean;
    homeMeasurement: boolean;
    onlineConsultation: boolean;
  };
  
  uploads: {
    destination: string;
    allowedTypes: string[];
    maxSize: number;
  };
  
  email: {
    from: string;
    replyTo?: string;
    adminEmail: string;
    supportEmail: string;
  };
  
  frontend: {
    url: string;
    adminPanelUrl?: string;
  };
  
  healthCheck: {
    path: string;
    enabled: boolean;
  };
  
  metrics: {
    path: string;
    enabled: boolean;
  };
  
  swagger: {
    enabled: boolean;
    path: string;
  };
  
  monitoring: {
    sentryDsn?: string;
    sentryEnvironment?: string;
    sentryTracesSampleRate: number;
    newRelicAppName?: string;
    newRelicLicenseKey?: string;
  };
  
  analytics: {
    gtmId?: string;
    gaTrackingId?: string;
  };
  
  maintenance: {
    enabled: boolean;
    message: string;
  };
  
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
  
  localization: {
    defaultCurrency: string;
    defaultLocale: string;
    defaultTimezone: string;
  };
  
  imageOptimization: {
    enabled: boolean;
    quality: number;
    maxWidth: number;
    maxHeight: number;
  };
}

export const config: AppConfig = {
  env: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    apiVersion: env.API_VERSION,
    isDevelopment,
    isProduction,
    isTest,
    isStaging,
  },
  
  server: {
    port: env.PORT,
    trustProxy: env.TRUST_PROXY,
    requestTimeout: env.REQUEST_TIMEOUT_MS,
    maxRequestBodySize: env.MAX_REQUEST_BODY_SIZE,
    maxFileSize: env.MAX_FILE_SIZE,
    gracefulShutdownTimeout: env.GRACEFUL_SHUTDOWN_TIMEOUT,
  },
  
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
    options: corsOptions,
    uploadOptions: corsOptionsForUpload,
    webhookOptions: corsOptionsForWebhooks,
  },
  
  security: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    sessionSecret: env.SESSION_SECRET,
    sessionMaxAge: env.SESSION_MAX_AGE,
    sessionSecure: env.SESSION_SECURE,
    sessionHttpOnly: env.SESSION_HTTP_ONLY,
    sessionSameSite: env.SESSION_SAME_SITE,
    headers: securityHeaders,
    cspDirectives,
    helmetEnabled: env.HELMET_ENABLED,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessful: env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
    skipFailed: env.RATE_LIMIT_SKIP_FAILED_REQUESTS,
    limiters: {
      global: globalRateLimiter,
      auth: authRateLimiter,
      register: registerRateLimiter,
      passwordReset: passwordResetRateLimiter,
      apiKey: apiKeyRateLimiter,
      upload: uploadRateLimiter,
      booking: bookingRateLimiter,
      brochure: brochureRateLimiter,
      contact: contactRateLimiter,
      newsletter: newsletterRateLimiter,
      review: reviewRateLimiter,
      search: searchRateLimiter,
      webhook: webhookRateLimiter,
      admin: adminRateLimiter,
      custom: createCustomRateLimiter,
    },
  },
  
  cache: {
    enabled: env.CACHE_ENABLED,
    ttl: env.CACHE_TTL,
    redisUrl: env.REDIS_URL,
    redisHost: env.REDIS_HOST,
    redisPort: env.REDIS_PORT,
    redisPassword: env.REDIS_PASSWORD,
    redisDb: env.REDIS_DB,
    keyPrefix: env.REDIS_KEY_PREFIX,
  },
  
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
    fileEnabled: env.LOG_FILE_ENABLED,
    filePath: env.LOG_FILE_PATH,
    logger,
    stream,
  },
  
  services: servicesConfiguration,
  
  features: {
    appointments: env.FEATURE_FLAG_APPOINTMENTS,
    brochure: env.FEATURE_FLAG_BROCHURE,
    newsletter: env.FEATURE_FLAG_NEWSLETTER,
    reviews: env.FEATURE_FLAG_REVIEWS,
    loyalty: env.FEATURE_FLAG_LOYALTY,
    showroomBooking: env.SHOWROOM_BOOKING_ENABLED,
    homeMeasurement: env.HOME_MEASUREMENT_ENABLED,
    onlineConsultation: env.ONLINE_CONSULTATION_ENABLED,
  },
  
  uploads: {
    destination: env.FILE_UPLOAD_DEST,
    allowedTypes: env.FILE_UPLOAD_ALLOWED_TYPES.split(','),
    maxSize: env.MAX_FILE_SIZE,
  },
  
  email: {
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
    adminEmail: env.ADMIN_EMAIL,
    supportEmail: env.SUPPORT_EMAIL,
  },
  
  frontend: {
    url: env.FRONTEND_URL,
    adminPanelUrl: env.ADMIN_PANEL_URL,
  },
  
  healthCheck: {
    path: env.HEALTH_CHECK_PATH,
    enabled: true,
  },
  
  metrics: {
    path: env.METRICS_PATH,
    enabled: isProduction,
  },
  
  swagger: {
    enabled: env.SWAGGER_ENABLED,
    path: env.SWAGGER_PATH,
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    sentryEnvironment: env.SENTRY_ENVIRONMENT,
    sentryTracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    newRelicAppName: env.NEW_RELIC_APP_NAME,
    newRelicLicenseKey: env.NEW_RELIC_LICENSE_KEY,
  },
  
  analytics: {
    gtmId: env.GTM_ID,
    gaTrackingId: env.GA_TRACKING_ID,
  },
  
  maintenance: {
    enabled: env.MAINTENANCE_MODE,
    message: env.MAINTENANCE_MESSAGE,
  },
  
  pagination: {
    defaultLimit: env.PAGINATION_DEFAULT_LIMIT,
    maxLimit: env.PAGINATION_MAX_LIMIT,
  },
  
  localization: {
    defaultCurrency: env.DEFAULT_CURRENCY,
    defaultLocale: env.DEFAULT_LOCALE,
    defaultTimezone: env.DEFAULT_TIMEZONE,
  },
  
  imageOptimization: {
    enabled: env.IMAGE_OPTIMIZATION_ENABLED,
    quality: env.IMAGE_QUALITY,
    maxWidth: env.IMAGE_MAX_WIDTH,
    maxHeight: env.IMAGE_MAX_HEIGHT,
  },
};

export const validateConfig = (): void => {
  const requiredFields = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'AUTH_SERVICE_URL',
    'PRODUCT_SERVICE_URL',
    'ORDER_PAYMENT_SERVICE_URL',
    'APPOINTMENT_SERVICE_URL',
    'CONTENT_SERVICE_URL',
    'CUSTOMER_SERVICE_URL',
    'NOTIFICATION_SERVICE_URL',
    'ANALYTICS_SERVICE_URL',
    'ADMIN_EMAIL',
    'SUPPORT_EMAIL',
    'FRONTEND_URL',
  ];

  const missingFields = requiredFields.filter(field => !env[field as keyof typeof env]);

  if (missingFields.length > 0) {
    logger.error('Missing required configuration fields', { missingFields });
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
  }

  logger.info('Configuration validated successfully');
};

export const logConfigSummary = (): void => {
  logger.info('Application configuration', {
    environment: config.env.nodeEnv,
    port: config.server.port,
    apiPrefix: config.env.apiPrefix,
    servicesConfigured: Object.keys(config.services.services).length,
    featuresEnabled: Object.entries(config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature),
    cacheEnabled: config.cache.enabled,
    loggingLevel: config.logging.level,
  });
};

export {
  env,
  isDevelopment,
  isProduction,
  isTest,
  isStaging,
  corsOptions,
  securityHeaders,
  servicesConfig,
  serviceEndpoints,
  getServiceConfig,
  buildServiceUrl,
  logger,
  logStartup,
  logShutdown,
  cleanupRateLimitStore,
  disconnectRedis,
};

export default config;