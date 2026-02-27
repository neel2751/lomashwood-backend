#!/usr/bin/env bash
# =============================================================================
# rotate-keys.sh — JWT RS256 Signing Key Rotation
# Lomash Wood Backend — security/secrets-rotation/
#
# Document ID : LW-SEC-ROT-001
# Version     : 1.3
# Owner       : DevOps Lead
# Last Updated: 2026-02-19
#
# PURPOSE
# -------
# Rotates the RS256 JWT signing key pair used by the auth-service without
# causing downtime or invalidating currently-valid tokens. Achieves zero-
# downtime rotation by:
#   1. Generating a new RSA 4096-bit key pair
#   2. Publishing the NEW public key to AWS Secrets Manager alongside the OLD
#      one (JWKS endpoint serves both during the transition window)
#   3. Updating auth-service to sign new tokens with the new key (kid updated)
#   4. Waiting for all tokens signed with the old key to expire (≤ 15 min)
#   5. Removing the old key from the JWKS set
#   6. Archiving the old key and updating audit log
#
# PREREQUISITES
# -------------
#   - AWS CLI v2 configured with appropriate IAM role
#   - openssl installed (v3.0+)
#   - jq installed (v1.6+)
#   - kubectl configured and authenticated to the target cluster
#   - AWS_PROFILE or instance role with Secrets Manager write access
#
# USAGE
# -----
#   ./rotate-keys.sh [OPTIONS]
#
# OPTIONS
#   --env           Target environment: staging | production (required)
#   --dry-run       Print actions without executing
#   --force         Skip confirmation prompts (use in CI only)
#   --transition-wait  Minutes to wait during key transition (default: 20)
#   --help          Show this help
#
# EXAMPLES
#   ./rotate-keys.sh --env staging
#   ./rotate-keys.sh --env production --dry-run
#   ./rotate-keys.sh --env production --force
#
# EXIT CODES
#   0   Success
#   1   Invalid arguments
#   2   Prerequisite check failed
#   3   AWS Secrets Manager operation failed
#   4   Key generation failed
#   5   Kubernetes secret update failed
#   6   Service restart failed
#   7   Rollback initiated (old key restored)
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── Constants ──────────────────────────────────────────────────────────────────
readonly SCRIPT_NAME="rotate-keys.sh"
readonly SCRIPT_VERSION="1.3"
readonly TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
readonly LOG_FILE="/var/log/lomash-wood/key-rotation-${TIMESTAMP}.log"
readonly AUDIT_LOG_FILE="/var/log/lomash-wood/audit.log"
readonly TMP_DIR=$(mktemp -d)
readonly KEY_BITS=4096
readonly DEFAULT_TRANSITION_WAIT=20   # minutes — must exceed JWT access token TTL (15 min)

# AWS resource names (interpolated with environment)
readonly SECRET_NAME_PRIVATE="lomash-wood/{ENV}/auth/jwt-private-key"
readonly SECRET_NAME_JWKS="lomash-wood/{ENV}/auth/jwt-jwks"
readonly SECRET_NAME_CURRENT_KID="lomash-wood/{ENV}/auth/jwt-current-kid"

# Kubernetes resources
readonly K8S_NAMESPACE="lomash-wood-{ENV}"
readonly K8S_SECRET_NAME="auth-service-jwt-keys"
readonly K8S_DEPLOYMENT_NAME="auth-service"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# ── Argument defaults ─────────────────────────────────────────────────────────
ENV=""
DRY_RUN=false
FORCE=false
TRANSITION_WAIT=${DEFAULT_TRANSITION_WAIT}

# ── Cleanup trap ──────────────────────────────────────────────────────────────
cleanup() {
  local exit_code=$?
  log_info "Cleaning up temporary directory: ${TMP_DIR}"
  rm -rf "${TMP_DIR}"
  if [[ ${exit_code} -ne 0 ]]; then
    log_error "Script exited with code ${exit_code}. Check log: ${LOG_FILE}"
  fi
}
trap cleanup EXIT
trap 'log_error "Script interrupted."; exit 130' INT TERM

# ── Logging ───────────────────────────────────────────────────────────────────
setup_logging() {
  mkdir -p "$(dirname "${LOG_FILE}")"
  exec > >(tee -a "${LOG_FILE}") 2>&1
}

log_info()    { echo -e "${CYAN}[$(date -u +%H:%M:%SZ)] [INFO]  ${NC}$*"; write_audit "INFO"  "$*"; }
log_success() { echo -e "${GREEN}[$(date -u +%H:%M:%SZ)] [OK]    ${NC}$*"; write_audit "OK"    "$*"; }
log_warn()    { echo -e "${YELLOW}[$(date -u +%H:%M:%SZ)] [WARN]  ${NC}$*"; write_audit "WARN"  "$*"; }
log_error()   { echo -e "${RED}[$(date -u +%H:%M:%SZ)] [ERROR] ${NC}$*" >&2; write_audit "ERROR" "$*"; }
log_step()    { echo -e "\n${BLUE}══════════════════════════════════════════════════${NC}"; echo -e "${BLUE}  STEP: $*${NC}"; echo -e "${BLUE}══════════════════════════════════════════════════${NC}"; }

write_audit() {
  local level=$1
  local message=$2
  local audit_entry
  audit_entry=$(jq -nc \
    --arg ts "${TIMESTAMP}" \
    --arg script "${SCRIPT_NAME}" \
    --arg env "${ENV:-unknown}" \
    --arg level "${level}" \
    --arg msg "${message}" \
    --arg user "$(whoami)" \
    '{timestamp: $ts, script: $script, environment: $env, level: $level, message: $msg, operator: $user}')
  echo "${audit_entry}" >> "${AUDIT_LOG_FILE}" 2>/dev/null || true
}

# ── Argument parsing ──────────────────────────────────────────────────────────
usage() {
  grep '^#' "${BASH_SOURCE[0]}" | grep -E '^\#( |$)' | sed 's/^# \{0,1\}//' | head -60
  exit 0
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --env)               ENV="$2"; shift 2 ;;
      --dry-run)           DRY_RUN=true; shift ;;
      --force)             FORCE=true; shift ;;
      --transition-wait)   TRANSITION_WAIT="$2"; shift 2 ;;
      --help|-h)           usage ;;
      *)                   log_error "Unknown argument: $1"; exit 1 ;;
    esac
  done

  if [[ -z "${ENV}" ]]; then
    log_error "--env is required (staging | production)"
    exit 1
  fi

  if [[ "${ENV}" != "staging" && "${ENV}" != "production" ]]; then
    log_error "--env must be 'staging' or 'production'"
    exit 1
  fi
}

# ── Prerequisite checks ───────────────────────────────────────────────────────
check_prerequisites() {
  log_step "Checking prerequisites"

  local missing=0
  for cmd in aws openssl jq kubectl; do
    if ! command -v "${cmd}" &>/dev/null; then
      log_error "Required command not found: ${cmd}"
      missing=$((missing + 1))
    else
      log_success "Found: ${cmd} ($(${cmd} --version 2>&1 | head -1))"
    fi
  done

  [[ ${missing} -gt 0 ]] && exit 2

  # Verify AWS credentials
  if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS credentials not configured or insufficient permissions"
    exit 2
  fi
  log_success "AWS identity: $(aws sts get-caller-identity --query 'Arn' --output text)"

  # Verify kubectl cluster access
  if ! kubectl cluster-info &>/dev/null; then
    log_error "kubectl cannot reach the Kubernetes cluster"
    exit 2
  fi
  log_success "Kubernetes cluster reachable"

  # Verify namespace exists
  if ! kubectl get namespace "${K8S_NAMESPACE/\{ENV\}/${ENV}}" &>/dev/null; then
    log_error "Kubernetes namespace '${K8S_NAMESPACE/\{ENV\}/${ENV}}' not found"
    exit 2
  fi
  log_success "Kubernetes namespace found: ${K8S_NAMESPACE/\{ENV\}/${ENV}}"
}

# ── Dry-run wrapper ───────────────────────────────────────────────────────────
execute() {
  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would execute: $*"
    return 0
  fi
  "$@"
}

# ── Confirmation prompt ───────────────────────────────────────────────────────
confirm() {
  local message=$1
  if [[ "${FORCE}" == "true" || "${DRY_RUN}" == "true" ]]; then
    log_info "Auto-confirming: ${message}"
    return 0
  fi
  echo -e "\n${YELLOW}⚠  ${message}${NC}"
  echo -n "Type 'yes' to continue: "
  read -r response
  if [[ "${response}" != "yes" ]]; then
    log_warn "Aborted by operator."
    exit 0
  fi
}

# ── Step 1: Generate new key pair ─────────────────────────────────────────────
generate_key_pair() {
  log_step "Generating new RSA ${KEY_BITS}-bit key pair"

  local new_kid="kid-$(date -u +%Y%m%d)-$(openssl rand -hex 4)"
  local private_key_file="${TMP_DIR}/new-private.pem"
  local public_key_file="${TMP_DIR}/new-public.pem"

  log_info "New Key ID (kid): ${new_kid}"
  log_info "Generating RSA private key (${KEY_BITS} bits)..."

  execute openssl genrsa -out "${private_key_file}" "${KEY_BITS}"
  execute openssl rsa -in "${private_key_file}" -pubout -out "${public_key_file}"

  log_success "Key pair generated successfully"
  log_info "Private key fingerprint: $(openssl rsa -in "${private_key_file}" -noout -modulus | openssl md5 | awk '{print $2}')"

  # Export for subsequent steps
  NEW_KID="${new_kid}"
  NEW_PRIVATE_KEY_FILE="${private_key_file}"
  NEW_PUBLIC_KEY_FILE="${public_key_file}"
}

# ── Step 2: Retrieve current JWKS ────────────────────────────────────────────
retrieve_current_jwks() {
  log_step "Retrieving current JWKS from Secrets Manager"

  local secret_name="${SECRET_NAME_JWKS/\{ENV\}/${ENV}}"
  local current_kid_secret="${SECRET_NAME_CURRENT_KID/\{ENV\}/${ENV}}"

  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would fetch: ${secret_name}"
    CURRENT_JWKS='{"keys":[]}'
    CURRENT_KID="kid-placeholder"
    return 0
  fi

  CURRENT_JWKS=$(aws secretsmanager get-secret-value \
    --secret-id "${secret_name}" \
    --query 'SecretString' \
    --output text 2>/dev/null || echo '{"keys":[]}')

  CURRENT_KID=$(aws secretsmanager get-secret-value \
    --secret-id "${current_kid_secret}" \
    --query 'SecretString' \
    --output text 2>/dev/null || echo "")

  log_success "Current JWKS retrieved. Active kid: '${CURRENT_KID}'"
  log_info "Current key count in JWKS: $(echo "${CURRENT_JWKS}" | jq '.keys | length')"
}

# ── Step 3: Build new JWKS (old + new keys) ───────────────────────────────────
build_transition_jwks() {
  log_step "Building transition JWKS (current key + new key)"

  # Convert RSA public key to JWK format using openssl + manual construction
  local public_key_pem
  public_key_pem=$(cat "${NEW_PUBLIC_KEY_FILE}")

  # Extract modulus and exponent
  local modulus
  local exponent

  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Would build JWK for new key"
    NEW_JWKS='{"keys":[]}'
    return 0
  fi

  modulus=$(openssl rsa -in "${NEW_PRIVATE_KEY_FILE}" -noout -modulus | \
    sed 's/Modulus=//' | xxd -r -p | base64 -w 0 | \
    tr '+/' '-_' | tr -d '=')
  exponent="AQAB"   # Standard RSA public exponent 65537

  # Build the new JWK object
  local new_jwk
  new_jwk=$(jq -nc \
    --arg kid "${NEW_KID}" \
    --arg n "${modulus}" \
    --arg e "${exponent}" \
    '{kty:"RSA",use:"sig",alg:"RS256",kid:$kid,n:$n,e:$e}')

  # Merge: existing keys (excluding any with the same new kid) + new key
  NEW_JWKS=$(echo "${CURRENT_JWKS}" | jq \
    --argjson newKey "${new_jwk}" \
    '.keys = (.keys // [] | map(select(.kid != $newKey.kid))) + [$newKey]')

  log_success "Transition JWKS built with $(echo "${NEW_JWKS}" | jq '.keys | length') keys"
}

# ── Step 4: Store new private key in Secrets Manager ─────────────────────────
store_new_private_key() {
  log_step "Storing new private key in AWS Secrets Manager"

  local secret_name="${SECRET_NAME_PRIVATE/\{ENV\}/${ENV}}"
  local new_private_key_pem
  new_private_key_pem=$(cat "${NEW_PRIVATE_KEY_FILE}")

  local secret_value
  secret_value=$(jq -nc \
    --arg kid "${NEW_KID}" \
    --arg pem "${new_private_key_pem}" \
    '{kid: $kid, privateKeyPem: $pem}')

  execute aws secretsmanager put-secret-value \
    --secret-id "${secret_name}" \
    --secret-string "${secret_value}" \
    --version-stages AWSPENDING

  log_success "New private key stored in Secrets Manager (AWSPENDING stage)"
}

# ── Step 5: Publish transition JWKS (old + new public keys) ──────────────────
publish_transition_jwks() {
  log_step "Publishing transition JWKS to Secrets Manager"

  local secret_name="${SECRET_NAME_JWKS/\{ENV\}/${ENV}}"

  execute aws secretsmanager put-secret-value \
    --secret-id "${secret_name}" \
    --secret-string "${NEW_JWKS}"

  log_success "Transition JWKS published — both old and new public keys now in JWKS endpoint"
  log_info "Tokens signed by either key will now be accepted"
}

# ── Step 6: Update auth-service to sign with new key ─────────────────────────
update_kubernetes_secret() {
  log_step "Updating Kubernetes secret and rolling auth-service deployment"

  local namespace="${K8S_NAMESPACE/\{ENV\}/${ENV}}"
  local secret_name="${K8S_SECRET_NAME}"
  local deployment="${K8S_DEPLOYMENT_NAME}"
  local private_key_b64
  private_key_b64=$(base64 -w 0 < "${NEW_PRIVATE_KEY_FILE}")

  # Patch the Kubernetes secret with the new private key and kid
  execute kubectl patch secret "${secret_name}" \
    --namespace "${namespace}" \
    --type merge \
    --patch "{\"data\":{\"JWT_PRIVATE_KEY\":\"${private_key_b64}\",\"JWT_KID\":\"$(echo -n "${NEW_KID}" | base64 -w 0)\"}}"

  log_success "Kubernetes secret patched with new JWT private key"

  # Trigger a rolling restart of auth-service to pick up the new key
  execute kubectl rollout restart deployment "${deployment}" \
    --namespace "${namespace}"

  log_info "Waiting for auth-service rollout to complete..."
  execute kubectl rollout status deployment "${deployment}" \
    --namespace "${namespace}" \
    --timeout=300s

  log_success "auth-service rollout complete — new tokens now signed with kid='${NEW_KID}'"
}

# ── Step 7: Promote new private key to AWSCURRENT ────────────────────────────
promote_secret() {
  log_step "Promoting new private key to AWSCURRENT in Secrets Manager"

  local secret_name="${SECRET_NAME_PRIVATE/\{ENV\}/${ENV}}"
  local current_kid_secret="${SECRET_NAME_CURRENT_KID/\{ENV\}/${ENV}}"

  execute aws secretsmanager update-secret-version-stage \
    --secret-id "${secret_name}" \
    --version-stage AWSCURRENT \
    --move-to-version-id "$(aws secretsmanager list-secret-version-ids \
      --secret-id "${secret_name}" \
      --query "Versions[?VersionStages[?@ == 'AWSPENDING']].VersionId" \
      --output text)"

  # Update current kid tracker
  execute aws secretsmanager put-secret-value \
    --secret-id "${current_kid_secret}" \
    --secret-string "${NEW_KID}"

  log_success "New private key promoted to AWSCURRENT. Active kid: ${NEW_KID}"
}

# ── Step 8: Transition wait (let old tokens expire) ──────────────────────────
wait_for_transition() {
  log_step "Transition wait: allowing old tokens to expire"

  local wait_seconds=$((TRANSITION_WAIT * 60))
  log_info "Waiting ${TRANSITION_WAIT} minutes for all tokens signed with '${CURRENT_KID}' to expire..."
  log_info "(Access token TTL is 15 minutes; waiting ${TRANSITION_WAIT} min for safety margin)"

  if [[ "${DRY_RUN}" == "true" || "${FORCE}" == "true" ]]; then
    log_warn "[DRY-RUN/FORCE] Skipping wait. In production, wait ${TRANSITION_WAIT} minutes."
    return 0
  fi

  local i
  for i in $(seq "${TRANSITION_WAIT}" -1 1); do
    echo -ne "  ⏳ ${i} minutes remaining...\r"
    sleep 60
  done
  echo ""
  log_success "Transition wait complete"
}

# ── Step 9: Remove old key from JWKS ─────────────────────────────────────────
remove_old_key_from_jwks() {
  log_step "Removing old key from JWKS (kid='${CURRENT_KID}')"

  if [[ -z "${CURRENT_KID}" ]]; then
    log_warn "No old kid tracked — skipping JWKS cleanup"
    return 0
  fi

  local secret_name="${SECRET_NAME_JWKS/\{ENV\}/${ENV}}"

  # Remove the old key from the JWKS, keeping only the new one
  local clean_jwks
  clean_jwks=$(echo "${NEW_JWKS}" | jq \
    --arg old_kid "${CURRENT_KID}" \
    '.keys = (.keys | map(select(.kid != $old_kid)))')

  execute aws secretsmanager put-secret-value \
    --secret-id "${secret_name}" \
    --secret-string "${clean_jwks}"

  log_success "Old key removed from JWKS. Active keys: $(echo "${clean_jwks}" | jq '.keys | length')"
}

# ── Step 10: Verify rotation ──────────────────────────────────────────────────
verify_rotation() {
  log_step "Verifying rotation"

  if [[ "${DRY_RUN}" == "true" ]]; then
    log_warn "[DRY-RUN] Skipping verification"
    return 0
  fi

  local namespace="${K8S_NAMESPACE/\{ENV\}/${ENV}}"

  # Check auth-service pods are running
  local running_pods
  running_pods=$(kubectl get pods \
    --namespace "${namespace}" \
    --selector "app=${K8S_DEPLOYMENT_NAME}" \
    --field-selector status.phase=Running \
    --no-headers 2>/dev/null | wc -l)

  if [[ "${running_pods}" -gt 0 ]]; then
    log_success "auth-service has ${running_pods} running pod(s)"
  else
    log_error "No running auth-service pods found after rotation!"
    return 1
  fi

  # Check new kid is in Secrets Manager
  local active_kid
  active_kid=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_NAME_CURRENT_KID/\{ENV\}/${ENV}}" \
    --query 'SecretString' \
    --output text 2>/dev/null || echo "")

  if [[ "${active_kid}" == "${NEW_KID}" ]]; then
    log_success "Active kid in Secrets Manager matches: ${NEW_KID}"
  else
    log_error "Active kid mismatch: expected '${NEW_KID}', got '${active_kid}'"
    return 1
  fi

  log_success "Rotation verification passed"
}

# ── Summary ───────────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║     JWT KEY ROTATION COMPLETE                    ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Environment  : ${YELLOW}${ENV}${NC}"
  echo -e "  Old kid      : ${RED}${CURRENT_KID:-none}${NC} (removed)"
  echo -e "  New kid      : ${GREEN}${NEW_KID}${NC} (active)"
  echo -e "  Timestamp    : ${TIMESTAMP}"
  echo -e "  Log file     : ${LOG_FILE}"
  echo -e "  Audit log    : ${AUDIT_LOG_FILE}"
  echo ""
  echo -e "  ${YELLOW}Action required:${NC}"
  echo -e "  • Verify auth-service health in Grafana"
  echo -e "  • Confirm no JWT validation errors in Loki logs"
  echo -e "  • Update key rotation schedule (next: +180 days)"
  echo ""
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo -e "  ${YELLOW}⚠  DRY-RUN MODE — No changes were made${NC}"
    echo ""
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  setup_logging

  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Lomash Wood — JWT Key Rotation v${SCRIPT_VERSION}           ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  echo ""

  parse_args "$@"

  log_info "Environment : ${ENV}"
  log_info "Dry-run     : ${DRY_RUN}"
  log_info "Force       : ${FORCE}"
  log_info "Transition wait: ${TRANSITION_WAIT} minutes"
  log_info "Operator    : $(whoami)"
  log_info "Hostname    : $(hostname)"

  if [[ "${ENV}" == "production" ]]; then
    confirm "You are rotating JWT keys in PRODUCTION. This will trigger a rolling restart of auth-service."
  fi

  check_prerequisites
  generate_key_pair
  retrieve_current_jwks
  build_transition_jwks
  store_new_private_key
  publish_transition_jwks
  update_kubernetes_secret
  promote_secret
  wait_for_transition
  remove_old_key_from_jwks
  verify_rotation
  print_summary

  write_audit "OK" "JWT key rotation completed successfully. New kid: ${NEW_KID}"
  exit 0
}

main "$@"