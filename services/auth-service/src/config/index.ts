
export interface EnvConfig {
  nodeEnv: 'development' | 'staging' | 'production' | 'test';
  serviceName: string;
  serviceVersion: string;
  port: number;
}

export const envConfig: EnvConfig = {
  nodeEnv: (process.env['NODE_ENV'] as EnvConfig['nodeEnv']) || 'development',
  serviceName: process.env['SERVICE_NAME'] || 'auth-service',
  serviceVersion: process.env['SERVICE_VERSION'] || '1.0.0',
  port: Number(process.env['PORT'] || 3001),
};

export interface LoggerConfig {
  level: string;
  format: string;
  prettyPrint: boolean;
}

export const loggerConfig: LoggerConfig = {
  level: process.env['LOG_LEVEL'] || 'info',
  format: process.env['LOG_FORMAT'] || 'pretty',
  prettyPrint: process.env['LOG_FORMAT'] !== 'json',
};

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

export const corsConfig: CorsConfig = {
  origin: process.env['CORS_ALLOWED_ORIGINS']?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  credentials: process.env['CORS_CREDENTIALS'] !== 'false',
  methods: process.env['CORS_ALLOWED_METHODS']?.split(',').map(s => s.trim()) || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: process.env['CORS_ALLOWED_HEADERS']?.split(',').map(s => s.trim()) || ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: process.env['CORS_EXPOSED_HEADERS']?.split(',').map(s => s.trim()) || ['X-Request-ID'],
  maxAge: Number(process.env['CORS_MAX_AGE'] || 86400),
};

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export const rateLimitConfig: RateLimitConfig = {
  windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS'] || 900000),
  maxRequests: Number(process.env['RATE_LIMIT_MAX_REQUESTS'] || 100),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export interface DatabaseConfig {
  url: string;               
  poolSize: number;          
  connectionTimeout: number; 
  ssl: boolean;              
  connectionLimit: number;
  poolTimeout: number;
  logQueries: boolean;
}

export const databaseConfig: DatabaseConfig = {
  url: process.env['DATABASE_URL'] || '',
  poolSize: Number(process.env['DATABASE_CONNECTION_LIMIT'] || 10),
  connectionTimeout: Number(process.env['DATABASE_POOL_TIMEOUT'] || 20),
  ssl: process.env['DATABASE_SSL'] === 'true',
  connectionLimit: Number(process.env['DATABASE_CONNECTION_LIMIT'] || 10),
  poolTimeout: Number(process.env['DATABASE_POOL_TIMEOUT'] || 20),
  logQueries: process.env['DATABASE_LOG_QUERIES'] === 'true',
};

export interface RedisConfig {
  enabled: boolean;   
  host: string;       
  port: number;      
  url: string;
  password: string;
  db: number;        
  keyPrefix: string;
  ttl: number;        
  defaultTtl: number;
  maxConnections: number;
}

export const redisConfig: RedisConfig = {
  enabled: process.env['REDIS_URL'] !== '',
  host: process.env['REDIS_HOST'] || 'localhost',
  port: Number(process.env['REDIS_PORT'] || 6379),
  url: process.env['REDIS_URL'] || 'redis://localhost:6379/0',
  password: process.env['REDIS_PASSWORD'] || '',
  db: Number(process.env['REDIS_DB'] || 0),
  keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'lomash:auth:',
  ttl: Number(process.env['REDIS_DEFAULT_TTL'] || 3600),
  defaultTtl: Number(process.env['REDIS_DEFAULT_TTL'] || 3600),
  maxConnections: Number(process.env['REDIS_MAX_CONNECTIONS'] || 10),
};

export interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  sessionExpiry: number;
  bcryptRounds: number;
  otpExpiry: number;
  passwordResetExpiry: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export const authConfig: AuthConfig = {
  jwtSecret: process.env['JWT_ACCESS_SECRET'] || '',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] || '',
  accessTokenExpiry: process.env['JWT_ACCESS_EXPIRY'] || '15m',
  refreshTokenExpiry: process.env['JWT_REFRESH_EXPIRY'] || '7d',
  sessionExpiry: Number(process.env['BETTER_AUTH_SESSION_EXPIRY'] || 604800),
  bcryptRounds: Number(process.env['BCRYPT_SALT_ROUNDS'] || 12),
  otpExpiry: Number(process.env['EMAIL_OTP_EXPIRY'] || 600),
  passwordResetExpiry: process.env['JWT_RESET_EXPIRY'] || '1h',
  maxLoginAttempts: Number(process.env['MAX_LOGIN_ATTEMPTS'] || 5),
  lockoutDuration: Number(process.env['LOCKOUT_DURATION_MS'] || 900000),
};


export interface AppConfig {
  env: EnvConfig;
  logger: LoggerConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  auth: AuthConfig;
}

const appConfig: AppConfig = {
  env: envConfig,
  logger: loggerConfig,
  cors: corsConfig,
  rateLimit: rateLimitConfig,
  database: databaseConfig,
  redis: redisConfig,
  auth: authConfig,
};

export const config = Object.freeze(appConfig);
export default config;


export const validateConfig = (): void => {
  const requiredConfigs = [
    { name: 'Environment', config: envConfig },
    { name: 'Logger', config: loggerConfig },
    { name: 'CORS', config: corsConfig },
    { name: 'Rate Limit', config: rateLimitConfig },
    { name: 'Database', config: databaseConfig },
    { name: 'Redis', config: redisConfig },
    { name: 'Auth', config: authConfig },
  ];

  for (const { name, config: cfg } of requiredConfigs) {
    if (!cfg) {
      throw new Error(`${name} configuration is not properly loaded`);
    }
  }
};

export const getConfig = (): Readonly<AppConfig> => config;

export const isDevelopment = (): boolean => envConfig.nodeEnv === 'development';
export const isProduction  = (): boolean => envConfig.nodeEnv === 'production';
export const isTest        = (): boolean => envConfig.nodeEnv === 'test';

export const getServiceInfo = () => ({
  name: envConfig.serviceName,
  version: envConfig.serviceVersion,
  environment: envConfig.nodeEnv,
  port: envConfig.port,
});

export const getHealthCheckConfig = () => ({
  database: {
    enabled: true,
    url: databaseConfig.url,          
  },
  redis: {
    enabled: redisConfig.enabled,     
    host: redisConfig.host,           
    port: redisConfig.port,            
  },
});

export const getSecurityConfig = () => ({
  cors: corsConfig,
  rateLimit: rateLimitConfig,
  auth: {
    accessTokenExpiry: authConfig.accessTokenExpiry,
    refreshTokenExpiry: authConfig.refreshTokenExpiry,
    sessionExpiry: authConfig.sessionExpiry,
  },
});

export const getDatabaseConnectionConfig = () => ({
  url: databaseConfig.url,                        
  poolSize: databaseConfig.poolSize,             
  connectionTimeout: databaseConfig.connectionTimeout, 
  ssl: databaseConfig.ssl,                        
});

export const getRedisConnectionConfig = () => {
  if (!redisConfig.enabled) return null;          

  return {
    host: redisConfig.host,                       
    port: redisConfig.port,                        
    password: redisConfig.password,
    db: redisConfig.db,                            
    keyPrefix: redisConfig.keyPrefix,
    ttl: redisConfig.ttl,                          
  };
};

export const getLoggerConfiguration = () => ({
  level: loggerConfig.level,
  format: loggerConfig.format,
  prettyPrint: loggerConfig.prettyPrint,
  serviceName: envConfig.serviceName,
  environment: envConfig.nodeEnv,
});

export const getAuthConfiguration = () => ({
  jwtSecret: authConfig.jwtSecret,
  jwtRefreshSecret: authConfig.jwtRefreshSecret,
  accessTokenExpiry: authConfig.accessTokenExpiry,
  refreshTokenExpiry: authConfig.refreshTokenExpiry,
  sessionExpiry: authConfig.sessionExpiry,
  bcryptRounds: authConfig.bcryptRounds,
  otpExpiry: authConfig.otpExpiry,
  passwordResetExpiry: authConfig.passwordResetExpiry,
  maxLoginAttempts: authConfig.maxLoginAttempts,
  lockoutDuration: authConfig.lockoutDuration,
});

export const getCorsConfiguration = () => ({
  origin: corsConfig.origin,
  credentials: corsConfig.credentials,
  methods: corsConfig.methods,
  allowedHeaders: corsConfig.allowedHeaders,
  exposedHeaders: corsConfig.exposedHeaders,
  maxAge: corsConfig.maxAge,
});

export const getRateLimitConfiguration = () => ({
  windowMs: rateLimitConfig.windowMs,
  maxRequests: rateLimitConfig.maxRequests,
  message: rateLimitConfig.message,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
  skipSuccessfulRequests: rateLimitConfig.skipSuccessfulRequests,
  skipFailedRequests: rateLimitConfig.skipFailedRequests,
});

export const printConfig = (): void => {
  if (!isDevelopment()) return;

  console.log('='.repeat(60));
  console.log('Service Configuration');
  console.log('='.repeat(60));
  console.log(`Service Name:    ${envConfig.serviceName}`);
  console.log(`Service Version: ${envConfig.serviceVersion}`);
  console.log(`Environment:     ${envConfig.nodeEnv}`);
  console.log(`Port:            ${envConfig.port}`);
  console.log(`Log Level:       ${loggerConfig.level}`);
  console.log(`Database:        ${databaseConfig.url.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Redis Enabled:   ${redisConfig.enabled}`);
  if (redisConfig.enabled) {
    console.log(`Redis Host:      ${redisConfig.host}:${redisConfig.port}`);
  }
  console.log(`CORS Origins:    ${Array.isArray(corsConfig.origin) ? corsConfig.origin.join(', ') : corsConfig.origin}`);
  console.log(`Rate Limit:      ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.windowMs}ms`);
  console.log('='.repeat(60));
};