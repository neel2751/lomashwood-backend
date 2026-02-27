#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[$(date +%H:%M:%S)] [INFO]  ${NC}$*"; }
log_success() { echo -e "${GREEN}[$(date +%H:%M:%S)] [OK]    ${NC}$*"; }
log_warn()    { echo -e "${YELLOW}[$(date +%H:%M:%S)] [WARN]  ${NC}$*"; }
log_error()   { echo -e "${RED}[$(date +%H:%M:%S)] [ERROR] ${NC}$*" >&2; }
log_step()    { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

MODE="${1:-unit}"
TARGET="${2:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.test"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
COVERAGE_DIR="${ROOT_DIR}/coverage"
REPORTS_DIR="${ROOT_DIR}/test-reports"
COVERAGE="${COVERAGE:-false}"
WATCH="${WATCH:-false}"
BAIL="${BAIL:-false}"

SERVICES=(
  "api-gateway"
  "auth-service"
  "product-service"
  "order-payment-service"
  "appointment-service"
  "content-service"
  "customer-service"
  "notification-service"
  "analytics-service"
)

load_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    set -a; source "${ENV_FILE}"; set +a
    log_success "Loaded ${ENV_FILE}"
  else
    log_warn ".env.test not found — using existing environment variables"
    export NODE_ENV=test
  fi
  export NODE_ENV=test
}

check_tools() {
  for cmd in pnpm node; do
    command -v "${cmd}" &>/dev/null || { log_error "${cmd} not found"; exit 1; }
  done
}

setup_dirs() {
  mkdir -p "${COVERAGE_DIR}" "${REPORTS_DIR}"
}

build_vitest_args() {
  local args=()

  [[ "${WATCH}" == "true" ]] && args+=("--watch") || args+=("--run")
  [[ "${BAIL}" == "true" ]] && args+=("--bail" "1")
  [[ "${COVERAGE}" == "true" ]] && args+=("--coverage" "--coverage.provider" "v8")

  args+=("--reporter" "verbose")
  args+=("--reporter" "junit" "--outputFile" "${REPORTS_DIR}/junit-${MODE}-${TIMESTAMP}.xml")

  echo "${args[@]}"
}

wait_for_test_db() {
  local db_url="${TEST_DATABASE_URL:-${DATABASE_URL:-}}"
  [[ -z "${db_url}" ]] && { log_warn "TEST_DATABASE_URL not set — skipping DB readiness check"; return 0; }

  local db_host
  db_host=$(echo "${db_url}" | sed -n 's/.*@\([^:/?]*\).*/\1/p')
  local db_port
  db_port=$(echo "${db_url}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  db_port="${db_port:-5432}"
  local max_attempts=20 attempt=0

  log_info "Waiting for test database at ${db_host}:${db_port}..."
  until pg_isready -h "${db_host}" -p "${db_port}" -q 2>/dev/null || [[ ${attempt} -ge ${max_attempts} ]]; do
    attempt=$((attempt + 1)); sleep 1
  done

  [[ ${attempt} -ge ${max_attempts} ]] && { log_error "Test database not reachable"; exit 1; }
  log_success "Test database ready"
}

setup_test_db() {
  log_info "Setting up test database..."
  DATABASE_URL="${TEST_DATABASE_URL:-${DATABASE_URL:-}}" \
    bash "${ROOT_DIR}/scripts/migrate.sh" test deploy 2>/dev/null || {
    log_warn "Test DB migration failed — continuing (may be up to date)"
  }
}

run_unit_tests() {
  local filter_args=()
  [[ -n "${TARGET}" ]] && filter_args+=("--filter" "${TARGET}")

  log_info "Running unit tests..."
  local vitest_args
  read -ra vitest_args <<< "$(build_vitest_args)"

  if [[ -n "${TARGET}" ]]; then
    pnpm --filter "${TARGET}" exec vitest "${vitest_args[@]}" \
      --config vitest.config.unit.ts
  else
    pnpm exec vitest "${vitest_args[@]}" \
      --config vitest.config.unit.ts \
      --project "apps/*"
  fi
}

run_integration_tests() {
  wait_for_test_db
  setup_test_db

  log_info "Running integration tests..."
  local vitest_args
  read -ra vitest_args <<< "$(build_vitest_args)"

  if [[ -n "${TARGET}" ]]; then
    pnpm --filter "${TARGET}" exec vitest "${vitest_args[@]}" \
      --config vitest.config.integration.ts
  else
    for service in "${SERVICES[@]}"; do
      log_info "Integration tests: ${service}"
      pnpm --filter "${service}" exec vitest "${vitest_args[@]}" \
        --config vitest.config.integration.ts 2>/dev/null || \
        log_warn "No integration tests found for ${service}"
    done
  fi
}

run_e2e_tests() {
  if ! command -v docker &>/dev/null; then
    log_error "Docker required for E2E tests"
    exit 1
  fi

  local compose_file="${ROOT_DIR}/docker-compose.test.yml"
  if [[ ! -f "${compose_file}" ]]; then
    log_error "docker-compose.test.yml not found"
    exit 1
  fi

  log_info "Starting E2E test environment..."
  docker compose -f "${compose_file}" up -d --wait

  local exit_code=0

  log_info "Running E2E tests..."
  pnpm --filter "e2e" exec vitest run \
    --config vitest.config.e2e.ts \
    --reporter verbose 2>&1 || exit_code=$?

  log_info "Tearing down E2E environment..."
  docker compose -f "${compose_file}" down --volumes --remove-orphans

  [[ ${exit_code} -ne 0 ]] && { log_error "E2E tests failed"; exit 1; }
  log_success "E2E tests passed"
}

run_ci_tests() {
  log_info "Running full CI test suite (unit + integration)..."

  BAIL=true run_unit_tests
  BAIL=true run_integration_tests

  if [[ "${COVERAGE:-false}" == "true" ]]; then
    log_info "Generating combined coverage report..."
    pnpm exec vitest run \
      --coverage \
      --coverage.provider v8 \
      --coverage.reporter json \
      --coverage.reporter lcov \
      --coverage.reporter text \
      --coverage.reportsDirectory "${COVERAGE_DIR}" \
      --run 2>/dev/null || true
  fi
}

run_watch() {
  log_info "Starting Vitest in watch mode..."
  local filter_args=()
  [[ -n "${TARGET}" ]] && filter_args+=("--filter" "${TARGET}")

  pnpm "${filter_args[@]}" exec vitest \
    --watch \
    --config "vitest.config.${MODE:-unit}.ts" 2>/dev/null || \
  pnpm "${filter_args[@]}" exec vitest --watch
}

print_coverage_summary() {
  [[ "${COVERAGE}" != "true" ]] && return 0
  local summary="${COVERAGE_DIR}/coverage-summary.json"
  [[ ! -f "${summary}" ]] && return 0

  log_info "Coverage summary:"
  jq -r '.total | "  Lines: \(.lines.pct)% | Branches: \(.branches.pct)% | Functions: \(.functions.pct)% | Statements: \(.statements.pct)%"' \
    "${summary}" 2>/dev/null || true
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Tests complete — mode: ${MODE}${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  print_coverage_summary
  [[ -d "${REPORTS_DIR}" ]] && log_info "Reports: ${REPORTS_DIR}"
  [[ "${COVERAGE}" == "true" ]] && log_info "Coverage: ${COVERAGE_DIR}"
  echo ""
}

main() {
  echo ""
  echo -e "${CYAN}━━━ Lomash Wood — Tests (${MODE}${TARGET:+ / ${TARGET}}) ━━━${NC}"
  echo ""

  load_env
  check_tools
  setup_dirs

  cd "${ROOT_DIR}"

  if [[ "${WATCH}" == "true" ]]; then
    run_watch
    exit 0
  fi

  case "${MODE}" in
    unit)
      log_step "Unit tests"
      run_unit_tests
      ;;
    integration)
      log_step "Integration tests"
      run_integration_tests
      ;;
    e2e)
      log_step "E2E tests"
      run_e2e_tests
      ;;
    ci)
      log_step "CI test suite"
      run_ci_tests
      ;;
    *)
      log_error "Unknown mode: ${MODE}. Valid: unit | integration | e2e | ci"
      exit 1
      ;;
  esac

  print_summary
}

main "$@"