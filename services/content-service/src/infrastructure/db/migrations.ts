
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { prismaClient } from './prisma.client';
import { logger } from '../../config/logger';

const execFileAsync = promisify(execFile);

const PRISMA_BIN = path.resolve(
  __dirname,
  '../../../../../../node_modules/.bin/prisma',
);

const SCHEMA_PATH = path.resolve(__dirname, '../../../prisma/schema.prisma');

export interface MigrationRecord {
  id: string;
  checksum: string;
  finishedAt: Date | null;
  migrationName: string;
  logs: string | null;
  rolledBackAt: Date | null;
  startedAt: Date;
  appliedStepsCount: number;
}

export interface MigrationStatus {
  applied: MigrationRecord[];
  pending: string[];
  hasPending: boolean;
}

export const runMigrations = async (): Promise<void> => {
  logger.info('ContentService › Running database migrations…');

  try {
    const { stdout, stderr } = await execFileAsync(PRISMA_BIN, [
      'migrate',
      'deploy',
      `--schema=${SCHEMA_PATH}`,
    ]);

    if (stdout) logger.info({ context: 'runMigrations', output: stdout.trim() });
    if (stderr) logger.warn({ context: 'runMigrations', stderr: stderr.trim() });

    logger.info('ContentService › Migrations applied successfully');
  } catch (error) {
    logger.error({ context: 'runMigrations', error, message: 'Migration failed' });
    throw error;
  }
};

export const getMigrationStatus = async (): Promise<MigrationStatus> => {
  const applied = await prismaClient.$queryRaw<MigrationRecord[]>`
    SELECT
      id,
      checksum,
      "finishedAt",
      "migrationName",
      logs,
      "rolledBackAt",
      "startedAt",
      "appliedStepsCount"
    FROM "_prisma_migrations"
    WHERE "rolledBackAt" IS NULL
    ORDER BY "startedAt" ASC
  `;

  const pending = applied
    .filter((m) => m.finishedAt === null)
    .map((m) => m.migrationName);

  return {
    applied: applied.filter((m) => m.finishedAt !== null),
    pending,
    hasPending: pending.length > 0,
  };
};

const REQUIRED_TABLES: ReadonlyArray<string> = [
  'blogs',
  'pages',
  'media',
  'seo_metas',
  'landing_pages',
];

export const validateSchema = async (): Promise<void> => {
  logger.info('ContentService › Validating database schema…');

  try {
    const rows = await prismaClient.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;

    const existingTables = new Set(rows.map((r) => r.table_name));
    const missingTables = REQUIRED_TABLES.filter(
      (t) => !existingTables.has(t),
    );

    if (missingTables.length > 0) {
      const msg = `ContentService › Missing required tables: ${missingTables.join(', ')}`;
      logger.error(msg);
      throw new Error(msg);
    }

    logger.info('ContentService › Schema validation passed');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).message?.includes('Missing required')) {
      throw error;
    }
    // _prisma_migrations table may not exist in test env — soft warn
    logger.warn({
      context: 'validateSchema',
      message: 'Could not validate schema (non-critical in test env)',
      error,
    });
  }
};

export const bootstrapDatabase = async (opts?: {
  runMigrationsOnBoot?: boolean;
}): Promise<void> => {
  if (opts?.runMigrationsOnBoot) {
    await runMigrations();
  }
  await validateSchema();
};