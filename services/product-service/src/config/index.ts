import { env, isDevelopment, isProduction, isStaging, isTest } from './env';
import { logger } from './logger';
import { corsOptions } from './cors';
import { databaseConfig } from './database';
import { redisConfig } from './redis';
import { messagingConfig } from './messaging';
import { setupProcessHandlers } from './handlers';
import {
  globalRateLimitConfig,
  authRateLimitConfig,
  apiRateLimitConfig,
} from './rate-limit';

export interface ServiceConfig {
  name: string;
  version: string;
  environment: string;
  port: number;
  host: string;
  debug: boolean;
  features: {
    analyticsEnabled: boolean;
    imageOptimization: boolean;
    bulkOperations: boolean;
    elasticSearch: boolean;
    cacheEnabled: boolean;
    messagingEnabled: boolean;
  };
  limits: {
    uploadMaxSize: number;
    paginationDefaultLimit: number;
    paginationMaxLimit: number;
    requestTimeout: number;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    productsTTL: number;
    categoriesTTL: number;
    coloursTTL: number;
  };
  business: {
    currency: string;
    timezone: string;
    locale: string;
    lowStockThreshold: number;
    priceChangeNotificationThreshold: number;
  };
}

export const config: ServiceConfig = {
  name: 'product-service',
  version: process.env.npm_package_version || '1.0.0',
  environment: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  debug: env.DEBUG,
  features: {
    analyticsEnabled: env.FEATURE_FLAG_ANALYTICS,
    imageOptimization: env.FEATURE_FLAG_IMAGE_OPTIMIZATION,
    bulkOperations: env.FEATURE_FLAG_BULK_OPERATIONS,
    elasticSearch: env.FEATURE_FLAG_ELASTIC_SEARCH,
    cacheEnabled: env.CACHE_ENABLED,
    messagingEnabled: messagingConfig.enabled,
  },
  limits: {
    uploadMaxSize: env.UPLOAD_MAX_FILE_SIZE,
    paginationDefaultLimit: env.PAGINATION_DEFAULT_LIMIT,
    paginationMaxLimit: env.PAGINATION_MAX_LIMIT,
    requestTimeout: env.REQUEST_TIMEOUT,
  },
  cache: {
    enabled: env.CACHE_ENABLED,
    defaultTTL: env.CACHE_DEFAULT_TTL,
    productsTTL: env.CACHE_PRODUCTS_TTL,
    categoriesTTL: env.CACHE_CATEGORIES_TTL,
    coloursTTL: env.CACHE_COLOURS_TTL,
  },
  business: {
    currency: env.CURRENCY,
    timezone: env.TIMEZONE,
    locale: env.LOCALE,
    lowStockThreshold: env.LOW_STOCK_THRESHOLD,
    priceChangeNotificationThreshold: env.PRICE_CHANGE_NOTIFICATION_THRESHOLD,
  },
};

export function validateConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!config.name) {
    errors.push('Service name is not configured');
  }

  if (!config.version) {
    warnings.push('Service version is not set');
  }

  if (config.port < 1024 || config.port > 65535) {
    errors.push('Port must be between 1024 and 65535');
  }

  if (isProduction() && config.debug) {
    warnings.push('Debug mode is enabled in production');
  }

  if (config.limits.uploadMaxSize > 50 * 1024 * 1024) {
    warnings.push('Upload max size is very large (>50MB)');
  }

  if (config.limits.paginationMaxLimit > 1000) {
    warnings.push('Pagination max limit is very high (>1000)');
  }

  if (config.limits.requestTimeout < 5000) {
    warnings.push('Request timeout is very low (<5s)');
  }

  if (config.business.lowStockThreshold < 1) {
    warnings.push('Low stock threshold should be at least 1');
  }

  if (!config.features.cacheEnabled && isProduction()) {
    warnings.push('Cache is disabled in production');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function initializeConfiguration(): void {
  setupProcessHandlers();

  const validation = validateConfiguration();

  logger.info('Configuration initialized', {
    service: config.name,
    version: config.version,
    environment: config.environment,
    port: config.port,
    debug: config.debug,
  });

  if (validation.warnings.length > 0) {
    logger.warn('Configuration warnings', { warnings: validation.warnings });
  }

  if (validation.errors.length > 0) {
    logger.error('Configuration errors', { errors: validation.errors });
    throw new Error('Invalid configuration');
  }

  if (isDevelopment()) {
    printConfigurationSummary();
  }
}

export function printConfigurationSummary(): void {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         PRODUCT SERVICE CONFIGURATION                 ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Service:      ${config.name.padEnd(38)} ║`);
  console.log(`║  Version:      ${config.version.padEnd(38)} ║`);
  console.log(`║  Environment:  ${config.environment.padEnd(38)} ║`);
  console.log(`║  Port:         ${config.port.toString().padEnd(38)} ║`);
  console.log(`║  Host:         ${config.host.padEnd(38)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Database:     ${(databaseConfig.url.split('@')[1]?.split('/')[0] || 'configured').padEnd(38)} ║`);
  console.log(`║  Redis:        ${`${redisConfig.host}:${redisConfig.port}`.padEnd(38)} ║`);
  console.log(`║  Messaging:    ${(messagingConfig.enabled ? 'Enabled' : 'Disabled').padEnd(38)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Cache:        ${(config.cache.enabled ? 'Enabled' : 'Disabled').padEnd(38)} ║`);
  console.log(`║  Analytics:    ${(config.features.analyticsEnabled ? 'Enabled' : 'Disabled').padEnd(38)} ║`);
  console.log(`║  Debug:        ${(config.debug ? 'Enabled' : 'Disabled').padEnd(38)} ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

export function getConfigurationSnapshot(): Record<string, any> {
  return {
    service: {
      name: config.name,
      version: config.version,
      environment: config.environment,
      port: config.port,
      host: config.host,
    },
    features: { ...config.features },
    limits: { ...config.limits },
    cache: { ...config.cache },
    business: { ...config.business },
    database: {
      poolMin: databaseConfig.poolMin,
      poolMax: databaseConfig.poolMax,
      connectionTimeout: databaseConfig.connectionTimeout,
    },
    redis: {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
    },
    messaging: {
      enabled: messagingConfig.enabled,
      provider: messagingConfig.provider,
      brokerCount: messagingConfig.brokers.length,
    },
    rateLimit: {
      global: {
        windowMs: globalRateLimitConfig.windowMs,
        max: globalRateLimitConfig.max,
      },
      auth: {
        windowMs: authRateLimitConfig.windowMs,
        max: authRateLimitConfig.max,
      },
      api: {
        windowMs: apiRateLimitConfig.windowMs,
        max: apiRateLimitConfig.max,
      },
    },
  };
}

export function isFeatureEnabled(feature: keyof ServiceConfig['features']): boolean {
  return config.features[feature] || false;
}

export function getServiceInfo(): {
  name: string;
  version: string;
  environment: string;
  uptime: number;
} {
  return {
    name: config.name,
    version: config.version,
    environment: config.environment,
    uptime: process.uptime(),
  };
}

export * from './env';
export * from './logger';
export * from './cors';
export * from './database';
export * from './redis';
export * from './messaging';
export * from './rate-limit';
export * from './handlers';
export * from './subscriptions';

export {
  config,
  corsOptions,
  databaseConfig,
  redisConfig,
  messagingConfig,
  globalRateLimitConfig,
  authRateLimitConfig,
  apiRateLimitConfig,
};

initializeConfiguration();