import { env } from './env';

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  connectionTimeout: number;
  queryTimeout: number;
  logQueries: boolean;
}

export const databaseConfig: DatabaseConfig = {
  url: env.DATABASE_URL,
  poolMin: env.NODE_ENV === 'production' ? 5 : 2,
  poolMax: env.NODE_ENV === 'production' ? 20 : 5,
  connectionTimeout: 10000,
  queryTimeout: 30000,
  logQueries: env.NODE_ENV !== 'production' && env.LOG_LEVEL === 'debug',
};

export function getDatabaseUrl(): string {
  return env.DATABASE_URL;
}

export function isProductionDatabase(): boolean {
  return env.NODE_ENV === 'production';
}