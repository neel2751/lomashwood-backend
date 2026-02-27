import * as fs   from 'fs';
import * as path from 'path';
import { z }     from 'zod';
import dotenv    from 'dotenv';

const envFiles = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
    break;
  }
}

const configSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  MIGRATION_TABLE:        z.string().default('_prisma_migrations'),
  MIGRATION_LOCK_TIMEOUT: z.coerce.number().int().positive().default(30000),
  MIGRATION_TIMEOUT:      z.coerce.number().int().positive().default(120000),

  SHADOW_DATABASE_URL: z.string().url().optional(),

  BACKUP_BEFORE_MIGRATE: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('false'),

  DRY_RUN: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('false'),

  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  PRISMA_SCHEMA_PATH: z
    .string()
    .default(path.resolve(process.cwd(), 'prisma/schema.prisma')),

  MIGRATION_OUTPUT_DIR: z
    .string()
    .default(path.resolve(process.cwd(), 'prisma/migrations')),

  ALERT_WEBHOOK_URL: z.string().url().optional(),
});

function parseConfig() {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    process.stderr.write(
      `[db-migration-tool] Configuration validation failed:\n${issues}\n`,
    );
    process.exit(1);
  }

  return result.data;
}

export const config = parseConfig();

export type Config = typeof config;

export const MIGRATION_STATES = {
  PENDING:         'pending',
  APPLIED:         'applied',
  FAILED:          'failed',
  ROLLED_BACK:     'rolled_back',
  NOT_IN_DATABASE: 'not_in_database',
} as const;

export type MigrationState = (typeof MIGRATION_STATES)[keyof typeof MIGRATION_STATES];

export interface IMigrationRecord {
  id:                  string;
  checksum:            string;
  finishedAt:          Date | null;
  migrationName:       string;
  logs:                string | null;
  rolledBackAt:        Date | null;
  startedAt:           Date;
  appliedStepsCount:   number;
}

export interface IMigrationFile {
  name:          string;
  path:          string;
  sqlPath:       string;
  appliedAt:     Date | null;
  state:         MigrationState;
  checksum:      string | null;
}

export interface IMigrationStatus {
  totalFiles:       number;
  applied:          number;
  pending:          number;
  failed:           number;
  rolledBack:       number;
  databaseUrl:      string;
  schemaPath:       string;
  migrations:       IMigrationFile[];
  hasDrift:         boolean;
  isProductionSafe: boolean;
}

export interface IMigrateOptions {
  dryRun?:         boolean;
  steps?:          number;
  name?:           string;
  forceReset?:     boolean;
  skipConfirm?:    boolean;
  createOnly?:     boolean;
}

export interface IRollbackOptions {
  steps?:       number;
  name?:        string;
  dryRun?:      boolean;
  force?:       boolean;
  skipConfirm?: boolean;
}

export interface IMigrateResult {
  appliedCount:  number;
  failedCount:   number;
  skippedCount:  number;
  durationMs:    number;
  migrations:    Array<{ name: string; durationMs: number; status: 'applied' | 'failed' | 'skipped' }>;
  error?:        string;
}

export interface IRollbackResult {
  rolledBackCount: number;
  failedCount:     number;
  durationMs:      number;
  migrations:      Array<{ name: string; durationMs: number; status: 'rolled_back' | 'failed' }>;
  error?:          string;
}

export function maskDatabaseUrl(url: string): string {
  try {
    const parsed   = new URL(url);
    parsed.password = '****';
    parsed.username = parsed.username ? '****' : '';
    return parsed.toString();
  } catch {
    return '[invalid url]';
  }
}

export function isProductionEnvironment(): boolean {
  return config.NODE_ENV === 'production';
}

export function assertNotProductionForDestructive(operation: string): void {
  if (isProductionEnvironment() && !config.DRY_RUN) {
    process.stderr.write(
      `[db-migration-tool] BLOCKED: '${operation}' is a destructive operation and cannot run in production without DRY_RUN=true.\n`,
    );
    process.exit(1);
  }
}