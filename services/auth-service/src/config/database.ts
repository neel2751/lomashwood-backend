


type LogLevel = 'query' | 'info' | 'warn' | 'error';
type LogEmit = 'stdout' | 'event';

interface LogDefinition {
  level: LogLevel;
  emit: LogEmit;
}

interface PrismaClientOptions {
  log?: LogDefinition[];
  errorFormat?: 'pretty' | 'colorless' | 'minimal';
}



const env = {
  DATABASE_URL: process.env['DATABASE_URL'] ?? '',
  DATABASE_LOG_QUERIES: process.env['DATABASE_LOG_QUERIES'] === 'true',
  DATABASE_CONNECTION_LIMIT: Number(process.env['DATABASE_CONNECTION_LIMIT'] ?? 10),
  DATABASE_POOL_TIMEOUT: Number(process.env['DATABASE_POOL_TIMEOUT'] ?? 30),
};

const isDevelopment = process.env['NODE_ENV'] === 'development';



export const prismaClientOptions: PrismaClientOptions = {
  log: isDevelopment && env.DATABASE_LOG_QUERIES
    ? [
        { level: 'query', emit: 'event' },
        { level: 'info',  emit: 'stdout' },
        { level: 'warn',  emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ]
    : [
        { level: 'warn',  emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ],
  errorFormat: isDevelopment ? 'pretty' : 'minimal',
};

export const databaseConfig = {
  connectionLimit: env.DATABASE_CONNECTION_LIMIT,
  poolTimeout:     env.DATABASE_POOL_TIMEOUT,
  logQueries:      env.DATABASE_LOG_QUERIES,
} as const;