import * as fs      from 'fs';
import * as path    from 'path';
import * as crypto  from 'crypto';
import { execSync } from 'child_process';
import chalk        from 'chalk';
import ora          from 'ora';
import {
  config,
  maskDatabaseUrl,
  MIGRATION_STATES,
  type IMigrationRecord,
  type IMigrationFile,
  type IMigrationStatus,
  type MigrationState,
} from './config';

function computeChecksum(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getMigrationFiles(): Array<{ name: string; dir: string; sqlPath: string }> {
  const dir = config.MIGRATION_OUTPUT_DIR;

  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => ({
      name:    d.name,
      dir:     path.join(dir, d.name),
      sqlPath: path.join(dir, d.name, 'migration.sql'),
    }));
}

function queryAppliedMigrations(): IMigrationRecord[] {
  const parsed = new URL(config.DATABASE_URL);
  const table  = config.MIGRATION_TABLE;

  const sql = [
    `SELECT id, migration_name, finished_at, started_at,`,
    `applied_steps_count, checksum, rolled_back_at, logs`,
    `FROM "${table}"`,
    `ORDER BY started_at ASC;`,
  ].join(' ');

  const psql = [
    'psql',
    `--host=${parsed.hostname}`,
    `--port=${parsed.port || 5432}`,
    `--username=${parsed.username}`,
    `--dbname=${parsed.pathname.slice(1)}`,
    '--no-password',
    '--tuples-only',
    '--no-align',
    '--field-separator=|||',
    `--command=${sql}`,
  ].join(' ');

  try {
    const output = execSync(psql, {
      env:      { ...process.env, PGPASSWORD: parsed.password },
      encoding: 'utf8',
      timeout:  config.MIGRATION_LOCK_TIMEOUT,
    });

    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|||');
        return {
          id:                parts[0]?.trim() ?? '',
          migrationName:     parts[1]?.trim() ?? '',
          finishedAt:        parts[2]?.trim() ? new Date(parts[2].trim()) : null,
          startedAt:         new Date(parts[3]?.trim() ?? Date.now()),
          appliedStepsCount: parseInt(parts[4]?.trim() ?? '0', 10),
          checksum:          parts[5]?.trim() ?? '',
          rolledBackAt:      parts[6]?.trim() ? new Date(parts[6].trim()) : null,
          logs:              parts[7]?.trim() ?? null,
        };
      });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('table')
    ) {
      return [];
    }

    process.stderr.write(
      chalk.red(`[status] Failed to query migration table: ${message}\n`),
    );
    return [];
  }
}

function isDatabaseReachable(): boolean {
  try {
    const parsed = new URL(config.DATABASE_URL);

    const psql = [
      'psql',
      `--host=${parsed.hostname}`,
      `--port=${parsed.port || 5432}`,
      `--username=${parsed.username}`,
      `--dbname=${parsed.pathname.slice(1)}`,
      '--no-password',
      '--command=SELECT 1;',
    ].join(' ');

    execSync(psql, {
      env:      { ...process.env, PGPASSWORD: parsed.password },
      encoding: 'utf8',
      timeout:  5000,
      stdio:    'pipe',
    });

    return true;
  } catch {
    return false;
  }
}

function resolveMigrationState(
  file: { name: string; sqlPath: string; checksum: string },
  record: IMigrationRecord | undefined,
): MigrationState {
  if (!record) return MIGRATION_STATES.PENDING;
  if (record.rolledBackAt) return MIGRATION_STATES.ROLLED_BACK;
  if (!record.finishedAt) return MIGRATION_STATES.FAILED;

  if (record.checksum && file.checksum && record.checksum !== file.checksum) {
    return MIGRATION_STATES.FAILED;
  }

  return MIGRATION_STATES.APPLIED;
}

function detectDrift(migrations: IMigrationFile[], records: IMigrationRecord[]): boolean {
  const appliedNames = new Set(
    records
      .filter((r) => r.finishedAt && !r.rolledBackAt)
      .map((r) => r.migrationName),
  );

  const fileNames = new Set(migrations.map((m) => m.name));

  for (const name of appliedNames) {
    if (!fileNames.has(name)) return true;
  }

  for (const migration of migrations) {
    if (migration.state !== MIGRATION_STATES.APPLIED) continue;
    const record = records.find((r) => r.migrationName === migration.name);
    if (!record) continue;
    if (record.checksum && migration.checksum && record.checksum !== migration.checksum) {
      return true;
    }
  }

  return false;
}

export async function getStatus(): Promise<IMigrationStatus> {
  const files   = getMigrationFiles();
  const records = queryAppliedMigrations();

  const recordMap = new Map(records.map((r) => [r.migrationName, r]));

  const migrations: IMigrationFile[] = files.map((f) => {
    const checksum = computeChecksum(f.sqlPath);
    const record   = recordMap.get(f.name);
    const state    = resolveMigrationState({ name: f.name, sqlPath: f.sqlPath, checksum }, record);

    return {
      name:      f.name,
      path:      f.dir,
      sqlPath:   f.sqlPath,
      checksum,
      appliedAt: record?.finishedAt ?? null,
      state,
    };
  });

  const dbOnlyRecords = records.filter(
    (r) => !files.some((f) => f.name === r.migrationName),
  );

  for (const record of dbOnlyRecords) {
    migrations.push({
      name:      record.migrationName,
      path:      '',
      sqlPath:   '',
      checksum:  record.checksum,
      appliedAt: record.finishedAt,
      state:     MIGRATION_STATES.NOT_IN_DATABASE,
    });
  }

  const applied    = migrations.filter((m) => m.state === MIGRATION_STATES.APPLIED).length;
  const pending    = migrations.filter((m) => m.state === MIGRATION_STATES.PENDING).length;
  const failed     = migrations.filter((m) => m.state === MIGRATION_STATES.FAILED).length;
  const rolledBack = migrations.filter((m) => m.state === MIGRATION_STATES.ROLLED_BACK).length;
  const hasDrift   = detectDrift(migrations, records);

  return {
    totalFiles:       migrations.length,
    applied,
    pending,
    failed,
    rolledBack,
    databaseUrl:      maskDatabaseUrl(config.DATABASE_URL),
    schemaPath:       config.PRISMA_SCHEMA_PATH,
    migrations,
    hasDrift,
    isProductionSafe: pending === 0 && failed === 0 && !hasDrift,
  };
}

function formatState(state: MigrationState): string {
  switch (state) {
    case MIGRATION_STATES.APPLIED:         return chalk.green('✓ applied');
    case MIGRATION_STATES.PENDING:         return chalk.yellow('○ pending');
    case MIGRATION_STATES.FAILED:          return chalk.red('✗ failed');
    case MIGRATION_STATES.ROLLED_BACK:     return chalk.dim('↩ rolled back');
    case MIGRATION_STATES.NOT_IN_DATABASE: return chalk.red('! not in filesystem');
    default:                               return chalk.gray('? unknown');
  }
}

function formatTimestamp(date: Date | null): string {
  if (!date) return chalk.dim('—');
  return chalk.dim(date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
}

function formatDuration(appliedAt: Date | null): string {
  if (!appliedAt) return '';
  const ms = Date.now() - appliedAt.getTime();
  const d  = Math.floor(ms / 86_400_000);
  const h  = Math.floor((ms % 86_400_000) / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

function printStatus(status: IMigrationStatus, verbose: boolean): void {
  console.log('');
  console.log(chalk.bold.blue('Lomash Wood — DB Migration Status'));
  console.log(chalk.dim('─'.repeat(80)));
  console.log(`  Environment  : ${chalk.bold(config.NODE_ENV)}`);
  console.log(`  Database     : ${chalk.dim(status.databaseUrl)}`);
  console.log(`  Schema       : ${chalk.dim(status.schemaPath)}`);
  console.log(`  Migrations   : ${path.resolve(config.MIGRATION_OUTPUT_DIR)}`);
  console.log(chalk.dim('─'.repeat(80)));
  console.log('');

  console.log(chalk.bold('Summary'));
  console.log(`  Total        : ${status.totalFiles}`);
  console.log(`  Applied      : ${chalk.green(status.applied)}`);
  console.log(`  Pending      : ${status.pending > 0 ? chalk.yellow(status.pending) : chalk.dim(status.pending)}`);
  console.log(`  Failed       : ${status.failed > 0 ? chalk.red(status.failed) : chalk.dim(status.failed)}`);
  console.log(`  Rolled back  : ${chalk.dim(status.rolledBack)}`);

  if (status.hasDrift) {
    console.log('');
    console.log(chalk.red('⚠  Schema drift detected — applied migrations do not match filesystem.'));
  }

  if (status.isProductionSafe) {
    console.log('');
    console.log(chalk.green('✓ Database is up to date and production-safe.'));
  }

  console.log('');

  const visibleMigrations = verbose
    ? status.migrations
    : status.migrations.filter((m) => m.state !== MIGRATION_STATES.ROLLED_BACK);

  if (visibleMigrations.length === 0) {
    console.log(chalk.dim('  No migration files found.'));
    console.log('');
    return;
  }

  const nameWidth = Math.min(
    60,
    Math.max(20, ...visibleMigrations.map((m) => m.name.length)),
  );

  const header = [
    'Migration Name'.padEnd(nameWidth),
    'State'.padEnd(22),
    'Applied At'.padEnd(24),
    'Age',
  ].join('  ');

  console.log(chalk.dim(header));
  console.log(chalk.dim('─'.repeat(nameWidth + 22 + 24 + 10)));

  for (const migration of visibleMigrations) {
    const name    = migration.name.length > nameWidth
      ? migration.name.slice(0, nameWidth - 3) + '...'
      : migration.name.padEnd(nameWidth);

    const stateStr = formatState(migration.state).padEnd(30);
    const tsStr    = formatTimestamp(migration.appliedAt).padEnd(32);
    const age      = formatDuration(migration.appliedAt);

    console.log(`${name}  ${stateStr}  ${tsStr}  ${chalk.dim(age)}`);

    if (verbose && migration.state === MIGRATION_STATES.NOT_IN_DATABASE) {
      console.log(
        chalk.red(`  └ Applied in DB but missing from filesystem: ${migration.name}`),
      );
    }
  }

  console.log('');

  if (status.failed > 0) {
    console.log(chalk.red(`✗ ${status.failed} migration(s) failed. Run 'migrate' to retry or 'rollback' to revert.`));
    console.log('');
  }

  if (status.pending > 0) {
    console.log(chalk.yellow(`→ ${status.pending} pending migration(s). Run 'migrate' to apply.`));
    console.log('');
  }
}

function printJson(status: IMigrationStatus): void {
  const output = {
    environment:      config.NODE_ENV,
    database:         status.databaseUrl,
    schemaPath:       status.schemaPath,
    summary: {
      total:      status.totalFiles,
      applied:    status.applied,
      pending:    status.pending,
      failed:     status.failed,
      rolledBack: status.rolledBack,
    },
    hasDrift:         status.hasDrift,
    isProductionSafe: status.isProductionSafe,
    migrations:       status.migrations.map((m) => ({
      name:      m.name,
      state:     m.state,
      appliedAt: m.appliedAt?.toISOString() ?? null,
      checksum:  m.checksum,
    })),
    generatedAt: new Date().toISOString(),
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

async function main(): Promise<void> {
  const args    = process.argv.slice(2);
  const json    = args.includes('--json');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const check   = args.includes('--check');

  if (!json) {
    console.log('');
    console.log(chalk.bold.blue('Lomash Wood — DB Migration Tool'));
    console.log(chalk.dim(`Environment : ${config.NODE_ENV}`));
    console.log(chalk.dim(`Database    : ${maskDatabaseUrl(config.DATABASE_URL)}`));
  }

  const reachable = isDatabaseReachable();

  if (!reachable) {
    if (json) {
      process.stdout.write(
        JSON.stringify({ error: 'Database unreachable', databaseUrl: maskDatabaseUrl(config.DATABASE_URL) }) + '\n',
      );
    } else {
      process.stderr.write(chalk.red('\n✗ Cannot connect to database. Check DATABASE_URL and network access.\n\n'));
    }
    process.exit(1);
  }

  const spinner = json ? null : ora('Fetching migration status…').start();

  let status: IMigrationStatus;

  try {
    status = await getStatus();
    spinner?.succeed('Status fetched.');
  } catch (err) {
    spinner?.fail('Failed to fetch status.');
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(chalk.red(`Error: ${message}\n`));
    process.exit(1);
  }

  if (json) {
    printJson(status);
  } else {
    printStatus(status, verbose);
  }

  if (check) {
    if (!status.isProductionSafe) {
      process.exit(1);
    }
  }
}

main().catch((err) => {
  process.stderr.write(
    chalk.red(`\n[db-migration-tool] Unhandled error: ${err instanceof Error ? err.message : String(err)}\n`),
  );
  process.exit(1);
});