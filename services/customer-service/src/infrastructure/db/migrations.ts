import { execSync } from 'child_process';
import path from 'path';
import { logger } from '../../config/logger';

export type MigrationStatus = {
  applied: string[];
  pending: string[];
};

export async function runMigrations(): Promise<void> {
  try {
    logger.info('Running database migrations...');

    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(process.cwd()),
      stdio: 'pipe',
      env: {
        ...process.env,
      },
    });

    logger.info('Database migrations completed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Database migration failed');
    throw new Error(`Migration failed: ${message}`);
  }
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  try {
    const output = execSync('npx prisma migrate status', {
      cwd: path.resolve(process.cwd()),
      stdio: 'pipe',
      env: { ...process.env },
    }).toString();

    const applied: string[] = [];
    const pending: string[] = [];

    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('✔') || trimmed.includes('Applied')) {
        applied.push(trimmed);
      } else if (trimmed.startsWith('✖') || trimmed.includes('Not applied') || trimmed.includes('Pending')) {
        pending.push(trimmed);
      }
    }

    return { applied, pending };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Failed to get migration status');
    throw new Error(`Migration status check failed: ${message}`);
  }
}

export async function resetDatabase(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Database reset is not allowed in production');
  }

  try {
    logger.warn('Resetting database...');

    execSync('npx prisma migrate reset --force', {
      cwd: path.resolve(process.cwd()),
      stdio: 'pipe',
      env: { ...process.env },
    });

    logger.info('Database reset completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Database reset failed');
    throw new Error(`Database reset failed: ${message}`);
  }
}

export async function generatePrismaClient(): Promise<void> {
  try {
    logger.info('Generating Prisma client...');

    execSync('npx prisma generate', {
      cwd: path.resolve(process.cwd()),
      stdio: 'pipe',
      env: { ...process.env },
    });

    logger.info('Prisma client generated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Prisma client generation failed');
    throw new Error(`Prisma generate failed: ${message}`);
  }
}