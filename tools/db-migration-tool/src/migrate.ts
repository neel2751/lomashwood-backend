import * as fs             from 'fs';
import * as path           from 'path';
import * as readline       from 'readline';
import { execSync }        from 'child_process';
import chalk               from 'chalk';
import ora                 from 'ora';
import {
  config,
  maskDatabaseUrl,
  isProductionEnvironment,
  assertNotProductionForDestructive,
  MIGRATION_STATES,
  type IMigrateOptions,
  type IMigrateResult,
  type IMigrationRecord,
} from './config';
import { getStatus }       from './status';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function runPrismaCommand(args: string[]): string {
  const schemaFlag = `--schema=${config.PRISMA_SCHEMA_PATH}`;
  const cmd        = ['npx', 'prisma', ...args, schemaFlag].join(' ');

  return execSync(cmd, {
    env:      { ...process.env, DATABASE_URL: config.DATABASE_URL },
    encoding: 'utf8',
    timeout:  config.MIGRATION_TIMEOUT,
    stdio:    ['pipe', 'pipe', 'pipe'],
  });
}

function getMigrationFiles(): string[] {
  const dir = config.MIGRATION_OUTPUT_DIR;

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function createBackup(): void {
  const spinner = ora('Creating pre-migration database backup…').start();

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const parsed  = new URL(config.DATABASE_URL);
    const dbName  = parsed.pathname.slice(1);
    const outFile = path.join(backupDir, `${dbName}-${timestamp}.dump`);

    const pgDump = [
      'pg_dump',
      '--format=custom',
      `--host=${parsed.hostname}`,
      `--port=${parsed.port || 5432}`,
      `--username=${parsed.username}`,
      `--file=${outFile}`,
      dbName,
    ].join(' ');

    execSync(pgDump, {
      env:      { ...process.env, PGPASSWORD: parsed.password },
      encoding: 'utf8',
      timeout:  60000,
    });

    spinner.succeed(chalk.green(`Backup created: ${outFile}`));
  } catch (err) {
    spinner.fail(chalk.red('Backup failed'));
    throw err;
  }
}

function sendAlert(message: string, level: 'info' | 'error' = 'info'): void {
  if (!config.ALERT_WEBHOOK_URL) return;

  const payload = JSON.stringify({
    level,
    service:     'db-migration-tool',
    environment: config.NODE_ENV,
    message,
    timestamp:   new Date().toISOString(),
  });

  try {
    execSync(
      `curl -s -X POST -H "Content-Type: application/json" -d '${payload}' ${config.ALERT_WEBHOOK_URL}`,
      { encoding: 'utf8', timeout: 5000 },
    );
  } catch {
    process.stderr.write('[db-migration-tool] Alert webhook delivery failed\n');
  }
}

async function applyMigrations(opts: IMigrateOptions = {}): Promise<IMigrateResult> {
  const startTime = Date.now();
  const result: IMigrateResult = {
    appliedCount:  0,
    failedCount:   0,
    skippedCount:  0,
    durationMs:    0,
    migrations:    [],
  };

  const statusBefore = await getStatus();
  const pending      = statusBefore.migrations.filter((m) => m.state === MIGRATION_STATES.PENDING);

  if (pending.length === 0) {
    console.log(chalk.green('✓ Database is already up to date. No migrations to apply.'));
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const targeted = opts.steps ? pending.slice(0, opts.steps) : pending;

  console.log('');
  console.log(chalk.bold(`Migrations to apply (${targeted.length}):`));
  targeted.forEach((m) => console.log(`  ${chalk.cyan('→')} ${m.name}`));
  console.log('');

  if (opts.dryRun ?? config.DRY_RUN) {
    console.log(chalk.yellow('DRY RUN — no changes applied.'));
    result.durationMs = Date.now() - startTime;
    result.migrations = targeted.map((m) => ({ name: m.name, durationMs: 0, status: 'skipped' as const }));
    result.skippedCount = targeted.length;
    return result;
  }

  if (isProductionEnvironment() && !opts.skipConfirm) {
    const confirmed = await confirm(
      chalk.red(`⚠  Production environment detected. Apply ${targeted.length} migration(s)?`),
    );
    if (!confirmed) {
      console.log(chalk.yellow('Migration cancelled.'));
      result.durationMs = Date.now() - startTime;
      return result;
    }
  }

  if (config.BACKUP_BEFORE_MIGRATE) {
    createBackup();
  }

  const spinner = ora('Applying migrations…').start();

  try {
    const migrateArgs = ['migrate', 'deploy'];

    if (opts.name) {
      migrateArgs.push(`--name=${opts.name}`);
    }

    if (opts.createOnly) {
      migrateArgs.push('--create-only');
    }

    const output = runPrismaCommand(migrateArgs);

    const appliedMatches = [...output.matchAll(/(\d{14}_.+?)\s+\((\d+)ms\)/g)];

    if (appliedMatches.length > 0) {
      for (const match of appliedMatches) {
        const name      = match[1] ?? 'unknown';
        const durationMs = parseInt(match[2] ?? '0', 10);
        result.migrations.push({ name, durationMs, status: 'applied' });
        result.appliedCount++;
      }
    } else {
      result.appliedCount = targeted.length;
      result.migrations   = targeted.map((m) => ({ name: m.name, durationMs: 0, status: 'applied' as const }));
    }

    spinner.succeed(chalk.green(`Applied ${result.appliedCount} migration(s) successfully.`));

    sendAlert(`Applied ${result.appliedCount} migration(s) in ${config.NODE_ENV}.`);
  } catch (err) {
    spinner.fail(chalk.red('Migration failed.'));
    result.failedCount = 1;
    result.error       = err instanceof Error ? err.message : String(err);

    process.stderr.write(`\n${chalk.red('Error details:')}\n${result.error}\n`);
    sendAlert(`Migration FAILED in ${config.NODE_ENV}: ${result.error}`, 'error');

    throw err;
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

async function createMigration(name: string, opts: Pick<IMigrateOptions, 'createOnly'> = {}): Promise<void> {
  assertNotProductionForDestructive('create migration');

  const safeName = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  const spinner  = ora(`Creating migration: ${safeName}…`).start();

  try {
    const args = ['migrate', 'dev', `--name=${safeName}`];
    if (opts.createOnly) args.push('--create-only');

    const output = runPrismaCommand(args);
    spinner.succeed(chalk.green(`Migration created: ${safeName}`));
    console.log(output);
  } catch (err) {
    spinner.fail(chalk.red('Failed to create migration.'));
    throw err;
  }
}

async function resetDatabase(): Promise<void> {
  assertNotProductionForDestructive('database reset');

  console.log(chalk.red('\n⚠  DATABASE RESET — this will DROP and recreate the entire schema.\n'));

  const confirmed = await confirm(chalk.red('Are you absolutely sure?'));
  if (!confirmed) {
    console.log(chalk.yellow('Reset cancelled.'));
    return;
  }

  const spinner = ora('Resetting database…').start();

  try {
    runPrismaCommand(['migrate', 'reset', '--force']);
    spinner.succeed(chalk.green('Database reset complete.'));
  } catch (err) {
    spinner.fail(chalk.red('Database reset failed.'));
    throw err;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  console.log('');
  console.log(chalk.bold.blue('Lomash Wood — DB Migration Tool'));
  console.log(chalk.dim(`Environment : ${config.NODE_ENV}`));
  console.log(chalk.dim(`Database    : ${maskDatabaseUrl(config.DATABASE_URL)}`));
  console.log(chalk.dim(`Schema      : ${config.PRISMA_SCHEMA_PATH}`));
  console.log('');

  if (!fs.existsSync(config.PRISMA_SCHEMA_PATH)) {
    process.stderr.write(
      chalk.red(`Schema not found at: ${config.PRISMA_SCHEMA_PATH}\n`),
    );
    process.exit(1);
  }

  const opts: IMigrateOptions = {
    dryRun:      args.includes('--dry-run') || config.DRY_RUN,
    skipConfirm: args.includes('--yes') || args.includes('-y'),
    createOnly:  args.includes('--create-only'),
    forceReset:  args.includes('--reset'),
  };

  const stepsArg = args.find((a) => a.startsWith('--steps='));
  if (stepsArg) {
    opts.steps = parseInt(stepsArg.split('=')[1] ?? '0', 10);
  }

  const nameArg = args.find((a) => a.startsWith('--name='));

  if (args.includes('--reset')) {
    await resetDatabase();
    return;
  }

  if (nameArg) {
    const migrationName = nameArg.split('=')[1];
    if (!migrationName) {
      process.stderr.write(chalk.red('--name requires a value.\n'));
      process.exit(1);
    }
    await createMigration(migrationName, { createOnly: opts.createOnly });
    return;
  }

  const result = await applyMigrations(opts);

  console.log('');
  console.log(chalk.bold('Summary'));
  console.log(`  Applied  : ${chalk.green(result.appliedCount)}`);
  console.log(`  Skipped  : ${chalk.yellow(result.skippedCount)}`);
  console.log(`  Failed   : ${chalk.red(result.failedCount)}`);
  console.log(`  Duration : ${result.durationMs}ms`);
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