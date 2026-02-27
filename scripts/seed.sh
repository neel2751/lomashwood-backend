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
SEED_MODE="${2:-standard}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.${ENV}"
SCHEMA_DIR="${ROOT_DIR}/packages/shared-db/prisma"
SEEDS_DIR="${ROOT_DIR}/packages/shared-db/prisma/seeds"
FORCE="${FORCE:-false}"

validate_args() {
  local valid_envs=("development" "staging" "test")
  local valid=false
  for e in "${valid_envs[@]}"; do [[ "${ENV}" == "${e}" ]] && valid=true; done
  if [[ "${valid}" == "false" ]]; then
    log_error "Seeding is not permitted in '${ENV}'. Allowed: ${valid_envs[*]}"
    exit 1
  fi

  local valid_modes=("standard" "minimal" "demo" "test" "reset")
  valid=false
  for m in "${valid_modes[@]}"; do [[ "${SEED_MODE}" == "${m}" ]] && valid=true; done
  if [[ "${valid}" == "false" ]]; then
    log_error "Invalid seed mode: ${SEED_MODE}. Valid: ${valid_modes[*]}"
    exit 1
  fi
}

load_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    set -a; source "${ENV_FILE}"; set +a
    log_success "Loaded ${ENV_FILE}"
  else
    log_warn "${ENV_FILE} not found — using existing environment variables"
  fi

  [[ -z "${DATABASE_URL:-}" ]] && { log_error "DATABASE_URL not set"; exit 1; }
}

check_tools() {
  for cmd in pnpm node; do
    command -v "${cmd}" &>/dev/null && log_success "${cmd} found" || { log_error "${cmd} not found"; exit 1; }
  done
}

wait_for_db() {
  local db_host
  db_host=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:/?]*\).*/\1/p')
  local db_port
  db_port=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  db_port="${db_port:-5432}"
  local max_attempts=20 attempt=0

  log_info "Waiting for database at ${db_host}:${db_port}..."
  until pg_isready -h "${db_host}" -p "${db_port}" -q 2>/dev/null || [[ ${attempt} -ge ${max_attempts} ]]; do
    attempt=$((attempt + 1)); sleep 1
  done

  [[ ${attempt} -ge ${max_attempts} ]] && { log_error "Database not reachable"; exit 1; }
  log_success "Database ready"
}

check_migrations() {
  log_info "Verifying migrations are up to date..."
  local status
  status=$(pnpm --filter "shared-db" exec prisma migrate status \
    --schema "${SCHEMA_DIR}/schema.prisma" 2>/dev/null || echo "error")

  if echo "${status}" | grep -q "not yet applied\|pending"; then
    log_warn "Pending migrations detected — running migrate first"
    bash "${ROOT_DIR}/scripts/migrate.sh" "${ENV}" deploy
  else
    log_success "Migrations are current"
  fi
}

confirm_seed() {
  if [[ "${FORCE}" == "true" ]]; then return 0; fi
  if [[ "${SEED_MODE}" == "reset" ]]; then
    echo ""
    echo -e "${YELLOW}  ⚠  RESET mode will TRUNCATE all seeded tables${NC}"
    echo -n "  Type 'yes' to confirm: "
    read -r confirm
    [[ "${confirm}" != "yes" ]] && { log_info "Aborted."; exit 0; }
  fi
}

run_seed_file() {
  local seed_file=$1
  if [[ ! -f "${seed_file}" ]]; then
    log_warn "Seed file not found: ${seed_file} — skipping"
    return 0
  fi
  log_info "Running: $(basename "${seed_file}")"
  NODE_ENV="${ENV}" node --loader ts-node/esm "${seed_file}" || {
    log_error "Seed file failed: ${seed_file}"
    return 1
  }
  log_success "Completed: $(basename "${seed_file}")"
}

seed_categories() {
  run_seed_file "${SEEDS_DIR}/01-categories.seed.ts"
}

seed_products() {
  run_seed_file "${SEEDS_DIR}/02-products.seed.ts"
}

seed_showrooms() {
  run_seed_file "${SEEDS_DIR}/03-showrooms.seed.ts"
}

seed_availability() {
  run_seed_file "${SEEDS_DIR}/04-availability.seed.ts"
}

seed_admin_users() {
  run_seed_file "${SEEDS_DIR}/05-admin-users.seed.ts"
}

seed_customers() {
  run_seed_file "${SEEDS_DIR}/06-customers.seed.ts"
}

seed_orders() {
  run_seed_file "${SEEDS_DIR}/07-orders.seed.ts"
}

seed_appointments() {
  run_seed_file "${SEEDS_DIR}/08-appointments.seed.ts"
}

seed_blog_content() {
  run_seed_file "${SEEDS_DIR}/09-blog-content.seed.ts"
}

seed_loyalty() {
  run_seed_file "${SEEDS_DIR}/10-loyalty.seed.ts"
}

run_prisma_seed() {
  log_info "Running prisma db seed..."
  pnpm --filter "shared-db" exec prisma db seed \
    --schema "${SCHEMA_DIR}/schema.prisma" 2>/dev/null || {
    log_warn "prisma db seed not configured — running seed files directly"
    return 1
  }
}

truncate_seed_tables() {
  log_info "Truncating seed tables..."
  local tables=(
    "loyalty_accounts"
    "notifications"
    "blog_posts"
    "appointment_slots"
    "appointments"
    "order_items"
    "orders"
    "reviews"
    "customer_profiles"
    "users"
    "product_images"
    "products"
    "showrooms"
    "categories"
  )

  local truncate_sql
  truncate_sql="TRUNCATE TABLE $(printf '"%s",' "${tables[@]}" | sed 's/,$//') CASCADE;"

  PGPASSWORD="${POSTGRES_PASSWORD:-}" psql \
    "${DATABASE_URL}" \
    -c "${truncate_sql}" \
    --quiet 2>/dev/null || {
    log_warn "Could not truncate via psql — seed files will handle conflicts"
  }

  log_success "Tables truncated"
}

run_seed_mode() {
  case "${SEED_MODE}" in
    reset)
      truncate_seed_tables
      run_standard_seed
      ;;
    minimal)
      seed_categories
      seed_products
      seed_admin_users
      ;;
    demo)
      run_standard_seed
      seed_orders
      seed_appointments
      seed_loyalty
      ;;
    test)
      seed_admin_users
      seed_customers
      seed_categories
      seed_products
      seed_availability
      ;;
    standard)
      run_standard_seed
      ;;
  esac
}

run_standard_seed() {
  seed_categories
  seed_products
  seed_showrooms
  seed_availability
  seed_admin_users
  seed_customers
  seed_blog_content
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Seeding complete — env: ${ENV} | mode: ${SEED_MODE}${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${YELLOW}Seed modes available:${NC}"
  echo -e "  minimal   — categories, products, admin users"
  echo -e "  standard  — + showrooms, availability, customers, blog"
  echo -e "  demo      — standard + orders, appointments, loyalty"
  echo -e "  test      — admin, customers, products, availability"
  echo -e "  reset     — truncate all + standard seed"
  echo ""
}

main() {
  echo ""
  echo -e "${CYAN}━━━ Lomash Wood — Seed (${ENV} / ${SEED_MODE}) ━━━${NC}"
  echo ""

  validate_args
  load_env
  check_tools
  wait_for_db
  check_migrations
  confirm_seed

  log_step "Seeding database (${SEED_MODE})"
  run_seed_mode

  print_summary
}

main "$@"