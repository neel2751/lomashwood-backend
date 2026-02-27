# Secrets Rotation — Lomash Wood Security

This directory contains the automated scripts for rotating all cryptographic secrets, credentials, and API keys used by the Lomash Wood backend platform. All rotations are logged to the structured audit log and must be performed by an authorised operator with the appropriate IAM role and Kubernetes cluster access.

---

## Scripts Index

| Script | Document ID | Version | Purpose |
|---|---|---|---|
| `rotate-keys.sh` | LW-SEC-ROT-001 | 1.3 | JWT RS256 signing key pair rotation (zero-downtime) |
| `rotate-db-passwords.sh` | LW-SEC-ROT-002 | 1.4 | PostgreSQL per-service DB passwords + Redis AUTH password |
| `rotate-api-tokens.sh` | LW-SEC-ROT-003 | 1.2 | Stripe, Twilio, Firebase, AWS SES, and internal API keys |

---

## Rotation Schedule

| Secret | Rotation Frequency | Script | Owner |
|---|---|---|---|
| JWT RS256 private key | **Every 180 days** | `rotate-keys.sh` | DevOps Lead |
| PostgreSQL DB passwords (per service) | **Every 90 days** | `rotate-db-passwords.sh` | DevOps Lead |
| Redis AUTH password | **Every 90 days** | `rotate-db-passwords.sh --redis-only` | DevOps Lead |
| Stripe secret key | **Every 365 days** or on compromise | `rotate-api-tokens.sh --token stripe-secret-key` | DevOps Lead |
| Stripe webhook signing secret | **Every 365 days** or on compromise | `rotate-api-tokens.sh --token stripe-webhook-secret` | DevOps Lead |
| Twilio Auth Token | **Every 365 days** or on compromise | `rotate-api-tokens.sh --token twilio-auth-token` | DevOps Lead |
| Firebase service account key | **Every 365 days** or on compromise | `rotate-api-tokens.sh --token firebase-service-account` | DevOps Lead |
| AWS SES SMTP credentials | **Every 365 days** | `rotate-api-tokens.sh --token ses-smtp-password` | DevOps Lead |
| Internal service API keys | **Every 365 days** | `rotate-api-tokens.sh --token all-internal` | DevOps Lead |
| mTLS service certificates | **Every 90 days (automatic)** | cert-manager — no manual action | DevOps |
| AWS KMS CMKs | **Annual (automatic)** | AWS KMS automatic rotation | AWS |

> **Trigger-based rotation:** Any secret suspected of compromise must be rotated **immediately**, regardless of schedule. Use the relevant script with `--force` and notify the Security Lead.

---

## Prerequisites

All scripts require the following tools and permissions:

```bash
# Required tools
aws         # AWS CLI v2 (brew install awscli)
kubectl     # Kubernetes CLI (configured for target cluster)
openssl     # OpenSSL v3.0+ (brew install openssl)
jq          # JSON processor (brew install jq)
psql        # PostgreSQL client — required for rotate-db-passwords.sh

# Required AWS IAM permissions (attached to the operator's role)
secretsmanager:GetSecretValue
secretsmanager:PutSecretValue
secretsmanager:UpdateSecretVersionStage
secretsmanager:ListSecretVersionIds
secretsmanager:DescribeSecret
iam:CreateAccessKey           # for SES rotation
iam:DeleteAccessKey           # for SES rotation
iam:ListAccessKeys            # for SES rotation
elasticache:ModifyReplicationGroup   # for Redis rotation
rds:DescribeDBInstances       # for connectivity validation

# Kubernetes permissions (kubeconfig must point to the target cluster)
secrets: get, patch           # to update Kubernetes secrets
deployments: get, patch       # to trigger rolling restarts
pods: get, list               # for health checks
rollouts: get                 # to monitor rollout status
```

---

## Quick Start

### Before Running Any Script

```bash
# 1. Ensure you are authenticated to AWS with the correct profile
aws sts get-caller-identity

# 2. Ensure kubectl is configured for the correct cluster
kubectl config current-context
kubectl cluster-info

# 3. Always run --dry-run first on production
./rotate-keys.sh --env production --dry-run
```

### JWT Key Rotation (Every 180 Days)

```bash
# Staging
./rotate-keys.sh --env staging

# Production (dry-run first)
./rotate-keys.sh --env production --dry-run
./rotate-keys.sh --env production
```

### Database Password Rotation (Every 90 Days)

```bash
# Rotate all services (staging)
./rotate-db-passwords.sh --env staging

# Rotate a single service (production)
./rotate-db-passwords.sh --env production --service auth-service

# Rotate Redis only
./rotate-db-passwords.sh --env production --redis-only

# Full production rotation (dry-run first)
./rotate-db-passwords.sh --env production --dry-run
./rotate-db-passwords.sh --env production
```

### API Token Rotation

```bash
# List all tokens and last rotation dates
./rotate-api-tokens.sh --env production --list

# Rotate Stripe secret key (operator must first create new key in Stripe Dashboard)
./rotate-api-tokens.sh --env production --token stripe-secret-key

# Rotate Stripe webhook signing secret
./rotate-api-tokens.sh --env production --token stripe-webhook-secret

# Rotate Twilio credentials
./rotate-api-tokens.sh --env production --token twilio-auth-token

# Rotate Firebase service account
./rotate-api-tokens.sh --env production --token firebase-service-account

# Rotate all internal API keys
./rotate-api-tokens.sh --env production --token all-internal

# View audit log for token rotations
./rotate-api-tokens.sh --env production --audit
```

---

## Script Architecture

Each script follows a consistent pattern:

```
1. Argument parsing + validation
2. Prerequisite checks (tools, AWS auth, k8s access)
3. Operator confirmation (skipped with --force)
4. Secret generation / retrieval from vendor
5. AWS Secrets Manager update
6. Kubernetes secret patch
7. Rolling restart of affected deployment(s)
8. Health check verification
9. Audit log entry
10. Summary + post-rotation instructions
```

### Flags Available on All Scripts

| Flag | Description |
|---|---|
| `--env staging\|production` | Target environment **(required)** |
| `--dry-run` | Print all actions without executing anything |
| `--force` | Skip confirmation prompts (use in CI/CD only) |
| `--help` | Show full usage documentation |

---

## Zero-Downtime Rotation — How It Works

### JWT Keys (`rotate-keys.sh`)

JWT key rotation uses the **Key ID (`kid`) overlap method**:

```
Time →

  Phase 1: Old key only
  [OLD-KID] ──────────────────────────────────────────────────────────────►
  JWKS: { keys: [OLD-KID public key] }
  auth-service signs with: OLD-KID

  Phase 2: Transition (both keys in JWKS)
  [OLD-KID] ──────────────────────────────►  (tokens expire after 15 min)
  [NEW-KID] ────────────────────────────────────────────────────────────────►
  JWKS: { keys: [OLD-KID public key, NEW-KID public key] }
  auth-service signs with: NEW-KID (after rolling restart)
  api-gateway accepts: OLD-KID AND NEW-KID

  Phase 3: New key only (after 20-minute wait)
  [NEW-KID] ────────────────────────────────────────────────────────────────►
  JWKS: { keys: [NEW-KID public key] }
  OLD-KID removed — old tokens have all expired
```

### Database Passwords (`rotate-db-passwords.sh`)

```
1. Generate new password
2. ALTER USER in PostgreSQL (new password active immediately for new connections)
3. Update Secrets Manager
4. Update Kubernetes secret
5. Rolling restart: new pods connect with new password
         ↑ Old pods continue to work until replaced (old connections still valid
           until pod is terminated by rolling update)
```

---

## Logging & Audit Trail

All scripts write structured JSON to:

- **Script log:** `/var/log/lomash-wood/<script>-<timestamp>.log` (full output)
- **Audit log:** `/var/log/lomash-wood/audit.log` (machine-readable, append-only)

Audit log format:

```json
{
  "ts": "2026-02-19T14:30:00Z",
  "script": "rotate-keys.sh",
  "environment": "production",
  "level": "OK",
  "msg": "JWT key rotation completed. New kid: kid-20260219-a3f2b1c0",
  "operator": "devops-lead"
}
```

**Key values are never written to logs.** The scripts redact all secret material before writing audit entries.

---

## CI/CD Integration

For automated rotation in GitHub Actions (use `--force` to skip prompts):

```yaml
# .github/workflows/rotate-secrets.yml
- name: Rotate DB Passwords (staging, every 90 days)
  run: |
    ./security/secrets-rotation/rotate-db-passwords.sh \
      --env staging \
      --force
  env:
    AWS_ROLE_ARN: ${{ secrets.ROTATION_ROLE_ARN }}
    KUBECONFIG: ${{ secrets.KUBECONFIG_STAGING }}
```

> **Note:** `rotate-api-tokens.sh` for third-party secrets (Stripe, Twilio, Firebase) **cannot be fully automated** as it requires operator interaction with the vendor dashboard. Only internal key rotation (`--token all-internal`) and SES rotation (`--token ses-smtp-password`) are fully automated.

---

## Emergency Rotation (Suspected Compromise)

If a secret is suspected to be compromised:

1. **Immediately** run the relevant rotation script with `--force`:
   ```bash
   ./rotate-keys.sh --env production --force
   ./rotate-db-passwords.sh --env production --force
   ```

2. **Notify the Security Lead** via `#security-incidents` Slack channel

3. **Follow the Incident Response Policy:** `security/policies/incident-response.md`

4. **Check audit logs** for evidence of the compromised secret's use:
   ```bash
   grep 'AUTH_LOGIN_SUCCESS\|ADMIN' /var/log/lomash-wood/audit.log | tail -100
   ```

5. **Rotate all related secrets** — when one secret is compromised, assume adjacent secrets may also be compromised

---

## Related Documents

| Document | Location |
|---|---|
| Authentication Policy | `security/policies/auth-policy.md` |
| Encryption Policy | `security/policies/encryption-policy.md` |
| Incident Response Policy | `security/policies/incident-response.md` |
| STRIDE Threat Model | `security/threat-models/STRIDE.md` |
| Penetration Test Reports | `security/pentest-reports/` |
| Audit Log Schema | `security/audit-logs/audit-schema.json` |
| CI/CD Workflows | `.github/workflows/` |

---

*Lomash Wood Ltd — Confidential. These scripts contain operational procedures for credential management. Do not distribute outside the engineering organisation. Last updated: 2026-02-19.*