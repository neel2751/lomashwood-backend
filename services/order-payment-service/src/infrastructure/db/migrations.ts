import { execSync } from 'child_process';
import path from 'path';
import { prisma, checkDatabaseHealth } from './prisma.client';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const PRISMA_SCHEMA_PATH = path.resolve(__dirname, '../../../prisma/schema.prisma');

export type MigrationStatus = {
  migrationName: string;
  appliedAt: Date | null;
  finishedAt: Date | null;
  startedAt: Date | null;
  logs: string;
  checksum: string;
};

export type MigrationResult = {
  success: boolean;
  appliedMigrations: string[];
  error?: string;
};

async function waitForDatabase(
  maxAttempts: number = 10,
  delayMs: number = 2000,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const healthy = await checkDatabaseHealth();

    if (healthy) {
      logger.info('Database is ready', { attempt });
      return;
    }

    if (attempt === maxAttempts) {
      throw new Error(`Database not reachable after ${maxAttempts} attempts`);
    }

    logger.warn('Database not ready, retrying...', { attempt, maxAttempts, delayMs });

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export async function runMigrations(): Promise<MigrationResult> {
  logger.info('Starting database migrations', {
    environment: env.NODE_ENV,
    schemaPath: PRISMA_SCHEMA_PATH,
  });

  try {
    await waitForDatabase();

    const command =
      env.NODE_ENV === 'production'
        ? `npx prisma migrate deploy --schema=${PRISMA_SCHEMA_PATH}`
        : `npx prisma migrate dev --schema=${PRISMA_SCHEMA_PATH} --skip-generate`;

    const output = execSync(command, {
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: env.DATABASE_URL,
      },
    });

    const appliedMigrations = parseAppliedMigrations(output);

    logger.info('Database migrations completed successfully', {
      appliedCount: appliedMigrations.length,
      migrations: appliedMigrations,
    });

    return { success: true, appliedMigrations };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error('Database migration failed', { error: message });

    return { success: false, appliedMigrations: [], error: message };
  }
}

export async function getMigrationStatus(): Promise<MigrationStatus[]> {
  try {
    const rows = await prisma.$queryRaw<MigrationStatus[]>`
      SELECT
        migration_name  AS "migrationName",
        applied_steps_count,
        started_at      AS "startedAt",
        finished_at     AS "finishedAt",
        logs,
        checksum
      FROM _prisma_migrations
      ORDER BY started_at ASC
    `;

    return rows.map((row) => ({
      ...row,
      appliedAt: row.finishedAt,
    }));
  } catch (error) {
    logger.error('Failed to fetch migration status', { error });
    return [];
  }
}

export async function hasPendingMigrations(): Promise<boolean> {
  try {
    const output = execSync(
      `npx prisma migrate status --schema=${PRISMA_SCHEMA_PATH}`,
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          DATABASE_URL: env.DATABASE_URL,
        },
      },
    );

    return output.includes('following migration(s) have not yet been applied');
  } catch {
    return true;
  }
}

export async function validateMigrationIntegrity(): Promise<boolean> {
  try {
    const statuses = await getMigrationStatus();
    const failed = statuses.filter((m) => m.finishedAt === null && m.startedAt !== null);

    if (failed.length > 0) {
      logger.error('Found failed migrations with no finish timestamp', {
        failed: failed.map((m) => m.migrationName),
      });
      return false;
    }

    logger.info('Migration integrity check passed', {
      total: statuses.length,
    });

    return true;
  } catch (error) {
    logger.error('Migration integrity check threw an error', { error });
    return false;
  }
}

export async function runSeed(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    logger.warn('Seed skipped in production environment');
    return;
  }

  try {
    logger.info('Running database seed');

    execSync(`npx ts-node prisma/seed.ts`, {
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: env.DATABASE_URL,
      },
    });

    logger.info('Database seed completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Database seed failed', { error: message });
    throw error;
  }
}

export async function bootstrapDatabase(): Promise<void> {
  const valid = await validateMigrationIntegrity();

  if (!valid) {
    throw new Error('Database migration integrity check failed — resolve failed migrations before starting');
  }

  const result = await runMigrations();

  if (!result.success) {
    throw new Error(`Database migration failed: ${result.error}`);
  }
}

function parseAppliedMigrations(output: string): string[] {
  const lines = output.split('\n');
  const applied: string[] = [];

  for (const line of lines) {
    const match = line.match(/Applying migration `(.+?)`/);
    if (match?.[1]) {
      applied.push(match[1]);
    }
  }

  return applied;
}