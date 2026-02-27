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
TARGET_SERVICE="${2:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.${ENV}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
K8S_NAMESPACE="lomash-wood-${ENV}"
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-300}"
FORCE="${FORCE:-false}"

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
  [[ -f "${ENV_FILE}" ]] && { set -a; source "${ENV_FILE}"; set +a; }
}

check_prerequisites() {
  log_step "Prerequisites"
  for cmd in kubectl aws; do
    command -v "${cmd}" &>/dev/null && log_success "${cmd} found" || { log_error "${cmd} not found"; exit 1; }
  done
  kubectl cluster-info &>/dev/null && log_success "Kubernetes cluster reachable" || { log_error "Cannot reach cluster"; exit 1; }
}

confirm_rollback() {
  if [[ "${FORCE}" == "true" ]]; then return 0; fi
  echo ""
  echo -e "${RED}  ⚠  ROLLBACK — ${ENV}${NC}"
  [[ -n "${TARGET_SERVICE}" ]] && echo -e "${RED}  Service: ${TARGET_SERVICE}${NC}" || echo -e "${RED}  Scope: ALL SERVICES${NC}"
  echo ""
  echo -n "  Type 'rollback' to confirm: "
  read -r confirm
  [[ "${confirm}" != "rollback" ]] && { log_info "Aborted."; exit 0; }
}

get_revision_history() {
  local service=$1
  log_info "Revision history for ${service}:"
  kubectl rollout history "deployment/${service}" \
    --namespace "${K8S_NAMESPACE}" 2>/dev/null || log_warn "No history found for ${service}"
}

get_current_image() {
  local service=$1
  kubectl get deployment "${service}" \
    --namespace "${K8S_NAMESPACE}" \
    -o jsonpath="{.spec.template.spec.containers[0].image}" 2>/dev/null || echo "unknown"
}

get_previous_revision() {
  local service=$1
  kubectl rollout history "deployment/${service}" \
    --namespace "${K8S_NAMESPACE}" \
    --output json 2>/dev/null | \
    jq -r '.items[-2].metadata.annotations["deployment.kubernetes.io/revision"] // empty' 2>/dev/null || echo ""
}

rollback_service() {
  local service=$1

  local current_image
  current_image=$(get_current_image "${service}")
  log_info "Current image: ${current_image}"

  get_revision_history "${service}"

  log_info "Rolling back: ${service}..."
  kubectl rollout undo "deployment/${service}" \
    --namespace "${K8S_NAMESPACE}" 2>/dev/null || {
    log_error "Failed to roll back ${service}"
    return 1
  }

  log_info "Waiting for rollback to complete..."
  kubectl rollout status "deployment/${service}" \
    --namespace "${K8S_NAMESPACE}" \
    --timeout "${ROLLOUT_TIMEOUT}s" || {
    log_error "Rollback rollout failed for ${service}"
    return 1
  }

  local new_image
  new_image=$(get_current_image "${service}")
  log_success "Rolled back: ${service}"
  log_info "  Previous: ${current_image}"
  log_info "  Restored: ${new_image}"

  kubectl annotate deployment "${service}" \
    --namespace "${K8S_NAMESPACE}" \
    "lomash-wood/rolled-back-at=${TIMESTAMP}" \
    "lomash-wood/rolled-back-from=${current_image}" \
    --overwrite 2>/dev/null || true
}

rollback_to_revision() {
  local service=$1
  local revision=$2

  log_info "Rolling ${service} back to revision ${revision}..."
  kubectl rollout undo "deployment/${service}" \
    --namespace "${K8S_NAMESPACE}" \
    --to-revision="${revision}"

  kubectl rollout status "deployment/${service}" \
    --namespace "${K8S_NAMESPACE}" \
    --timeout "${ROLLOUT_TIMEOUT}s"

  log_success "Rolled back ${service} to revision ${revision}"
}

run_health_checks() {
  local services_to_check=("${SERVICES[@]}")
  [[ -n "${TARGET_SERVICE}" ]] && services_to_check=("${TARGET_SERVICE}")

  log_info "Post-rollback health checks..."
  local failed=0

  for service in "${services_to_check[@]}"; do
    local running_pods
    running_pods=$(kubectl get pods \
      --namespace "${K8S_NAMESPACE}" \
      --selector "app=${service}" \
      --field-selector "status.phase=Running" \
      --no-headers 2>/dev/null | wc -l | tr -d ' ')

    if [[ "${running_pods}" -gt 0 ]]; then
      log_success "${service}: ${running_pods} pod(s) running"
    else
      log_error "${service}: no running pods after rollback"
      failed=$((failed + 1))
    fi
  done

  [[ ${failed} -gt 0 ]] && log_error "${failed} service(s) failed post-rollback health check"
}

print_current_state() {
  log_step "Current deployment state (${K8S_NAMESPACE})"
  kubectl get deployments \
    --namespace "${K8S_NAMESPACE}" \
    -o wide 2>/dev/null || log_warn "Could not retrieve deployment state"
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Rollback complete${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Environment : ${YELLOW}${ENV}${NC}"
  echo -e "  Timestamp   : ${TIMESTAMP}"
  echo ""
  echo -e "  ${YELLOW}Post-rollback actions:${NC}"
  echo -e "  • Monitor Grafana dashboards for error rates"
  echo -e "  • Check Loki for service logs"
  echo -e "  • Notify team in #deployments Slack channel"
  echo -e "  • Investigate root cause before re-deploying"
  echo ""
}

main() {
  echo ""
  echo -e "${RED}━━━ Lomash Wood — Rollback (${ENV}) ━━━${NC}"
  echo ""

  load_env
  check_prerequisites
  confirm_rollback

  local services_to_rollback=("${SERVICES[@]}")
  [[ -n "${TARGET_SERVICE}" ]] && services_to_rollback=("${TARGET_SERVICE}")

  log_step "Rolling back ${#services_to_rollback[@]} service(s)"
  local failed=0

  for service in "${services_to_rollback[@]}"; do
    echo ""
    rollback_service "${service}" || failed=$((failed + 1))
  done

  log_step "Health checks"
  run_health_checks

  log_step "Current state"
  print_current_state

  print_summary

  [[ ${failed} -gt 0 ]] && exit 1 || exit 0
}

main "$@"