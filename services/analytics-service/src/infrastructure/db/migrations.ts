import { execSync } from 'child_process';

import { logger } from '../../config/logger';
import { env } from '../../config/env';

export async function runMigrations(): Promise<void> {
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
    logger.info('Running Prisma migrations...');

    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
      });

      logger.info('Prisma migrations completed successfully');
    } catch (error) {
      logger.error({ error }, 'Prisma migration failed');
      throw error;
    }
  } else {
    logger.info('Skipping auto-migrations in non-production environment');
  }
}

export async function checkMigrationStatus(): Promise<boolean> {
  try {
    const result = execSync('npx prisma migrate status', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
    });

    const output = result.toString();
    const isUpToDate = output.includes('Database schema is up to date');

    logger.info({ isUpToDate }, 'Migration status checked');

    return isUpToDate;
  } catch {
    logger.warn('Could not determine migration status');
    return false;
  }
}