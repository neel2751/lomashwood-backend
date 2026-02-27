import * as fs       from 'fs';
import * as path     from 'path';
import * as readline from 'readline';
import { execSync }  from 'child_process';
import chalk         from 'chalk';
import ora           from 'ora';
import {
  config,
  maskDatabaseUrl,
  isProductionEnvironment,
  assertNotProductionForDestructive,
  MIGRATION_STATES,
  type IRollbackOptions,
  type IRollbackResult,
  type IMigrationRecord,
} from './config';
import { getStatus } from './status';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function getMigrationSqlPath(migrationName: string, direction: 'up' | 'down'): string | null {
  const candidates = [
    path.join(config.MIGRATION_OUTPUT_DIR, migrationName, `${direction}.sql`),
    path.join(config.MIGRATION_OUTPUT_DIR, migrationName, 'migration.sql'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function executeRawSql(sql: string): void {
  const parsed = new URL(config.DATABASE_URL);

  const psql = [
    'psql',
    `--host=${parsed.hostname}`,
    `--port=${parsed.port || 5432}`,
    `--username=${parsed.username}`,
    `--dbname=${parsed.pathname.slice(1)}`,
    '--no-password',
    `--command=${JSON.stringify(sql)}`,
  ].join(' ');

  execSync(psql, {
    env:      { ...process.env, PGPASSWORD: parsed.password },
    encoding: 'utf8',
    timeout:  config.MIGRATION_TIMEOUT,
  });
}

function markMigrationRolledBack(migrationName: string): void {
  const sql = `
    UPDATE "_prisma_migrations"
    SET "rolled_back_at" = NOW()
    WHERE "migration_name" = '${migrationName.replace(/'/g, "''")}';
  `;
  executeRawSql(sql);
}

function getAppliedMigrations(): IMigrationRecord[] {
  const parsed  = new URL(config.DATABASE_URL);
  const table   = config.MIGRATION_TABLE;

  const psql = [
    'psql',
    `--host=${parsed.hostname}`,
    `--port=${parsed.port || 5432}`,
    `--username=${parsed.username}`,
    `--dbname=${parsed.pathname.slice(1)}`,
    '--no-password',
    '--tuples-only',
    '--no-align',
    '--field-separator=|',
    `--command=SELECT id, migration_name, finished_at, started_at, applied_steps_count, checksum, rolled_back_at FROM "${table}" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY started_at DESC;`,
  ].join(' ');

  try {
    const output = execSync(psql, {
      env:      { ...process.env, PGPASSWORD: parsed.password },
      encoding: 'utf8',
      timeout:  15000,
    });

    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|');
        return {
          id:                parts[0]?.trim() ?? '',
          migrationName:     parts[1]?.trim() ?? '',
          finishedAt:        parts[2] ? new Date(parts[2].trim()) : null,
          startedAt:         new Date(parts[3]?.trim() ?? Date.now()),
          appliedStepsCount: parseInt(parts[4]?.trim() ?? '0', 10),
          checksum:          parts[5]?.trim() ?? '',
          rolledBackAt:      parts[6] ? new Date(parts[6].trim()) : null,
          logs:              null,
        };
      });
  } catch {
    return [];
  }
}

async function rollbackMigrations(opts: IRollbackOptions = {}): Promise<IRollbackResult> {
  assertNotProductionForDestructive('rollback');

  const startTime = Date.now();
  const result: IRollbackResult = {
    rolledBackCount: 0,
    failedCount:     0,
    durationMs:      0,
    migrations:      [],
  };

  const applied = getAppliedMigrations();

  if (applied.length === 0) {
    console.log(chalk.green('✓ No applied migrations to roll back.'));
    result.durationMs = Date.now() - startTime;
    return result;
  }

  let targeted: IMigrationRecord[];

  if (opts.name) {
    const found = applied.find((m) => m.migrationName === opts.name);
    if (!found) {
      process.stderr.write(
        chalk.red(`Migration '${opts.name}' not found in applied migrations.\n`),
      );
      process.exit(1);
    }
    targeted = [found];
  } else {
    const steps = opts.steps ?? 1;
    targeted = applied.slice(0, steps);
  }

  console.log('');
  console.log(chalk.bold.red(`Migrations to roll back (${targeted.length}):`));
  targeted.forEach((m) => console.log(`  ${chalk.red('←')} ${m.migrationName}`));
  console.log('');

  if (opts.dryRun ?? config.DRY_RUN) {
    console.log(chalk.yellow('DRY RUN — no changes applied.'));
    result.durationMs  = Date.now() - startTime;
    result.migrations  = targeted.map((m) => ({ name: m.migrationName, durationMs: 0, status: 'rolled_back' as const }));
    result.rolledBackCount = targeted.length;
    return result;
  }

  if (!opts.skipConfirm) {
    const confirmed = await confirm(
      chalk.red(`⚠  Roll back ${targeted.length} migration(s)?`),
    );
    if (!confirmed) {
      console.log(chalk.yellow('Rollback cancelled.'));
      result.durationMs = Date.now() - startTime;
      return result;
    }
  }

  for (const migration of targeted) {
    const migStart = Date.now();
    const spinner  = ora(`Rolling back: ${migration.migrationName}…`).start();

    const downSqlPath = getMigrationSqlPath(migration.migrationName, 'down');

    if (!downSqlPath) {
      spinner.warn(
        chalk.yellow(`No down.sql found for '${migration.migrationName}'. Skipping DDL rollback — marking as rolled back in registry only.`),
      );

      if (!opts.dryRun) {
        markMigrationRolledBack(migration.migrationName);
      }

      result.migrations.push({
        name:       migration.migrationName,
        durationMs: Date.now() - migStart,
        status:     'rolled_back',
      });
      result.rolledBackCount++;
      continue;
    }

    try {
      const sql = fs.readFileSync(downSqlPath, 'utf8').trim();

      if (!sql) {
        spinner.warn(chalk.yellow(`down.sql is empty for '${migration.migrationName}'. Marking as rolled back.`));
        markMigrationRolledBack(migration.migrationName);
        result.migrations.push({ name: migration.migrationName, durationMs: Date.now() - migStart, status: 'rolled_back' });
        result.rolledBackCount++;
        continue;
      }

      executeRawSql(sql);
      markMigrationRolledBack(migration.migrationName);

      spinner.succeed(chalk.green(`Rolled back: ${migration.migrationName}`));
      result.migrations.push({
        name:       migration.migrationName,
        durationMs: Date.now() - migStart,
        status:     'rolled_back',
      });
      result.rolledBackCount++;
    } catch (err) {
      spinner.fail(chalk.red(`Failed to roll back: ${migration.migrationName}`));
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`\n${chalk.red('Error:')}\n${message}\n`);

      result.migrations.push({ name: migration.migrationName, durationMs: Date.now() - migStart, status: 'failed' });
      result.failedCount++;
      result.error = message;

      if (!opts.force) {
        console.log(chalk.red('Stopping rollback due to failure. Use --force to continue past errors.'));
        break;
      }
    }
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  console.log('');
  console.log(chalk.bold.blue('Lomash Wood — DB Migration Tool (Rollback)'));
  console.log(chalk.dim(`Environment : ${config.NODE_ENV}`));
  console.log(chalk.dim(`Database    : ${maskDatabaseUrl(config.DATABASE_URL)}`));
  console.log('');

  if (isProductionEnvironment()) {
    process.stderr.write(
      chalk.red(
        `BLOCKED: Rollback is disabled in production. Coordinate with the DBA and use the manual runbook.\n`,
      ),
    );
    process.exit(1);
  }

  const opts: IRollbackOptions = {
    dryRun:      args.includes('--dry-run') || config.DRY_RUN,
    skipConfirm: args.includes('--yes') || args.includes('-y'),
    force:       args.includes('--force'),
  };

  const stepsArg = args.find((a) => a.startsWith('--steps='));
  if (stepsArg) {
    opts.steps = parseInt(stepsArg.split('=')[1] ?? '1', 10);
    if (isNaN(opts.steps) || opts.steps < 1) {
      process.stderr.write(chalk.red('--steps must be a positive integer.\n'));
      process.exit(1);
    }
  }

  const nameArg = args.find((a) => a.startsWith('--name='));
  if (nameArg) {
    opts.name = nameArg.split('=').slice(1).join('=');
  }

  if (!opts.steps && !opts.name) {
    opts.steps = 1;
  }

  const result = await rollbackMigrations(opts);

  console.log('');
  console.log(chalk.bold('Summary'));
  console.log(`  Rolled back : ${chalk.green(result.rolledBackCount)}`);
  console.log(`  Failed      : ${chalk.red(result.failedCount)}`);
  console.log(`  Duration    : ${result.durationMs}ms`);
  console.log('');

  if (result.failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(
    chalk.red(`\n[db-migration-tool] Unhandled error: ${err instanceof Error ? err.message : String(err)}\n`),
  );
  process.exit(1);
});