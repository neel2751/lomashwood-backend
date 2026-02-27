#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[$(date +%H:%M:%S)] [INFO]  ${NC}$*"; }
log_success() { echo -e "${GREEN}[$(date +%H:%M:%S)] [OK]    ${NC}$*"; }
log_warn()    { echo -e "${YELLOW}[$(date +%H:%M:%S)] [WARN]  ${NC}$*"; }
log_error()   { echo -e "${RED}[$(date +%H:%M:%S)] [ERROR] ${NC}$*" >&2; }
log_step()    { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

MODE="${1:-standard}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE="${FORCE:-false}"
DRY_RUN="${DRY_RUN:-false}"
REMOVED_COUNT=0
FREED_BYTES=0

VALID_MODES=("standard" "deep" "docker" "deps" "all" "cache")

validate_args() {
  local valid=false
  for m in "${VALID_MODES[@]}"; do [[ "${MODE}" == "${m}" ]] && valid=true; done
  if [[ "${valid}" == "false" ]]; then
    log_error "Invalid mode: ${MODE}. Valid: ${VALID_MODES[*]}"
    exit 1
  fi
}

confirm() {
  if [[ "${FORCE}" == "true" || "${DRY_RUN}" == "true" ]]; then return 0; fi
  echo -e "\n${YELLOW}  ⚠  $1${NC}"
  echo -n "  Type 'yes' to confirm: "
  read -r r
  [[ "${r}" != "yes" ]] && { log_info "Aborted."; exit 0; }
}

remove_path() {
  local path=$1
  local label="${2:-${path}}"

  if [[ ! -e "${path}" ]]; then return 0; fi

  local size=0
  size=$(du -sb "${path}" 2>/dev/null | cut -f1 || echo 0)

  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would remove: ${label} ($(numfmt --to=iec "${size}" 2>/dev/null || echo "${size}B"))"
    return 0
  fi

  rm -rf "${path}"
  FREED_BYTES=$((FREED_BYTES + size))
  REMOVED_COUNT=$((REMOVED_COUNT + 1))
  log_success "Removed: ${label}"
}

remove_pattern() {
  local pattern=$1
  local label="${2:-${pattern}}"
  local count=0

  while IFS= read -r -d '' path; do
    local size=0
    size=$(du -sb "${path}" 2>/dev/null | cut -f1 || echo 0)

    if [[ "${DRY_RUN}" == "true" ]]; then
      log_warn "[DRY-RUN] Would remove: ${path}"
    else
      rm -rf "${path}"
      FREED_BYTES=$((FREED_BYTES + size))
      count=$((count + 1))
    fi
  done < <(find "${ROOT_DIR}" -name "${pattern}" -not -path "*/\.git/*" -print0 2>/dev/null)

  if [[ ${count} -gt 0 ]]; then
    log_success "Removed ${count} ${label} director(ies)"
    REMOVED_COUNT=$((REMOVED_COUNT + count))
  fi
}

clean_build_artifacts() {
  log_step "Build artifacts"

  remove_pattern "dist" "dist/"
  remove_pattern "build" "build/"
  remove_pattern "*.tsbuildinfo" ".tsbuildinfo files"
  remove_pattern ".turbo" ".turbo cache"

  remove_path "${ROOT_DIR}/coverage" "coverage/"
  remove_path "${ROOT_DIR}/test-reports" "test-reports/"
  remove_path "${ROOT_DIR}/.nyc_output" ".nyc_output/"

  log_success "Build artifacts cleaned"
}

clean_cache() {
  log_step "Cache directories"

  remove_path "${ROOT_DIR}/.next" ".next/"
  remove_path "${ROOT_DIR}/.cache" ".cache/"
  remove_path "${ROOT_DIR}/.eslintcache" ".eslintcache"
  remove_path "${ROOT_DIR}/.prettier_cache" ".prettier_cache"

  remove_pattern ".next" ".next cache directories"
  remove_pattern ".cache" ".cache directories"
  remove_pattern "*.tsbuildinfo" ".tsbuildinfo files"

  if command -v pnpm &>/dev/null; then
    log_info "Clearing pnpm store cache..."
    pnpm store prune 2>/dev/null && log_success "pnpm store pruned" || log_warn "pnpm store prune failed"
  fi

  log_success "Cache cleaned"
}

clean_logs() {
  log_step "Log files"

  remove_pattern "*.log" ".log files"
  remove_pattern "npm-debug.log*" "npm debug logs"
  remove_pattern "yarn-error.log" "yarn error logs"
  remove_pattern "pnpm-debug.log*" "pnpm debug logs"

  log_success "Logs cleaned"
}

clean_temp() {
  log_step "Temp files"

  remove_pattern "*.tmp" ".tmp files"
  remove_pattern "*.temp" ".temp files"
  remove_pattern ".DS_Store" ".DS_Store files"
  remove_pattern "Thumbs.db" "Thumbs.db files"

  log_success "Temp files cleaned"
}

clean_generated() {
  log_step "Generated files"

  remove_path "${ROOT_DIR}/packages/shared-db/node_modules/.prisma" "Prisma client"
  remove_pattern "generated" "generated/ directories"

  log_success "Generated files cleaned"
}

clean_dependencies() {
  log_step "Dependencies (node_modules)"
  confirm "This will remove ALL node_modules directories. Re-install with: pnpm install"

  remove_pattern "node_modules" "node_modules"
  remove_path "${ROOT_DIR}/pnpm-lock.yaml" "pnpm-lock.yaml" 2>/dev/null || true

  log_success "Dependencies removed. Run: pnpm install"
}

clean_docker() {
  log_step "Docker resources"

  if ! command -v docker &>/dev/null; then
    log_warn "Docker not found — skipping"
    return 0
  fi

  if ! docker info &>/dev/null; then
    log_warn "Docker daemon not running — skipping"
    return 0
  fi

  log_info "Removing lomash-wood Docker images..."
  local images
  images=$(docker images --filter "label=com.lomashwood.service" -q 2>/dev/null || echo "")
  if [[ -n "${images}" ]]; then
    if [[ "${DRY_RUN}" == "true" ]]; then
      log_warn "[DRY-RUN] Would remove $(echo "${images}" | wc -l) lomash-wood images"
    else
      echo "${images}" | xargs docker rmi -f 2>/dev/null || true
      log_success "Lomash Wood Docker images removed"
    fi
  else
    log_info "No lomash-wood images found"
  fi

  log_info "Stopping test Docker compose..."
  local compose_test="${ROOT_DIR}/docker-compose.test.yml"
  local compose_dev="${ROOT_DIR}/docker-compose.dev.yml"

  [[ -f "${compose_test}" ]] && {
    [[ "${DRY_RUN}" == "true" ]] && log_warn "[DRY-RUN] Would run: docker compose down" || \
    docker compose -f "${compose_test}" down --volumes --remove-orphans 2>/dev/null || true
  }

  log_info "Pruning dangling Docker resources..."
  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would prune dangling images, containers, networks"
  else
    docker image prune -f 2>/dev/null || true
    docker container prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true
    log_success "Dangling Docker resources pruned"
  fi
}

clean_env_files() {
  log_step "Environment files"
  confirm "This will remove .env.development, .env.test, and .env.staging (NOT .env.production)"

  for env_file in "${ROOT_DIR}/.env.development" "${ROOT_DIR}/.env.test" "${ROOT_DIR}/.env.staging"; do
    remove_path "${env_file}" "$(basename "${env_file}")"
  done

  log_warn ".env.production was NOT removed (requires --force)"
  log_success "Local env files removed. Run: ./scripts/bootstrap.sh to recreate"
}

print_summary() {
  local freed_human
  freed_human=$(numfmt --to=iec "${FREED_BYTES}" 2>/dev/null || echo "${FREED_BYTES}B")

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Clean complete — mode: ${MODE}${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Mode         : ${YELLOW}${MODE}${NC}"
  echo -e "  Items removed: ${REMOVED_COUNT}"
  echo -e "  Space freed  : ${GREEN}${freed_human}${NC}"
  echo -e "  Dry-run      : ${DRY_RUN}"
  echo ""

  if [[ "${MODE}" == "deps" || "${MODE}" == "all" ]]; then
    echo -e "  ${YELLOW}Next step: pnpm install${NC}"
    echo ""
  fi
}

main() {
  echo ""
  echo -e "${CYAN}━━━ Lomash Wood — Clean (${MODE}) ━━━${NC}"
  echo ""

  validate_args
  cd "${ROOT_DIR}"

  case "${MODE}" in
    standard)
      clean_build_artifacts
      clean_logs
      clean_temp
      ;;
    cache)
      clean_cache
      ;;
    deep)
      clean_build_artifacts
      clean_cache
      clean_generated
      clean_logs
      clean_temp
      ;;
    docker)
      clean_docker
      ;;
    deps)
      clean_build_artifacts
      clean_generated
      clean_dependencies
      ;;
    all)
      clean_build_artifacts
      clean_cache
      clean_generated
      clean_logs
      clean_temp
      clean_docker
      clean_dependencies
      clean_env_files
      ;;
  esac

  print_summary
}

main "$@"