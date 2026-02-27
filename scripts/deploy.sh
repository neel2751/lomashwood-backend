#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[$(date +%H:%M:%S)] [INFO]  ${NC}$*"; }
log_success() { echo -e "${GREEN}[$(date +%H:%M:%S)] [OK]    ${NC}$*"; }
log_warn()    { echo -e "${YELLOW}[$(date +%H:%M:%S)] [WARN]  ${NC}$*"; }
log_error()   { echo -e "${RED}[$(date +%H:%M:%S)] [ERROR] ${NC}$*" >&2; }
log_step()    { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }

ENV="${1:-staging}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.${ENV}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
DEPLOY_LOG="/var/log/lomash-wood/deploy-${TIMESTAMP}.log"

ECR_REGISTRY="${ECR_REGISTRY:-}"
ECR_REGION="${ECR_REGION:-eu-west-2}"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || echo "latest")}"
K8S_NAMESPACE="lomash-wood-${ENV}"
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-600}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"

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

FORCE="${FORCE:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_MIGRATE="${SKIP_MIGRATE:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
TARGET_SERVICE="${TARGET_SERVICE:-}"

cleanup() {
  local exit_code=$?
  [[ ${exit_code} -ne 0 ]] && log_error "Deployment failed with exit code ${exit_code}. Log: ${DEPLOY_LOG}"
}
trap cleanup EXIT

setup_logging() {
  mkdir -p "$(dirname "${DEPLOY_LOG}")" 2>/dev/null || DEPLOY_LOG="/tmp/lomash-deploy-${TIMESTAMP}.log"
  exec > >(tee -a "${DEPLOY_LOG}") 2>&1
}

load_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    set -a
    source "${ENV_FILE}"
    set +a
    log_success "Loaded ${ENV_FILE}"
  fi

  ECR_REGISTRY="${ECR_REGISTRY:-}"
  if [[ -z "${ECR_REGISTRY}" ]]; then
    log_error "ECR_REGISTRY is not set. Export it or add to ${ENV_FILE}"
    exit 1
  fi
}

check_prerequisites() {
  log_step "Prerequisites"
  local missing=0
  for cmd in aws kubectl docker pnpm git; do
    command -v "${cmd}" &>/dev/null && log_success "${cmd} found" || { log_error "${cmd} not found"; missing=$((missing+1)); }
  done
  [[ ${missing} -gt 0 ]] && exit 1

  aws sts get-caller-identity &>/dev/null && \
    log_success "AWS: $(aws sts get-caller-identity --query Arn --output text)" || \
    { log_error "AWS credentials invalid"; exit 1; }

  kubectl cluster-info &>/dev/null && log_success "Kubernetes cluster reachable" || \
    { log_error "kubectl cannot reach cluster"; exit 1; }

  kubectl get namespace "${K8S_NAMESPACE}" &>/dev/null && \
    log_success "Namespace: ${K8S_NAMESPACE}" || \
    { log_error "Namespace ${K8S_NAMESPACE} not found"; exit 1; }
}

confirm_production() {
  if [[ "${ENV}" != "production" || "${FORCE}" == "true" ]]; then return 0; fi
  echo ""
  echo -e "${RED}  ⚠  PRODUCTION DEPLOYMENT${NC}"
  echo -e "${RED}  Image tag : ${IMAGE_TAG}${NC}"
  echo -e "${RED}  Namespace : ${K8S_NAMESPACE}${NC}"
  echo ""
  echo -n "  Type 'deploy-production' to confirm: "
  read -r confirm
  [[ "${confirm}" != "deploy-production" ]] && { log_info "Aborted."; exit 0; }
}

run_pre_deploy_tests() {
  [[ "${SKIP_TESTS}" == "true" ]] && { log_warn "Skipping tests (SKIP_TESTS=true)"; return 0; }
  log_info "Running pre-deploy tests..."
  bash "${ROOT_DIR}/scripts/test.sh" ci || { log_error "Tests failed — aborting deployment"; exit 1; }
  log_success "Tests passed"
}

ecr_login() {
  log_info "Logging in to ECR (${ECR_REGION})..."
  aws ecr get-login-password --region "${ECR_REGION}" | \
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"
  log_success "ECR login successful"
}

build_and_push() {
  [[ "${SKIP_BUILD}" == "true" ]] && { log_warn "Skipping build (SKIP_BUILD=true)"; return 0; }

  local services_to_build=("${SERVICES[@]}")
  [[ -n "${TARGET_SERVICE}" ]] && services_to_build=("${TARGET_SERVICE}")

  log_info "Building and pushing ${#services_to_build[@]} image(s) with tag: ${IMAGE_TAG}"

  for service in "${services_to_build[@]}"; do
    local dockerfile="${ROOT_DIR}/apps/${service}/Dockerfile"
    local image_uri="${ECR_REGISTRY}/${service}:${IMAGE_TAG}"

    if [[ ! -f "${dockerfile}" ]]; then
      log_warn "Dockerfile not found for ${service} at ${dockerfile} — skipping"
      continue
    fi

    log_info "Building: ${service}"
    docker build \
      -f "${dockerfile}" \
      -t "${image_uri}" \
      --build-arg NODE_ENV="${ENV}" \
      --build-arg BUILD_TIMESTAMP="${TIMESTAMP}" \
      --build-arg GIT_SHA="${IMAGE_TAG}" \
      --cache-from "${image_uri}:latest" \
      "${ROOT_DIR}"

    log_info "Pushing: ${image_uri}"
    docker push "${image_uri}"
    docker tag "${image_uri}" "${ECR_REGISTRY}/${service}:latest"
    docker push "${ECR_REGISTRY}/${service}:latest"

    log_success "Pushed: ${image_uri}"
  done
}

run_migrations() {
  [[ "${SKIP_MIGRATE}" == "true" ]] && { log_warn "Skipping migrations (SKIP_MIGRATE=true)"; return 0; }
  log_info "Running database migrations..."
  bash "${ROOT_DIR}/scripts/migrate.sh" "${ENV}" deploy
  log_success "Migrations complete"
}

deploy_services() {
  local services_to_deploy=("${SERVICES[@]}")
  [[ -n "${TARGET_SERVICE}" ]] && services_to_deploy=("${TARGET_SERVICE}")

  for service in "${services_to_deploy[@]}"; do
    local image_uri="${ECR_REGISTRY}/${service}:${IMAGE_TAG}"

    log_info "Deploying: ${service} (${IMAGE_TAG})"

    kubectl set image "deployment/${service}" \
      "${service}=${image_uri}" \
      --namespace "${K8S_NAMESPACE}" 2>/dev/null || {
      log_warn "Deployment ${service} not found — attempting kubectl apply"
      apply_helm_chart "${service}"
      continue
    }

    kubectl annotate deployment "${service}" \
      --namespace "${K8S_NAMESPACE}" \
      "deployment.kubernetes.io/revision=$(date +%s)" \
      "lomash-wood/deployed-at=${TIMESTAMP}" \
      "lomash-wood/image-tag=${IMAGE_TAG}" \
      --overwrite

    log_success "Image updated for ${service}"
  done
}

apply_helm_chart() {
  local service=$1
  local chart_dir="${ROOT_DIR}/infra/helm/${service}"

  if [[ ! -d "${chart_dir}" ]]; then
    log_warn "Helm chart not found for ${service} at ${chart_dir}"
    return 0
  fi

  helm upgrade --install "${service}" "${chart_dir}" \
    --namespace "${K8S_NAMESPACE}" \
    --set "image.repository=${ECR_REGISTRY}/${service}" \
    --set "image.tag=${IMAGE_TAG}" \
    --set "environment=${ENV}" \
    --wait \
    --timeout "${ROLLOUT_TIMEOUT}s"

  log_success "Helm chart applied for ${service}"
}

wait_for_rollouts() {
  local services_to_watch=("${SERVICES[@]}")
  [[ -n "${TARGET_SERVICE}" ]] && services_to_watch=("${TARGET_SERVICE}")

  log_info "Waiting for rollouts to complete (timeout: ${ROLLOUT_TIMEOUT}s each)..."

  local failed=0
  for service in "${services_to_watch[@]}"; do
    kubectl rollout status "deployment/${service}" \
      --namespace "${K8S_NAMESPACE}" \
      --timeout "${ROLLOUT_TIMEOUT}s" 2>/dev/null && \
      log_success "Rollout complete: ${service}" || {
      log_error "Rollout failed or timed out: ${service}"
      failed=$((failed + 1))
    }
  done

  if [[ ${failed} -gt 0 ]]; then
    log_error "${failed} deployment(s) failed rollout"
    exit 1
  fi
}

run_health_checks() {
  local services_to_check=("${SERVICES[@]}")
  [[ -n "${TARGET_SERVICE}" ]] && services_to_check=("${TARGET_SERVICE}")

  log_info "Running health checks..."

  local failed=0
  for service in "${services_to_check[@]}"; do
    local running_pods
    running_pods=$(kubectl get pods \
      --namespace "${K8S_NAMESPACE}" \
      --selector "app=${service}" \
      --field-selector "status.phase=Running" \
      --no-headers 2>/dev/null | wc -l | tr -d ' ')

    local total_pods
    total_pods=$(kubectl get pods \
      --namespace "${K8S_NAMESPACE}" \
      --selector "app=${service}" \
      --no-headers 2>/dev/null | wc -l | tr -d ' ')

    if [[ "${running_pods}" -gt 0 && "${running_pods}" == "${total_pods}" ]]; then
      log_success "${service}: ${running_pods}/${total_pods} pods running"
    else
      log_error "${service}: ${running_pods}/${total_pods} pods running"
      failed=$((failed + 1))
    fi
  done

  if [[ ${failed} -gt 0 ]]; then
    log_error "${failed} service(s) failed health checks"
    log_info "To rollback: ./scripts/rollback.sh ${ENV}"
    exit 1
  fi
}

tag_release() {
  if ! git -C "${ROOT_DIR}" rev-parse --is-inside-work-tree &>/dev/null; then
    return 0
  fi

  local tag="deploy/${ENV}/${TIMESTAMP}"
  git -C "${ROOT_DIR}" tag "${tag}" 2>/dev/null || true
  log_info "Git tag: ${tag}"
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Deployment successful${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Environment  : ${YELLOW}${ENV}${NC}"
  echo -e "  Image tag    : ${YELLOW}${IMAGE_TAG}${NC}"
  echo -e "  Namespace    : ${K8S_NAMESPACE}"
  echo -e "  Timestamp    : ${TIMESTAMP}"
  echo -e "  Log          : ${DEPLOY_LOG}"
  echo ""
  echo -e "  To rollback  : ${CYAN}./scripts/rollback.sh ${ENV}${NC}"
  echo ""
}

main() {
  setup_logging

  echo ""
  echo -e "${BLUE}━━━ Lomash Wood — Deploy (${ENV} / ${IMAGE_TAG}) ━━━${NC}"
  echo ""

  load_env
  check_prerequisites
  confirm_production

  log_step "Pre-deploy tests"
  run_pre_deploy_tests

  log_step "ECR login"
  ecr_login

  log_step "Build & push images"
  build_and_push

  log_step "Migrations"
  run_migrations

  log_step "Deploy services"
  deploy_services

  log_step "Rollout status"
  wait_for_rollouts

  log_step "Health checks"
  run_health_checks

  tag_release
  print_summary
}

main "$@"