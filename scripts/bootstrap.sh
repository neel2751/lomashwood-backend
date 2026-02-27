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
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.${ENV}"
ENV_EXAMPLE="${ROOT_DIR}/.env.example"
MIN_NODE_VERSION=20
MIN_PNPM_VERSION=8

check_tool() {
  local cmd=$1 install_hint=$2
  if ! command -v "${cmd}" &>/dev/null; then
    log_error "${cmd} not found. ${install_hint}"
    return 1
  fi
  log_success "${cmd}: $(${cmd} --version 2>&1 | head -1)"
}

check_node_version() {
  local version
  version=$(node -e "process.stdout.write(process.version.replace('v','').split('.')[0])")
  if [[ "${version}" -lt "${MIN_NODE_VERSION}" ]]; then
    log_error "Node.js v${MIN_NODE_VERSION}+ required (found v${version}). Use nvm: nvm install ${MIN_NODE_VERSION}"
    exit 1
  fi
}

check_pnpm_version() {
  local version
  version=$(pnpm --version | cut -d. -f1)
  if [[ "${version}" -lt "${MIN_PNPM_VERSION}" ]]; then
    log_error "pnpm v${MIN_PNPM_VERSION}+ required (found v${version}). Run: npm install -g pnpm"
    exit 1
  fi
}

setup_env_file() {
  if [[ -f "${ENV_FILE}" ]]; then
    log_warn ".env.${ENV} already exists — skipping copy"
    return 0
  fi
  if [[ ! -f "${ENV_EXAMPLE}" ]]; then
    log_error ".env.example not found at ${ENV_EXAMPLE}"
    exit 1
  fi
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
  log_success "Created ${ENV_FILE} from .env.example"
  log_warn "Review and populate ${ENV_FILE} with real values before proceeding"
}

install_dependencies() {
  log_info "Installing dependencies with pnpm..."
  if ! pnpm install --frozen-lockfile; then
    log_warn "Frozen lockfile install failed; retrying without --frozen-lockfile"
    pnpm install --no-frozen-lockfile
  fi
  log_success "Dependencies installed"
}

generate_prisma_client() {
  log_info "Generating Prisma client..."
  pnpm --filter "shared-db" exec prisma generate
  log_success "Prisma client generated"
}

check_docker_services() {
  if ! command -v docker &>/dev/null; then
    log_warn "Docker not found — skipping local service startup"
    return 0
  fi

  if ! docker info &>/dev/null; then
    log_warn "Docker daemon not running — skipping local service startup"
    return 0
  fi

  local compose_file="${ROOT_DIR}/docker-compose.dev.yml"
  if [[ ! -f "${compose_file}" ]]; then
    log_warn "docker-compose.dev.yml not found — skipping"
    return 0
  fi

  log_info "Starting local Docker services (PostgreSQL, Redis)..."
  docker compose -f "${compose_file}" up -d --wait
  log_success "Local services running"
}

wait_for_postgres() {
  local host="${POSTGRES_HOST:-localhost}"
  local port="${POSTGRES_PORT:-5432}"
  local max_attempts=30
  local attempt=0

  log_info "Waiting for PostgreSQL at ${host}:${port}..."
  until pg_isready -h "${host}" -p "${port}" -q 2>/dev/null || [[ ${attempt} -ge ${max_attempts} ]]; do
    attempt=$((attempt + 1))
    sleep 1
  done

  if [[ ${attempt} -ge ${max_attempts} ]]; then
    log_warn "PostgreSQL not reachable after ${max_attempts}s — skipping DB setup"
    return 1
  fi

  log_success "PostgreSQL is ready"
}

run_migrations() {
  log_info "Running database migrations..."
  bash "${ROOT_DIR}/scripts/migrate.sh" "${ENV}" || {
    log_warn "Migrations failed — run manually: ./scripts/migrate.sh ${ENV}"
  }
}

setup_git_hooks() {
  if ! command -v git &>/dev/null; then
    log_warn "git not found — skipping hook setup"
    return 0
  fi

  if [[ ! -d "${ROOT_DIR}/.git" ]]; then
    log_warn "Not a git repository — skipping hook setup"
    return 0
  fi

  log_info "Setting up git hooks via husky..."
  pnpm exec husky install 2>/dev/null || log_warn "husky not found — skipping git hooks"
  log_success "Git hooks installed"
}

build_shared_packages() {
  log_info "Building shared packages..."
  pnpm --filter "shared-*" run build 2>/dev/null || log_warn "No shared package build scripts found"
  log_success "Shared packages built"
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Bootstrap complete — environment: ${ENV}${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Next steps:"
  echo -e "  1. Review and update ${ENV_FILE}"
  echo -e "  2. Run: pnpm dev                  (start all services)"
  echo -e "  3. Run: ./scripts/seed.sh ${ENV}     (seed database)"
  echo -e "  4. Run: ./scripts/test.sh          (run test suite)"
  echo ""
}

main() {
  echo ""
  echo -e "${CYAN}━━━ Lomash Wood — Bootstrap (${ENV}) ━━━${NC}"
  echo ""

  cd "${ROOT_DIR}"

  log_step "Tool checks"
  check_tool "node"   "Install via nvm: https://github.com/nvm-sh/nvm"
  check_tool "pnpm"   "npm install -g pnpm"
  if ! check_tool "docker" "https://docs.docker.com/get-docker"; then
    log_warn "docker not found — continuing without starting local Docker services"
  fi
  check_node_version
  check_pnpm_version

  log_step "Environment"
  setup_env_file

  if [[ -f "${ENV_FILE}" ]]; then
    set -a
    source "${ENV_FILE}"
    set +a
  fi

  log_step "Dependencies"
  install_dependencies

  log_step "Shared packages"
  build_shared_packages

  log_step "Prisma"
  generate_prisma_client

  log_step "Docker services"
  check_docker_services

  log_step "Database"
  wait_for_postgres && run_migrations || true

  log_step "Git hooks"
  setup_git_hooks

  print_summary
}

main "$@"