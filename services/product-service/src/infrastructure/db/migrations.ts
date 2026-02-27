import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../../../config/logger';
import { checkDatabaseHealth, prisma } from './prisma.client';

export interface MigrationStatus {
  migrationName: string;
  finishedAt: Date | null;
  appliedStepsCount: number;
  startedAt: Date;
  status: 'applied' | 'pending' | 'failed' | 'rolled_back';
}

export interface MigrationResult {
  success: boolean;
  appliedMigrations: string[];
  errors: string[];
}

const MIGRATIONS_DIR = path.resolve(__dirname, '../../prisma/migrations');
const PRISMA_SCHEMA = path.resolve(__dirname, '../../prisma/schema.prisma');

export async function runMigrations(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    appliedMigrations: [],
    errors: [],
  };

  const isHealthy = await checkDatabaseHealth();
  if (!isHealthy) {
    result.errors.push('Database is not reachable. Migration aborted.');
    logger.error({ message: 'Migration aborted: database unreachable' });
    return result;
  }

  try {
    logger.info({ message: 'Running Prisma migrations' });

    execSync(`npx prisma migrate deploy --schema=${PRISMA_SCHEMA}`, {
      stdio: 'pipe',
      env: { ...process.env },
    });

    result.success = true;
    logger.info({ message: 'Prisma migrations applied successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(message);
    logger.error({ message: 'Migration failed', error: message });
  }

  return result;
}

export async function getMigrationStatus(): Promise<MigrationStatus[]> {
  try {
    const records = await prisma.$queryRaw
      Array<{
        migration_name: string;
        finished_at: Date | null;
        applied_steps_count: number;
        started_at: Date;
        rolled_back_at: Date | null;
        logs: string | null;
      }>
    >`
      SELECT
        migration_name,
        finished_at,
        applied_steps_count,
        started_at,
        rolled_back_at,
        logs
      FROM _prisma_migrations
      ORDER BY started_at DESC
    `;

    return records.map((r) => ({
      migrationName: r.migration_name,
      finishedAt: r.finished_at,
      appliedStepsCount: r.applied_steps_count,
      startedAt: r.started_at,
      status: resolveStatus(r.finished_at, r.rolled_back_at, r.logs),
    }));
  } catch (error) {
    logger.error({ message: 'Failed to fetch migration status', error });
    return [];
  }
}

export async function getPendingMigrations(): Promise<string[]> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const allMigrationDirs = fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const applied = await getMigrationStatus();
  const appliedNames = new Set(applied.map((m) => m.migrationName));

  return allMigrationDirs.filter((name) => !appliedNames.has(name));
}

export async function validateMigrationIntegrity(): Promise<boolean> {
  try {
    const output = execSync(
      `npx prisma migrate status --schema=${PRISMA_SCHEMA}`,
      { stdio: 'pipe', env: { ...process.env } },
    ).toString();

    const hasDrift = output.includes('drift') || output.includes('failed');
    if (hasDrift) {
      logger.warn({ message: 'Migration drift detected', output });
      return false;
    }

    logger.info({ message: 'Migration integrity validated' });
    return true;
  } catch (error) {
    logger.error({ message: 'Migration integrity check failed', error });
    return false;
  }
}

export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }

  try {
    logger.warn({ message: 'Resetting database — all data will be lost' });

    execSync(`npx prisma migrate reset --force --schema=${PRISMA_SCHEMA}`, {
      stdio: 'pipe',
      env: { ...process.env },
    });

    logger.info({ message: 'Database reset complete' });
  } catch (error) {
    logger.error({ message: 'Database reset failed', error });
    throw error;
  }
}

export async function createMigration(name: string): Promise<void> {
  if (!name || !/^[a-z0-9_]+$/.test(name)) {
    throw new Error(
      'Migration name must be lowercase alphanumeric with underscores only',
    );
  }

  try {
    execSync(
      `npx prisma migrate dev --name ${name} --schema=${PRISMA_SCHEMA}`,
      { stdio: 'inherit', env: { ...process.env } },
    );
    logger.info({ message: `Migration created: ${name}` });
  } catch (error) {
    logger.error({ message: 'Migration creation failed', error });
    throw error;
  }
}

export async function applyMigrationBaseline(): Promise<void> {
  try {
    execSync(
      `npx prisma migrate resolve --applied 0001_init --schema=${PRISMA_SCHEMA}`,
      { stdio: 'pipe', env: { ...process.env } },
    );
    logger.info({ message: 'Migration baseline applied' });
  } catch (error) {
    logger.error({ message: 'Baseline migration failed', error });
    throw error;
  }
}

function resolveStatus(
  finishedAt: Date | null,
  rolledBackAt: Date | null,
  logs: string | null,
): MigrationStatus['status'] {
  if (rolledBackAt) return 'rolled_back';
  if (logs && logs.includes('error')) return 'failed';
  if (finishedAt) return 'applied';
  return 'pending';
}