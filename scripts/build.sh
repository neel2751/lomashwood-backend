#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[$(date +%H:%M:%S)] [INFO]  ${NC}$*"; }
log_success() { echo -e "${GREEN}[$(date +%H:%M:%S)] [OK]    ${NC}$*"; }
log_warn()    { echo -e "${YELLOW}[$(date +%H:%M:%S)] [WARN]  ${NC}$*"; }
log_error()   { echo -e "${RED}[$(date +%H:%M:%S)] [ERROR] ${NC}$*" >&2; }
log_step()    { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }

TARGET="${1:-all}"
ENV="${BUILD_ENV:-production}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
GIT_SHA=$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || echo "unknown")

ECR_REGISTRY="${ECR_REGISTRY:-}"
ECR_REGION="${ECR_REGION:-eu-west-2}"
IMAGE_TAG="${IMAGE_TAG:-${GIT_SHA}}"
PUSH="${PUSH:-false}"
PARALLEL="${PARALLEL:-false}"
CACHE_FROM="${CACHE_FROM:-true}"
PLATFORM="${PLATFORM:-linux/amd64}"

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

SHARED_PACKAGES=(
  "shared-utils"
  "shared-types"
  "shared-db"
  "shared-errors"
  "shared-logger"
)

BUILT_IMAGES=()
FAILED_BUILDS=()
BUILD_START_TIME=${SECONDS}

check_prerequisites() {
  log_step "Prerequisites"
  local missing=0
  for cmd in pnpm docker node; do
    command -v "${cmd}" &>/dev/null && log_success "${cmd}: $(${cmd} --version 2>&1 | head -1)" || {
      log_error "${cmd} not found"; missing=$((missing + 1))
    }
  done
  [[ ${missing} -gt 0 ]] && exit 1

  if ! docker info &>/dev/null; then
    log_error "Docker daemon not running"
    exit 1
  fi
  log_success "Docker daemon running"

  if [[ "${PUSH}" == "true" && -z "${ECR_REGISTRY}" ]]; then
    log_error "ECR_REGISTRY must be set when PUSH=true"
    exit 1
  fi
}

ecr_login() {
  [[ "${PUSH}" != "true" ]] && return 0
  log_info "Logging in to ECR (${ECR_REGION})..."
  aws ecr get-login-password --region "${ECR_REGION}" | \
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"
  log_success "ECR login successful"
}

build_shared_packages() {
  log_info "Building ${#SHARED_PACKAGES[@]} shared package(s)..."
  for pkg in "${SHARED_PACKAGES[@]}"; do
    log_info "Building: ${pkg}"
    pnpm --filter "${pkg}" run build 2>/dev/null && \
      log_success "${pkg} built" || \
      log_warn "${pkg}: no build script — skipping"
  done
}

generate_prisma() {
  log_info "Generating Prisma client..."
  pnpm --filter "shared-db" exec prisma generate \
    --schema "${ROOT_DIR}/packages/shared-db/prisma/schema.prisma"
  log_success "Prisma client generated"
}

build_service_ts() {
  local service=$1
  local service_dir="${ROOT_DIR}/apps/${service}"

  [[ ! -d "${service_dir}" ]] && { log_warn "Service directory not found: ${service_dir}"; return 1; }

  log_info "TypeScript build: ${service}"
  pnpm --filter "${service}" run build && \
    log_success "TypeScript build complete: ${service}" || {
    log_error "TypeScript build failed: ${service}"
    return 1
  }
}

build_docker_image() {
  local service=$1
  local dockerfile="${ROOT_DIR}/apps/${service}/Dockerfile"

  if [[ ! -f "${dockerfile}" ]]; then
    log_warn "Dockerfile not found for ${service} — skipping Docker build"
    return 0
  fi

  local image_name="${service}"
  local image_tag="${IMAGE_TAG}"
  local full_image_uri="${image_name}:${image_tag}"

  if [[ -n "${ECR_REGISTRY}" ]]; then
    full_image_uri="${ECR_REGISTRY}/${image_name}:${image_tag}"
  fi

  local cache_from_args=()
  if [[ "${CACHE_FROM}" == "true" && -n "${ECR_REGISTRY}" ]]; then
    cache_from_args+=("--cache-from" "${ECR_REGISTRY}/${service}:latest")
  fi

  log_info "Building Docker image: ${full_image_uri}"

  docker build \
    -f "${dockerfile}" \
    -t "${full_image_uri}" \
    "${cache_from_args[@]}" \
    --platform "${PLATFORM}" \
    --build-arg NODE_ENV="${ENV}" \
    --build-arg BUILD_TIMESTAMP="${TIMESTAMP}" \
    --build-arg GIT_SHA="${GIT_SHA}" \
    --label "com.lomashwood.service=${service}" \
    --label "com.lomashwood.version=${IMAGE_TAG}" \
    --label "com.lomashwood.built-at=${TIMESTAMP}" \
    "${ROOT_DIR}"

  log_success "Docker image built: ${full_image_uri}"
  BUILT_IMAGES+=("${full_image_uri}")

  if [[ -n "${ECR_REGISTRY}" ]]; then
    docker tag "${full_image_uri}" "${ECR_REGISTRY}/${service}:latest"
    BUILT_IMAGES+=("${ECR_REGISTRY}/${service}:latest")
  fi
}

push_image() {
  local service=$1
  [[ "${PUSH}" != "true" ]] && return 0
  [[ -z "${ECR_REGISTRY}" ]] && return 0

  local image_uri="${ECR_REGISTRY}/${service}:${IMAGE_TAG}"
  log_info "Pushing: ${image_uri}"
  docker push "${image_uri}"
  docker push "${ECR_REGISTRY}/${service}:latest"
  log_success "Pushed: ${image_uri}"
}

build_service() {
  local service=$1

  echo ""
  echo -e "${BLUE}  ── ${service} ──${NC}"

  build_service_ts "${service}" || { FAILED_BUILDS+=("${service}:ts"); return 1; }
  build_docker_image "${service}" || { FAILED_BUILDS+=("${service}:docker"); return 1; }
  push_image "${service}" || { FAILED_BUILDS+=("${service}:push"); return 1; }

  return 0
}

build_all_sequential() {
  for service in "${SERVICES[@]}"; do
    build_service "${service}" || log_error "Build failed for: ${service}"
  done
}

build_all_parallel() {
  local pids=()
  local pid_to_service=()

  for service in "${SERVICES[@]}"; do
    build_service "${service}" &
    local pid=$!
    pids+=("${pid}")
    pid_to_service+=("${pid}:${service}")
  done

  for pid in "${pids[@]}"; do
    local service=""
    for mapping in "${pid_to_service[@]}"; do
      [[ "${mapping%%:*}" == "${pid}" ]] && service="${mapping#*:}"
    done

    wait "${pid}" && log_success "Done: ${service}" || {
      log_error "Failed: ${service}"
      FAILED_BUILDS+=("${service}")
    }
  done
}

check_image_sizes() {
  log_info "Built image sizes:"
  for img in "${BUILT_IMAGES[@]}"; do
    local size
    size=$(docker image inspect "${img}" --format '{{.Size}}' 2>/dev/null | \
      awk '{printf "%.1f MB", $1/1024/1024}' || echo "unknown")
    echo -e "  ${img}: ${CYAN}${size}${NC}"
  done
}

print_summary() {
  local elapsed=$((SECONDS - BUILD_START_TIME))

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Build complete${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Target      : ${YELLOW}${TARGET}${NC}"
  echo -e "  Image tag   : ${YELLOW}${IMAGE_TAG}${NC}"
  echo -e "  Git SHA     : ${GIT_SHA}"
  echo -e "  Environment : ${ENV}"
  echo -e "  Duration    : ${elapsed}s"
  echo -e "  Pushed      : ${PUSH}"

  if [[ ${#FAILED_BUILDS[@]} -gt 0 ]]; then
    echo ""
    echo -e "  ${RED}Failed builds:${NC}"
    for f in "${FAILED_BUILDS[@]}"; do echo -e "  ${RED}✗${NC}  ${f}"; done
  fi

  echo ""
}

main() {
  echo ""
  echo -e "${BLUE}━━━ Lomash Wood — Build (${TARGET} / ${IMAGE_TAG}) ━━━${NC}"
  echo ""
  log_info "Git SHA: ${GIT_SHA} | Env: ${ENV} | Push: ${PUSH} | Platform: ${PLATFORM}"
  echo ""

  check_prerequisites
  ecr_login

  log_step "Shared packages"
  build_shared_packages
  generate_prisma

  case "${TARGET}" in
    all)
      log_step "Building all services"
      if [[ "${PARALLEL}" == "true" ]]; then
        build_all_parallel
      else
        build_all_sequential
      fi
      ;;
    shared)
      log_step "Shared packages only"
      log_success "Shared packages already built above"
      ;;
    *)
      local valid=false
      for svc in "${SERVICES[@]}"; do [[ "${TARGET}" == "${svc}" ]] && valid=true; done
      if [[ "${valid}" == "true" ]]; then
        log_step "Building: ${TARGET}"
        build_service "${TARGET}"
      else
        log_error "Unknown target: ${TARGET}. Valid: all | shared | ${SERVICES[*]}"
        exit 1
      fi
      ;;
  esac

  if [[ ${#BUILT_IMAGES[@]} -gt 0 ]]; then
    log_step "Image sizes"
    check_image_sizes
  fi

  print_summary

  [[ ${#FAILED_BUILDS[@]} -gt 0 ]] && exit 1 || exit 0
}

main "$@"