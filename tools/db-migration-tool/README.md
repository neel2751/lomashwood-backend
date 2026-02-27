# db-migration-tool

A CLI tool for managing PostgreSQL schema migrations across all Lomash Wood backend services. Wraps Prisma Migrate with production-safe guardrails, drift detection, pre-migration backups, checksums, and structured status reporting.

---

## Installation

The tool is a private workspace package. Install dependencies from the monorepo root:

```bash
pnpm install
```

Or install directly within this package:

```bash
cd tools/db-migration-tool
pnpm install
```

---

## Configuration

All configuration is read from environment variables. The tool looks for an `.env.local` file first, then `.env`, then `../../.env` (monorepo root).

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`) |
| `NODE_ENV` | ✅ | `development` | `development`, `staging`, or `production` |
| `PRISMA_SCHEMA_PATH` | ❌ | `prisma/schema.prisma` | Absolute or relative path to the Prisma schema |
| `MIGRATION_OUTPUT_DIR` | ❌ | `prisma/migrations` | Directory containing migration folders |
| `MIGRATION_TABLE` | ❌ | `_prisma_migrations` | Name of the Prisma migrations tracking table |
| `MIGRATION_LOCK_TIMEOUT` | ❌ | `30000` | ms to wait for an advisory lock before aborting |
| `MIGRATION_TIMEOUT` | ❌ | `120000` | ms timeout for the migration command itself |
| `SHADOW_DATABASE_URL` | ❌ | — | Shadow database for `migrate dev` (Prisma requirement in some flows) |
| `BACKUP_BEFORE_MIGRATE` | ❌ | `false` | Set `true` to run `pg_dump` before applying migrations |
| `DRY_RUN` | ❌ | `false` | Set `true` to print what would happen without making changes |
| `LOG_LEVEL` | ❌ | `info` | `debug`, `info`, `warn`, or `error` |
| `ALERT_WEBHOOK_URL` | ❌ | — | POST endpoint for migration success/failure alerts |

### Example `.env`

```env
DATABASE_URL=postgresql://lomash:secret@localhost:5432/lomash_dev
NODE_ENV=development
PRISMA_SCHEMA_PATH=../../services/notification-service/prisma/schema.prisma
MIGRATION_OUTPUT_DIR=../../services/notification-service/prisma/migrations
BACKUP_BEFORE_MIGRATE=false
DRY_RUN=false
```

---

## Commands

### `migrate` — Apply pending migrations

```bash
pnpm migrate
```

Applies all pending migrations in order using `prisma migrate deploy`. Equivalent to running `npx prisma migrate deploy` but with production confirmation prompts, optional pre-migration backups, drift detection, and alert webhooks.

**Flags**

| Flag | Description |
|---|---|
| `--dry-run` | Print pending migrations and exit without applying |
| `--steps=N` | Apply at most N pending migrations |
| `--name=<name>` | Create a new named migration (dev only) |
| `--create-only` | Create migration SQL without applying it |
| `--reset` | Drop and recreate the entire database (dev/staging only) |
| `--yes`, `-y` | Skip the production confirmation prompt |

**Examples**

```bash
pnpm migrate
pnpm migrate --dry-run
pnpm migrate --steps=1
pnpm migrate --name=add_campaign_segments
pnpm migrate --name=add_campaign_segments --create-only
pnpm migrate --yes
```

**Production behaviour**

In `NODE_ENV=production`, `migrate` requires interactive confirmation unless `--yes` is passed. If `BACKUP_BEFORE_MIGRATE=true`, it runs `pg_dump` and writes a `.dump` file to `./backups/` before any DDL is executed. If the migration command exits non-zero, the process exits with code 1 and posts to `ALERT_WEBHOOK_URL` if configured.

---

### `rollback` — Revert applied migrations

```bash
pnpm rollback
```

Rolls back the most recently applied migration by executing its `down.sql` file and marking it as rolled back in `_prisma_migrations`. Rolls back 1 migration by default.

> **Note:** Rollback is **blocked in `NODE_ENV=production`** at the CLI level. In production, coordinate with the DBA team and follow the manual rollback runbook.

**Flags**

| Flag | Description |
|---|---|
| `--steps=N` | Roll back the last N applied migrations |
| `--name=<name>` | Roll back a specific migration by name |
| `--dry-run` | Print what would be rolled back without making changes |
| `--force` | Continue rolling back subsequent migrations even after a failure |
| `--yes`, `-y` | Skip the confirmation prompt |

**Examples**

```bash
pnpm rollback
pnpm rollback --steps=2
pnpm rollback --name=20250115100000_add_campaigns
pnpm rollback --dry-run
pnpm rollback --force --yes
```

**`down.sql` convention**

Each migration folder may contain a `down.sql` alongside the `migration.sql`. The `down.sql` must be the exact inverse DDL of `migration.sql`. If no `down.sql` exists, the migration is marked as rolled back in the registry without executing any DDL — a warning is printed.

Migration folder structure with rollback support:

```
prisma/migrations/
└── 20250115100000_add_campaigns/
    ├── migration.sql      ← forward DDL (applied by prisma migrate deploy)
    └── down.sql           ← reverse DDL (applied by this tool on rollback)
```

---

### `status` — Show migration status

```bash
pnpm status
```

Queries the database migration tracking table and compares it against migration files on disk. Outputs a formatted table showing the state of every migration.

**Flags**

| Flag | Description |
|---|---|
| `--verbose`, `-v` | Include rolled-back migrations and filesystem-only details |
| `--json` | Output machine-readable JSON instead of the formatted table |
| `--check` | Exit with code 1 if the database is not production-safe (pending or failed migrations exist, or drift detected) |

**Examples**

```bash
pnpm status
pnpm status --verbose
pnpm status --json
pnpm status --check
pnpm status --json | jq '.summary'
```

**Example output**

```
Lomash Wood — DB Migration Status
────────────────────────────────────────────────────────────────────────────────
  Environment  : development
  Database     : postgresql://****@localhost:5432/lomash_dev
  Schema       : /app/prisma/schema.prisma
  Migrations   : /app/prisma/migrations
────────────────────────────────────────────────────────────────────────────────

Summary
  Total        : 4
  Applied      : 3
  Pending      : 1
  Failed       : 0
  Rolled back  : 0

Migration Name                                  State                   Applied At                Age
─────────────────────────────────────────────────────────────────────────────────────────────────────
20241201080000_init                             ✓ applied               2024-12-01 08:00:00 UTC   45d ago
20241215120000_add_campaigns                    ✓ applied               2024-12-15 12:00:00 UTC   31d ago
20250101090000_add_retry_policy                 ✓ applied               2025-01-01 09:00:00 UTC   14d ago
20250115100000_add_audit_log                    ○ pending               —                         —

→ 1 pending migration(s). Run 'migrate' to apply.
```

**Migration states**

| State | Symbol | Meaning |
|---|---|---|
| `applied` | `✓` | Successfully applied and checksum matches |
| `pending` | `○` | File exists on disk, not yet applied to database |
| `failed` | `✗` | Started but did not complete, or checksum mismatch detected |
| `rolled_back` | `↩` | Applied then rolled back |
| `not_in_filesystem` | `!` | Applied in database but the migration folder no longer exists (drift) |

**JSON output shape**

```json
{
  "environment": "staging",
  "database": "postgresql://****@rds.amazonaws.com:5432/lomash_staging",
  "schemaPath": "/app/prisma/schema.prisma",
  "summary": {
    "total": 4,
    "applied": 4,
    "pending": 0,
    "failed": 0,
    "rolledBack": 0
  },
  "hasDrift": false,
  "isProductionSafe": true,
  "migrations": [
    {
      "name": "20241201080000_init",
      "state": "applied",
      "appliedAt": "2024-12-01T08:00:00.000Z",
      "checksum": "a1b2c3d4..."
    }
  ],
  "generatedAt": "2025-01-15T10:00:00.000Z"
}
```

---

## Safety Guarantees

### Production safeguards

- **`rollback` is blocked** in `NODE_ENV=production` unconditionally.
- **`migrate --reset`** is blocked in `NODE_ENV=production` unconditionally.
- **`migrate` in production** requires interactive confirmation or `--yes`.
- **`DRY_RUN=true`** prevents any DDL from being executed; the tool prints what it would do and exits 0.

### Drift detection

The `status` command detects two categories of drift:

1. **Checksum mismatch** — a migration file on disk has been modified after it was applied to the database.
2. **Orphaned database record** — a migration is recorded as applied in `_prisma_migrations` but the corresponding folder no longer exists on disk.

Both conditions are reported as `state: "not_in_filesystem"` or `state: "failed"` in the output, and the `hasDrift` flag is set to `true`.

### Checksums

Each migration file's SHA-256 checksum is computed locally and compared against the checksum stored by Prisma in `_prisma_migrations`. A mismatch indicates the migration SQL was edited after deployment and is surfaced as a `failed` state.

### Backups

When `BACKUP_BEFORE_MIGRATE=true`, the tool runs:

```bash
pg_dump --format=custom --file=./backups/<dbname>-<timestamp>.dump <dbname>
```

The backup is written before any Prisma command is invoked. If the backup fails, the migration is aborted.

---

## CI / CD Integration

### GitHub Actions — pre-deploy status check

```yaml
- name: Check migration status
  run: pnpm --filter @lomashwood/db-migration-tool status --check
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    NODE_ENV:     staging
```

### GitHub Actions — apply migrations on deploy

```yaml
- name: Apply database migrations
  run: pnpm --filter @lomashwood/db-migration-tool migrate --yes
  env:
    DATABASE_URL:          ${{ secrets.DATABASE_URL }}
    NODE_ENV:              production
    BACKUP_BEFORE_MIGRATE: true
    ALERT_WEBHOOK_URL:     ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success — all operations completed without error |
| `1` | Failure — migration failed, rollback failed, database unreachable, or `--check` found a non-safe state |

---

## Architecture

```
src/
├── config.ts     Environment parsing (zod), shared types, constants, utility functions
├── migrate.ts    Apply pending migrations; create named migrations; database reset
├── rollback.ts   Revert applied migrations using down.sql files
└── status.ts     Query migration state; drift detection; formatted and JSON output
```

The four source files share no circular dependencies. `config.ts` is the only shared module. `status.ts` exports `getStatus()` which is imported by `migrate.ts` to determine pending migrations before applying them.

---

## Development

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Building compiles all TypeScript to `dist/` with source maps and declaration files. The `migrate:prod`, `rollback:prod`, and `status:prod` scripts run the compiled output.

---

## Troubleshooting

**`Cannot connect to database`**
Verify `DATABASE_URL` is set and the host is reachable from the machine running the tool. For RDS or Cloud SQL, confirm the security group or VPC peering allows the connection.

**`Schema not found`**
Set `PRISMA_SCHEMA_PATH` to the absolute path of the `schema.prisma` file for the target service.

**`No down.sql found`**
The rollback tool requires a `down.sql` in each migration folder to execute DDL reversals. If only `migration.sql` exists, the migration is marked rolled back in the registry without executing DDL. Write a `down.sql` with the inverse DDL to enable full rollback.

**`Schema drift detected`**
A migration file was modified after being applied, or an applied migration folder was deleted. Identify the affected migration from `pnpm status --verbose`, restore the original `migration.sql`, and run `pnpm migrate` to reconcile.

**`Rollback blocked in production`**
Rollback in production requires the manual DBA runbook. Contact the on-call DBA and reference `docs/runbooks/db-rollback-production.md`.