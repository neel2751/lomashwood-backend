#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[$(date +%H:%M:%S)] [INFO]  ${NC}$*"; }
log_success() { echo -e "${GREEN}[$(date +%H:%M:%S)] [OK]    ${NC}$*"; }
log_warn()    { echo -e "${YELLOW}[$(date +%H:%M:%S)] [WARN]  ${NC}$*"; }
log_error()   { echo -e "${RED}[$(date +%H:%M:%S)] [ERROR] ${NC}$*" >&2; }
log_step()    { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

ENV="${1:-development}"
ACTION="${2:-deploy}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.${ENV}"
SCHEMA_DIR="${ROOT_DIR}/packages/shared-db/prisma"
MIGRATIONS_DIR="${SCHEMA_DIR}/migrations"

VALID_ENVS=("development" "staging" "production" "test")
VALID_ACTIONS=("deploy" "reset" "status" "diff" "resolve" "baseline")

validate_args() {
  local valid=false
  for e in "${VALID_ENVS[@]}"; do [[ "${ENV}" == "${e}" ]] && valid=true; done
  if [[ "${valid}" == "false" ]]; then
    log_error "Invalid environment: ${ENV}. Valid: ${VALID_ENVS[*]}"
    exit 1
  fi

  valid=false
  for a in "${VALID_ACTIONS[@]}"; do [[ "${ACTION}" == "${a}" ]] && valid=true; done
  if [[ "${valid}" == "false" ]]; then
    log_error "Invalid action: ${ACTION}. Valid: ${VALID_ACTIONS[*]}"
    exit 1
  fi
}

load_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    set -a
    source "${ENV_FILE}"
    set +a
    log_success "Loaded ${ENV_FILE}"
  else
    log_warn "${ENV_FILE} not found — using existing environment variables"
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    log_error "DATABASE_URL is not set"
    exit 1
  fi
}

check_prisma() {
  if ! command -v prisma &>/dev/null && ! pnpm exec prisma --version &>/dev/null 2>&1; then
    log_error "Prisma CLI not found. Run: pnpm install"
    exit 1
  fi
  log_success "Prisma: $(pnpm exec prisma --version 2>/dev/null | head -1)"
}

check_schema() {
  if [[ ! -f "${SCHEMA_DIR}/schema.prisma" ]]; then
    log_error "schema.prisma not found at ${SCHEMA_DIR}/schema.prisma"
    exit 1
  fi
  log_success "Schema found: ${SCHEMA_DIR}/schema.prisma"
}

wait_for_db() {
  local db_host db_port max_attempts=30 attempt=0

  db_host=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:/?]*\).*/\1/p')
  db_port=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  db_port="${db_port:-5432}"

  if [[ -z "${db_host}" ]]; then
    log_warn "Could not parse DB host from DATABASE_URL — skipping readiness check"
    return 0
  fi

  log_info "Waiting for database at ${db_host}:${db_port}..."
  until pg_isready -h "${db_host}" -p "${db_port}" -q 2>/dev/null || [[ ${attempt} -ge ${max_attempts} ]]; do
    attempt=$((attempt + 1))
    sleep 1
  done

  if [[ ${attempt} -ge ${max_attempts} ]]; then
    log_error "Database not reachable at ${db_host}:${db_port} after ${max_attempts}s"
    exit 1
  fi

  log_success "Database is ready"
}

backup_before_migrate() {
  if [[ "${ENV}" != "production" ]]; then
    return 0
  fi

  log_info "Production environment detected — creating pre-migration backup..."

  local backup_script="${ROOT_DIR}/scripts/backup.sh"
  if [[ -f "${backup_script}" ]]; then
    bash "${backup_script}" pre-migration || {
      log_error "Pre-migration backup failed. Aborting migration."
      exit 1
    }
    log_success "Pre-migration backup created"
  else
    log_warn "backup.sh not found — skipping automated backup"
    log_warn "Ensure a manual database backup exists before proceeding"
    if [[ "${FORCE:-false}" != "true" ]]; then
      echo -n "Continue without backup? (yes/no): "
      read -r confirm
      [[ "${confirm}" != "yes" ]] && { log_info "Aborted."; exit 0; }
    fi
  fi
}

action_deploy() {
  log_info "Applying pending migrations (prisma migrate deploy)..."

  pnpm --filter "shared-db" exec prisma migrate deploy \
    --schema "${SCHEMA_DIR}/schema.prisma"

  log_success "Migrations applied successfully"
}

action_reset() {
  if [[ "${ENV}" == "production" ]]; then
    log_error "prisma migrate reset is not permitted in production"
    exit 1
  fi

  log_warn "This will DROP all data and re-apply all migrations in ${ENV}"
  if [[ "${FORCE:-false}" != "true" ]]; then
    echo -n "Type 'yes' to confirm database reset: "
    read -r confirm
    [[ "${confirm}" != "yes" ]] && { log_info "Aborted."; exit 0; }
  fi

  pnpm --filter "shared-db" exec prisma migrate reset \
    --schema "${SCHEMA_DIR}/schema.prisma" \
    --force

  log_success "Database reset and migrations re-applied"
}

action_status() {
  log_info "Migration status:"
  pnpm --filter "shared-db" exec prisma migrate status \
    --schema "${SCHEMA_DIR}/schema.prisma"
}

action_diff() {
  log_info "Diffing schema against database..."
  pnpm --filter "shared-db" exec prisma migrate diff \
    --from-migrations "${MIGRATIONS_DIR}" \
    --to-schema-datamodel "${SCHEMA_DIR}/schema.prisma" \
    --shadow-database-url "${SHADOW_DATABASE_URL:-${DATABASE_URL}}"
}

action_resolve() {
  local migration_name="${3:-}"
  if [[ -z "${migration_name}" ]]; then
    log_error "Migration name required for resolve action: ./migrate.sh ${ENV} resolve <migration_name>"
    exit 1
  fi

  log_info "Marking migration as applied: ${migration_name}"
  pnpm --filter "shared-db" exec prisma migrate resolve \
    --schema "${SCHEMA_DIR}/schema.prisma" \
    --applied "${migration_name}"

  log_success "Migration marked as applied: ${migration_name}"
}

action_baseline() {
  log_info "Baselining current database state..."
  pnpm --filter "shared-db" exec prisma migrate resolve \
    --schema "${SCHEMA_DIR}/schema.prisma" \
    --applied "$(ls "${MIGRATIONS_DIR}" | sort | tail -1)"
  log_success "Database baselined"
}

list_pending() {
  local pending
  pending=$(pnpm --filter "shared-db" exec prisma migrate status \
    --schema "${SCHEMA_DIR}/schema.prisma" 2>/dev/null | grep "Not applied" | wc -l | tr -d ' ')

  if [[ "${pending}" -gt 0 ]]; then
    log_info "Pending migrations: ${pending}"
  else
    log_success "No pending migrations"
  fi
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Migration complete — env: ${ENV} | action: ${ACTION}${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

main() {
  echo ""
  echo -e "${CYAN}━━━ Lomash Wood — Migrations (${ENV} / ${ACTION}) ━━━${NC}"
  echo ""

  validate_args
  load_env
  check_prisma
  check_schema
  wait_for_db

  case "${ACTION}" in
    deploy)
      backup_before_migrate
      log_step "Pending migrations"
      list_pending
      log_step "Applying migrations"
      action_deploy
      ;;
    reset)
      log_step "Resetting database"
      action_reset
      ;;
    status)
      log_step "Migration status"
      action_status
      ;;
    diff)
      log_step "Schema diff"
      action_diff
      ;;
    resolve)
      log_step "Resolving migration"
      action_resolve "$@"
      ;;
    baseline)
      log_step "Baselining"
      action_baseline
      ;;
  esac

  [[ "${ACTION}" == "deploy" ]] && print_summary
}

main "$@"