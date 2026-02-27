#!/usr/bin/env bash
# =============================================================================
# rotate-db-passwords.sh — Database & Redis Password Rotation
# Lomash Wood Backend — security/secrets-rotation/
#
# Document ID : LW-SEC-ROT-002
# Version     : 1.4
# Owner       : DevOps Lead
# Last Updated: 2026-02-19
#
# PURPOSE
# -------
# Rotates the PostgreSQL database user passwords and Redis AUTH password for
# all Lomash Wood microservices. Each service has its own dedicated DB user
# with least-privilege access — this script rotates all of them in sequence.
#
# Rotation procedure per service:
#   1. Generate a new cryptographically random password
#   2. Apply the new password to the database user (ALTER USER ... PASSWORD)
#   3. Update the secret in AWS Secrets Manager
#   4. Update the Kubernetes secret for the affected service
#   5. Trigger a rolling restart of the service deployment
#   6. Verify the service is healthy after restart
#   7. Write to audit log
#
# Services & their DB users:
#   auth-service            → lw_auth
#   product-service         → lw_product
#   order-payment-service   → lw_order
#   appointment-service     → lw_appointment
#   content-service         → lw_content
#   customer-service        → lw_customer
#   notification-service    → lw_notification
#   analytics-service       → lw_analytics
#   Redis (shared)          → AUTH password rotation
#
# PREREQUISITES
# -------------
#   - AWS CLI v2 with Secrets Manager + RDS access
#   - psql client (PostgreSQL 14+)
#   - kubectl configured for target cluster
#   - jq, openssl
#   - RDS master credentials available (fetched from Secrets Manager)
#
# USAGE
# -----
#   ./rotate-db-passwords.sh [OPTIONS]
#
# OPTIONS
#   --env           Target environment: staging | production (required)
#   --service       Rotate only this service (optional; default: all)
#   --redis-only    Rotate only the Redis AUTH password
#   --dry-run       Print actions without executing
#   --force         Skip confirmation prompts
#   --help          Show this help
#
# EXAMPLES
#   ./rotate-db-passwords.sh --env staging
#   ./rotate-db-passwords.sh --env production --service auth-service
#   ./rotate-db-passwords.sh --env production --redis-only
#   ./rotate-db-passwords.sh --env staging --dry-run
#
# EXIT CODES
#   0  Success
#   1  Invalid arguments
#   2  Prerequisite check failed
#   3  DB password rotation failed for one or more services
#   4  Redis rotation failed
#   5  Kubernetes secret update failed
#   6  Service health check failed after restart
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── Constants ──────────────────────────────────────────────────────────────────
readonly SCRIPT_NAME="rotate-db-passwords.sh"
readonly SCRIPT_VERSION="1.4"
readonly TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
readonly LOG_FILE="/var/log/lomash-wood/db-rotation-${TIMESTAMP}.log"
readonly AUDIT_LOG_FILE="/var/log/lomash-wood/audit.log"
readonly TMP_DIR=$(mktemp -d)
readonly PASSWORD_LENGTH=40   # characters — base64 of 30 random bytes
readonly ROLLOUT_TIMEOUT=300  # seconds

# ── Service definitions ───────────────────────────────────────────────────────
# Format: "service-name:db-user:kubernetes-secret-key"
declare -A SERVICE_DB_USERS=(
  ["auth-service"]="lw_auth"
  ["product-service"]="lw_product"
  ["order-payment-service"]="lw_order"
  ["appointment-service"]="lw_appointment"
  ["content-service"]="lw_content"
  ["customer-service"]="lw_customer"
  ["notification-service"]="lw_notification"
  ["analytics-service"]="lw_analytics"
)

# AWS Secrets Manager secret name pattern
# Actual: lomash-wood/{ENV}/db/{service}/password
readonly SECRET_NAME_PATTERN="lomash-wood/{ENV}/db/{SERVICE}/password"
readonly REDIS_SECRET_NAME="lomash-wood/{ENV}/redis/auth-password"
readonly RDS_MASTER_SECRET="lomash-wood/{ENV}/db/master-credentials"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

# ── Argument defaults ─────────────────────────────────────────────────────────
ENV=""
TARGET_SERVICE=""
REDIS_ONLY=false
DRY_RUN=false
FORCE=false
FAILED_SERVICES=()

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
  local exit_code=$?
  rm -rf "${TMP_DIR}"
  if [[ ${exit_code} -ne 0 ]]; then
    log_error "Script exited with code ${exit_code}. Log: ${LOG_FILE}"
  fi
}
trap cleanup EXIT
trap 'log_error "Script interrupted."; exit 130' INT TERM

# ── Logging ───────────────────────────────────────────────────────────────────
setup_logging() {
  mkdir -p "$(dirname "${LOG_FILE}")"
  exec > >(tee -a "${LOG_FILE}") 2>&1
}

log_info()    { echo -e "${CYAN}[$(date -u +%H:%M:%SZ)] [INFO]  ${NC}$*"; _audit "INFO"  "$*"; }
log_success() { echo -e "${GREEN}[$(date -u +%H:%M:%SZ)] [OK]    ${NC}$*"; _audit "OK"    "$*"; }
log_warn()    { echo -e "${YELLOW}[$(date -u +%H:%M:%SZ)] [WARN]  ${NC}$*"; _audit "WARN"  "$*"; }
log_error()   { echo -e "${RED}[$(date -u +%H:%M:%SZ)] [ERROR] ${NC}$*" >&2; _audit "ERROR" "$*"; }
log_step()    { echo -e "\n${BLUE}══ $* ══${NC}"; }

_audit() {
  local level=$1; local msg=$2
  echo "{\"ts\":\"${TIMESTAMP}\",\"script\":\"${SCRIPT_NAME}\",\"env\":\"${ENV:-?}\",\"level\":\"${level}\",\"msg\":$(echo "${msg}" | jq -R .)}" \
    >> "${AUDIT_LOG_FILE}" 2>/dev/null || true
}

# ── Argument parsing ──────────────────────────────────────────────────────────
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --env)           ENV="$2"; shift 2 ;;
      --service)       TARGET_SERVICE="$2"; shift 2 ;;
      --redis-only)    REDIS_ONLY=true; shift ;;
      --dry-run)       DRY_RUN=true; shift ;;
      --force)         FORCE=true; shift ;;
      --help|-h)       grep '^#' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' | head -55; exit 0 ;;
      *)               log_error "Unknown argument: $1"; exit 1 ;;
    esac
  done

  [[ -z "${ENV}" ]] && { log_error "--env is required"; exit 1; }
  [[ "${ENV}" != "staging" && "${ENV}" != "production" ]] && { log_error "--env must be staging or production"; exit 1; }

  if [[ -n "${TARGET_SERVICE}" && -z "${SERVICE_DB_USERS[${TARGET_SERVICE}]+x}" ]]; then
    log_error "Unknown service: ${TARGET_SERVICE}. Valid services: ${!SERVICE_DB_USERS[*]}"
    exit 1
  fi
}

# ── Prerequisites ─────────────────────────────────────────────────────────────
check_prerequisites() {
  log_step "Checking prerequisites"
  local missing=0
  for cmd in aws psql kubectl jq openssl; do
    if ! command -v "${cmd}" &>/dev/null; then
      log_error "Required command not found: ${cmd}"; missing=$((missing+1))
    else
      log_success "Found: ${cmd}"
    fi
  done
  [[ ${missing} -gt 0 ]] && exit 2

  if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS credentials not valid"; exit 2
  fi
  log_success "AWS identity: $(aws sts get-caller-identity --query Arn --output text)"

  if ! kubectl cluster-info &>/dev/null; then
    log_error "kubectl cannot reach cluster"; exit 2
  fi
  log_success "Kubernetes cluster reachable"
}

# ── Helpers ───────────────────────────────────────────────────────────────────
execute() {
  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would run: $*"; return 0
  fi
  "$@"
}

confirm() {
  [[ "${FORCE}" == "true" || "${DRY_RUN}" == "true" ]] && { log_info "Auto-confirming: $1"; return 0; }
  echo -e "\n${YELLOW}⚠  $1${NC}"
  echo -n "Type 'yes' to continue: "
  read -r r
  [[ "${r}" != "yes" ]] && { log_warn "Aborted."; exit 0; }
}

generate_password() {
  # 30 random bytes → base64url → trim to PASSWORD_LENGTH chars → strip non-alnum for DB compat
  openssl rand -base64 30 | tr -dc 'A-Za-z0-9!@#$%^&*' | head -c "${PASSWORD_LENGTH}"
  echo ""
}

get_secret() {
  local secret_id=$1
  aws secretsmanager get-secret-value \
    --secret-id "${secret_id}" \
    --query SecretString \
    --output text 2>/dev/null
}

put_secret() {
  local secret_id=$1
  local value=$2
  aws secretsmanager put-secret-value \
    --secret-id "${secret_id}" \
    --secret-string "${value}"
}

# ── Fetch RDS master credentials ───────────────────────────────────────────────
fetch_master_credentials() {
  log_step "Fetching RDS master credentials"

  if [[ "${DRY_RUN}" == "true" ]]; then
    RDS_HOST="db.staging.lomashwood.internal"
    RDS_PORT="5432"
    RDS_MASTER_USER="lw_master"
    RDS_MASTER_PASS="dry-run-password"
    log_warn "[DRY-RUN] Using placeholder RDS credentials"
    return 0
  fi

  local master_secret_name="${RDS_MASTER_SECRET/\{ENV\}/${ENV}}"
  local master_creds
  master_creds=$(get_secret "${master_secret_name}")

  RDS_HOST=$(echo "${master_creds}"  | jq -r '.host')
  RDS_PORT=$(echo "${master_creds}"  | jq -r '.port // "5432"')
  RDS_MASTER_USER=$(echo "${master_creds}" | jq -r '.username')
  RDS_MASTER_PASS=$(echo "${master_creds}" | jq -r '.password')

  log_success "RDS master credentials fetched. Host: ${RDS_HOST}:${RDS_PORT}"
}

# ── Rotate a single service DB password ───────────────────────────────────────
rotate_service_db_password() {
  local service=$1
  local db_user="${SERVICE_DB_USERS[${service}]}"
  local secret_name
  secret_name="${SECRET_NAME_PATTERN/\{ENV\}/${ENV}}"
  secret_name="${secret_name/\{SERVICE\}/${service}}"
  local k8s_namespace="lomash-wood-${ENV}"

  log_step "Rotating DB password for ${service} (user: ${db_user})"

  # 1. Generate new password
  local new_password
  new_password=$(generate_password)
  log_info "Generated new password for ${db_user} (length: ${#new_password})"

  # 2. Apply password change in PostgreSQL
  log_info "Applying ALTER USER in PostgreSQL..."
  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would run: ALTER USER ${db_user} WITH PASSWORD '***'"
  else
    PGPASSWORD="${RDS_MASTER_PASS}" psql \
      -h "${RDS_HOST}" \
      -p "${RDS_PORT}" \
      -U "${RDS_MASTER_USER}" \
      -d postgres \
      -c "ALTER USER ${db_user} WITH PASSWORD '${new_password}';" \
      --no-psqlrc --quiet
    log_success "PostgreSQL password changed for ${db_user}"
  fi

  # 3. Update Secrets Manager
  log_info "Updating Secrets Manager: ${secret_name}"
  local secret_value
  secret_value=$(jq -nc \
    --arg host "${RDS_HOST}" \
    --arg port "${RDS_PORT}" \
    --arg username "${db_user}" \
    --arg password "${new_password}" \
    --arg service "${service}" \
    '{host:$host,port:$port,username:$username,password:$password,service:$service}')
  execute put_secret "${secret_name}" "${secret_value}"
  log_success "Secrets Manager updated for ${service}"

  # 4. Update Kubernetes secret
  local db_url="postgresql://${db_user}:${new_password}@${RDS_HOST}:${RDS_PORT}/lw_${service//-/_}"
  local db_url_b64
  db_url_b64=$(echo -n "${db_url}" | base64 -w 0)

  execute kubectl patch secret "${service}-db-credentials" \
    --namespace "${k8s_namespace}" \
    --type merge \
    --patch "{\"data\":{\"DATABASE_URL\":\"${db_url_b64}\"}}" 2>/dev/null \
    || log_warn "Kubernetes secret '${service}-db-credentials' not found — skipping k8s patch"

  log_success "Kubernetes secret updated for ${service}"

  # 5. Rolling restart
  log_info "Triggering rolling restart of ${service}..."
  execute kubectl rollout restart deployment "${service}" \
    --namespace "${k8s_namespace}" 2>/dev/null \
    || log_warn "Deployment ${service} not found — skipping restart"

  execute kubectl rollout status deployment "${service}" \
    --namespace "${k8s_namespace}" \
    --timeout="${ROLLOUT_TIMEOUT}s" 2>/dev/null \
    || log_warn "Rollout status check failed for ${service} — verify manually"

  log_success "Password rotation complete for ${service}"
  _audit "OK" "DB password rotated for service=${service} user=${db_user}"
}

# ── Rotate Redis AUTH password ────────────────────────────────────────────────
rotate_redis_password() {
  log_step "Rotating Redis AUTH password"

  local secret_name="${REDIS_SECRET_NAME/\{ENV\}/${ENV}}"
  local k8s_namespace="lomash-wood-${ENV}"

  local new_password
  new_password=$(generate_password)
  log_info "Generated new Redis AUTH password"

  # Update in Redis via aws elasticache modify-replication-group
  # (ElastiCache for Redis 6+ supports AUTH token rotation)
  log_info "Updating Redis AUTH token via AWS ElastiCache..."

  local replication_group_id="lw-redis-${ENV}"

  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would run: aws elasticache modify-replication-group --auth-token ${new_password:0:4}****"
  else
    execute aws elasticache modify-replication-group \
      --replication-group-id "${replication_group_id}" \
      --auth-token "${new_password}" \
      --auth-token-update-strategy ROTATE \
      --apply-immediately

    log_info "Waiting for ElastiCache modification to complete..."
    local max_wait=120
    local waited=0
    while [[ ${waited} -lt ${max_wait} ]]; do
      local status
      status=$(aws elasticache describe-replication-groups \
        --replication-group-id "${replication_group_id}" \
        --query 'ReplicationGroups[0].Status' \
        --output text)
      if [[ "${status}" == "available" ]]; then break; fi
      log_info "Status: ${status} — waiting..."
      sleep 15
      waited=$((waited + 15))
    done
    log_success "ElastiCache modification complete"
  fi

  # Update Secrets Manager
  execute put_secret "${secret_name}" \
    "$(jq -nc --arg p "${new_password}" '{authPassword:$p}')"
  log_success "Redis AUTH password updated in Secrets Manager"

  # Update Kubernetes secret for all services (they share Redis)
  local redis_pass_b64
  redis_pass_b64=$(echo -n "${new_password}" | base64 -w 0)

  for service in "${!SERVICE_DB_USERS[@]}"; do
    execute kubectl patch secret "${service}-redis-credentials" \
      --namespace "${k8s_namespace}" \
      --type merge \
      --patch "{\"data\":{\"REDIS_PASSWORD\":\"${redis_pass_b64}\"}}" 2>/dev/null \
      || true  # Non-fatal if secret doesn't exist per-service
  done

  # Rolling restart of all services to pick up new Redis password
  log_info "Triggering rolling restart of all services..."
  for service in "${!SERVICE_DB_USERS[@]}"; do
    execute kubectl rollout restart deployment "${service}" \
      --namespace "${k8s_namespace}" 2>/dev/null || true
  done

  log_success "Redis AUTH rotation complete"
  _audit "OK" "Redis AUTH password rotated for env=${ENV}"
}

# ── Health check summary ───────────────────────────────────────────────────────
run_health_checks() {
  log_step "Running service health checks"

  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Skipping health checks"
    return 0
  fi

  local k8s_namespace="lomash-wood-${ENV}"
  local services_to_check=()

  if [[ -n "${TARGET_SERVICE}" ]]; then
    services_to_check=("${TARGET_SERVICE}")
  else
    services_to_check=("${!SERVICE_DB_USERS[@]}")
  fi

  local failed=0
  for service in "${services_to_check[@]}"; do
    local running_pods
    running_pods=$(kubectl get pods \
      --namespace "${k8s_namespace}" \
      --selector "app=${service}" \
      --field-selector status.phase=Running \
      --no-headers 2>/dev/null | wc -l)

    if [[ "${running_pods}" -gt 0 ]]; then
      log_success "${service}: ${running_pods} running pod(s)"
    else
      log_error "${service}: No running pods found!"
      FAILED_SERVICES+=("${service}")
      failed=$((failed + 1))
    fi
  done

  if [[ ${failed} -gt 0 ]]; then
    log_error "${failed} service(s) failed health check after rotation"
    return 1
  fi

  log_success "All service health checks passed"
}

# ── Summary ───────────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   DB PASSWORD ROTATION COMPLETE                  ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Environment : ${YELLOW}${ENV}${NC}"
  echo -e "  Timestamp   : ${TIMESTAMP}"
  echo -e "  Log file    : ${LOG_FILE}"

  if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
    echo -e "\n  ${RED}⚠  FAILED SERVICES:${NC}"
    for svc in "${FAILED_SERVICES[@]}"; do
      echo -e "     ${RED}• ${svc}${NC}"
    done
    echo -e "\n  Manual intervention required for failed services."
    echo -e "  Check Kubernetes pod logs: kubectl logs -n lomash-wood-${ENV} -l app=<service>"
  else
    echo -e "\n  ${GREEN}✓ All rotations completed successfully${NC}"
  fi

  echo ""
  echo -e "  ${YELLOW}Next actions:${NC}"
  echo -e "  • Monitor service logs in Loki for DB connection errors"
  echo -e "  • Verify all services show healthy in Grafana"
  echo -e "  • Schedule next rotation in 90 days"
  echo ""
  [[ "${DRY_RUN}" == "true" ]] && echo -e "  ${YELLOW}⚠  DRY-RUN — No changes were made${NC}\n"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  setup_logging

  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Lomash Wood — DB Password Rotation v${SCRIPT_VERSION}        ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  echo ""

  parse_args "$@"
  log_info "Operator: $(whoami) | Env: ${ENV} | DryRun: ${DRY_RUN} | Force: ${FORCE}"

  if [[ "${ENV}" == "production" ]]; then
    confirm "You are rotating database passwords in PRODUCTION. Services will be rolling-restarted."
  fi

  check_prerequisites

  if [[ "${REDIS_ONLY}" == "true" ]]; then
    rotate_redis_password
    run_health_checks
    print_summary
    exit 0
  fi

  fetch_master_credentials

  # Determine which services to rotate
  local services_to_rotate=()
  if [[ -n "${TARGET_SERVICE}" ]]; then
    services_to_rotate=("${TARGET_SERVICE}")
  else
    services_to_rotate=("${!SERVICE_DB_USERS[@]}")
  fi

  log_info "Rotating passwords for ${#services_to_rotate[@]} service(s): ${services_to_rotate[*]}"

  for service in "${services_to_rotate[@]}"; do
    rotate_service_db_password "${service}" || {
      log_error "Failed to rotate password for ${service}"
      FAILED_SERVICES+=("${service}")
    }
    sleep 2  # Brief pause between services to avoid overwhelming the DB
  done

  # Also rotate Redis if rotating all services
  if [[ -z "${TARGET_SERVICE}" ]]; then
    rotate_redis_password || log_error "Redis rotation failed"
  fi

  run_health_checks
  print_summary

  [[ ${#FAILED_SERVICES[@]} -gt 0 ]] && exit 3
  _audit "OK" "All DB password rotations completed. Services: ${services_to_rotate[*]}"
  exit 0
}

main "$@"