#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[$(date +%H:%M:%S)] [INFO]  ${NC}$*"; }
log_success() { echo -e "${GREEN}[$(date +%H:%M:%S)] [OK]    ${NC}$*"; }
log_warn()    { echo -e "${YELLOW}[$(date +%H:%M:%S)] [WARN]  ${NC}$*"; }
log_error()   { echo -e "${RED}[$(date +%H:%M:%S)] [ERROR] ${NC}$*" >&2; }
log_step()    { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

MODE="${1:-check}"
TARGET="${2:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIX="${FIX:-false}"
STRICT="${STRICT:-false}"

[[ "${MODE}" == "fix" ]] && FIX=true

FAILED_CHECKS=()
PASSED_CHECKS=()

run_check() {
  local name=$1; shift
  log_info "Running: ${name}"
  if "$@" 2>&1; then
    log_success "${name} passed"
    PASSED_CHECKS+=("${name}")
    return 0
  else
    log_error "${name} failed"
    FAILED_CHECKS+=("${name}")
    return 1
  fi
}

run_eslint() {
  local eslint_args=("--max-warnings" "0" "--ext" ".ts,.tsx")

  [[ "${FIX}" == "true" ]] && eslint_args+=("--fix")

  local target="${ROOT_DIR}"
  [[ -n "${TARGET}" ]] && target="${ROOT_DIR}/apps/${TARGET}"

  run_check "ESLint" \
    pnpm exec eslint "${target}" "${eslint_args[@]}"
}

run_tsc() {
  local target_filter=""
  [[ -n "${TARGET}" ]] && target_filter="--filter ${TARGET}"

  if [[ -n "${target_filter}" ]]; then
    run_check "TypeScript (${TARGET})" \
      pnpm ${target_filter} exec tsc --noEmit
  else
    run_check "TypeScript (all)" \
      pnpm exec tsc --build --noEmit tsconfig.json
  fi
}

run_prettier() {
  local prettier_cmd=("pnpm" "exec" "prettier")

  if [[ "${FIX}" == "true" ]]; then
    prettier_cmd+=("--write")
  else
    prettier_cmd+=("--check")
  fi

  local target="."
  [[ -n "${TARGET}" ]] && target="apps/${TARGET}"

  prettier_cmd+=("${target}/**/*.{ts,tsx,json,md,yaml,yml}")

  run_check "Prettier" "${prettier_cmd[@]}"
}

run_prisma_validate() {
  local schema="${ROOT_DIR}/packages/shared-db/prisma/schema.prisma"
  [[ ! -f "${schema}" ]] && { log_warn "Prisma schema not found — skipping"; return 0; }
  run_check "Prisma schema" \
    pnpm --filter "shared-db" exec prisma validate --schema "${schema}"
}

run_knip() {
  if ! pnpm exec knip --version &>/dev/null 2>&1; then
    log_warn "knip not found — skipping unused exports check"
    return 0
  fi
  run_check "Knip (unused exports)" \
    pnpm exec knip --no-exit-code 2>/dev/null || true
}

run_secretlint() {
  if ! command -v secretlint &>/dev/null && ! pnpm exec secretlint --version &>/dev/null 2>&1; then
    log_warn "secretlint not found — skipping secret detection"
    return 0
  fi
  run_check "Secretlint (secrets scan)" \
    pnpm exec secretlint "**/*" \
      --ignore-pattern "node_modules/**,dist/**,.git/**"
}

run_zod_check() {
  local zod_check_script="${ROOT_DIR}/scripts/validate-schemas.ts"
  [[ ! -f "${zod_check_script}" ]] && { log_warn "Zod schema validation script not found — skipping"; return 0; }
  run_check "Zod schemas" \
    node --loader ts-node/esm "${zod_check_script}"
}

check_env_example() {
  local env_example="${ROOT_DIR}/.env.example"
  [[ ! -f "${env_example}" ]] && { log_warn ".env.example not found — skipping"; return 0; }

  log_info "Checking .env.example for required keys..."
  local missing_keys=()
  local required_keys=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_PRIVATE_KEY_PATH"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "AWS_REGION"
    "S3_BUCKET_NAME"
    "NODE_ENV"
    "API_GATEWAY_PORT"
  )

  for key in "${required_keys[@]}"; do
    if ! grep -q "^${key}=" "${env_example}"; then
      missing_keys+=("${key}")
    fi
  done

  if [[ ${#missing_keys[@]} -gt 0 ]]; then
    log_warn ".env.example missing keys: ${missing_keys[*]}"
    [[ "${STRICT}" == "true" ]] && { FAILED_CHECKS+=("env.example keys"); return 1; }
  else
    log_success ".env.example has all required keys"
    PASSED_CHECKS+=("env.example keys")
  fi
}

check_dockerfile_lint() {
  if ! command -v hadolint &>/dev/null; then
    log_warn "hadolint not found — skipping Dockerfile linting"
    return 0
  fi

  local failed=0
  while IFS= read -r -d '' dockerfile; do
    log_info "Linting: ${dockerfile}"
    hadolint "${dockerfile}" && log_success "${dockerfile}" || { log_warn "${dockerfile} has warnings"; failed=$((failed+1)); }
  done < <(find "${ROOT_DIR}/apps" -name "Dockerfile" -print0 2>/dev/null)

  [[ ${failed} -gt 0 && "${STRICT}" == "true" ]] && { FAILED_CHECKS+=("Dockerfile lint"); return 1; }
  PASSED_CHECKS+=("Dockerfile lint")
}

check_shell_scripts() {
  if ! command -v shellcheck &>/dev/null; then
    log_warn "shellcheck not found — skipping shell script linting"
    return 0
  fi

  run_check "ShellCheck" \
    shellcheck "${ROOT_DIR}/scripts/"*.sh
}

print_summary() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  Lint summary — mode: ${MODE}${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  for check in "${PASSED_CHECKS[@]}"; do
    echo -e "  ${GREEN}✓${NC}  ${check}"
  done

  for check in "${FAILED_CHECKS[@]}"; do
    echo -e "  ${RED}✗${NC}  ${check}"
  done

  echo ""
  echo -e "  Passed: ${GREEN}${#PASSED_CHECKS[@]}${NC}  Failed: ${RED}${#FAILED_CHECKS[@]}${NC}"
  echo ""
}

main() {
  echo ""
  echo -e "${CYAN}━━━ Lomash Wood — Lint (${MODE}${TARGET:+ / ${TARGET}}) ━━━${NC}"
  echo ""

  cd "${ROOT_DIR}"

  log_step "ESLint"
  run_eslint || true

  log_step "TypeScript"
  run_tsc || true

  log_step "Prettier"
  run_prettier || true

  log_step "Prisma schema"
  run_prisma_validate || true

  log_step "Shell scripts"
  check_shell_scripts || true

  log_step "Dockerfiles"
  check_dockerfile_lint || true

  log_step "Secret detection"
  run_secretlint || true

  log_step "Environment"
  check_env_example || true

  print_summary

  [[ ${#FAILED_CHECKS[@]} -gt 0 ]] && exit 1 || exit 0
}

main "$@"