# Auth Failure Runbook — Lomash Wood Backend

## Overview

This runbook covers authentication and authorisation failures across the Lomash Wood platform. Auth is handled by the `auth-service` using Better Auth with JWT tokens, session management via Redis, and PostgreSQL as the persistent store.

**Affected endpoints:** All routes under `/v1/auth/*` and any protected route requiring a valid Bearer token or session cookie.

---

## Failure Detection

### Symptoms

- Users unable to log in or register
- `401 Unauthorized` or `403 Forbidden` responses on authenticated routes
- `POST /v1/auth/login` returning errors or timing out
- `GET /v1/auth/me` returning 401 for previously valid sessions
- Elevated error rate on `auth-service` in Grafana

### Quick Health Check

```bash
curl -sf https://api.lomashwood.com/v1/auth/health | jq .
kubectl rollout status deployment/auth-service -n lomash-wood
kubectl logs -n lomash-wood deployment/auth-service --tail=200 | grep -E "error|ERROR|FATAL"
```

---

## Scenario 1 — Login Endpoint Returning 500

**Symptoms:** `POST /v1/auth/login` returns 500. Users cannot authenticate.

**Step 1 — Check auth-service logs:**

```bash
kubectl logs -n lomash-wood deployment/auth-service --tail=300
```

Look for: database connection errors, Prisma errors, Better Auth configuration errors, bcrypt failures.

**Step 2 — Verify database connectivity:**

```bash
kubectl exec -it <auth-service-pod> -n lomash-wood -- npx prisma db execute \
  --stdin <<< "SELECT 1;"
```

If database is unreachable, follow `database-failure.md`.

**Step 3 — Verify Redis (session store) connectivity:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli ping
```

Auth-service uses Redis for session caching. If Redis is down, sessions cannot be read or written.

**Step 4 — Check JWT configuration:**

```bash
kubectl get secret lomash-wood-secrets -n lomash-wood \
  -o jsonpath='{.data.JWT_SECRET}' | base64 -d | wc -c
```

JWT secret must be at least 32 characters. If missing or too short, regenerate:

```bash
JWT_SECRET=$(openssl rand -base64 48)
kubectl patch secret lomash-wood-secrets -n lomash-wood \
  --type='json' \
  -p="[{\"op\": \"replace\", \"path\": \"/data/JWT_SECRET\", \"value\": \"$(echo -n $JWT_SECRET | base64 -w0)\"}]"
kubectl rollout restart deployment/auth-service -n lomash-wood
```

**Warning:** Rotating the JWT secret invalidates all existing tokens. All users will be logged out.

**Step 5 — Restart auth-service:**

```bash
kubectl rollout restart deployment/auth-service -n lomash-wood
kubectl rollout status deployment/auth-service -n lomash-wood
```

---

## Scenario 2 — All Users Being Logged Out (Sessions Invalidated)

**Symptoms:** Users report being suddenly logged out. `GET /v1/auth/me` returns 401 for all sessions.

**Step 1 — Check if Redis was flushed or restarted:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli DBSIZE
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli INFO persistence | grep -E "rdb_last_save_time|aof_enabled"
```

If `DBSIZE` is 0, Redis data was lost. Sessions are gone. This is a forced logout of all users.

**Step 2 — Communicate to users:**

Trigger a notification (if notification-service is up):

```bash
curl -X POST https://api.lomashwood.com/v1/notifications/broadcast \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "template": "session-expired",
    "subject": "Please log in again",
    "recipient_filter": "all_active_users"
  }'
```

**Step 3 — Check if JWT secret was rotated:**

```bash
kubectl describe secret lomash-wood-secrets -n lomash-wood | grep "jwt"
kubectl get events -n lomash-wood | grep "secret"
```

If secret was accidentally changed, restore the previous value from AWS Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id lomash-wood/production/jwt-secret \
  --version-stage AWSPREVIOUS \
  --query SecretString --output text
```

**Step 4 — Enable Redis persistence to prevent future session loss:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli CONFIG SET appendonly yes
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli CONFIG REWRITE
```

---

## Scenario 3 — 401 on Protected Routes (Token Validation Failing)

**Symptoms:** Users are logged in (cookie exists) but receive 401 on protected API calls. `GET /v1/auth/me` returns 401.

**Step 1 — Decode the JWT to inspect it:**

```bash
echo "<token>" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .
```

Check: `exp` field (expiry timestamp), `iss` (issuer), `sub` (user ID).

**Step 2 — Check token expiry configuration:**

```bash
kubectl get secret lomash-wood-secrets -n lomash-wood \
  -o jsonpath='{.data.JWT_EXPIRES_IN}' | base64 -d
```

Default should be `15m` for access tokens, `7d` for refresh tokens.

**Step 3 — Verify token blacklist is not causing false positives:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli KEYS "blacklist:*" | head -20
```

If a user's token is incorrectly blacklisted:

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli DEL "blacklist:<token_jti>"
```

**Step 4 — Check CORS configuration is not stripping Authorization headers:**

```bash
kubectl logs -n lomash-wood deployment/api-gateway --tail=200 | grep -i "origin\|cors"
```

Verify `Authorization` header is in the `allowedHeaders` list in `api-gateway/src/config/cors.ts`.

**Step 5 — Verify the auth middleware is reading from the correct header/cookie:**

```bash
kubectl logs -n lomash-wood deployment/auth-service --tail=100 | grep "bearer\|cookie"
```

---

## Scenario 4 — Account Lockout / Rate Limit Lockout

**Symptoms:** Specific users or IPs unable to log in. `POST /v1/auth/login` returning `429 Too Many Requests` or `423 Locked`.

**Step 1 — Check rate limit state for an IP:**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli KEYS "ratelimit:login:*" | head -20
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli GET "ratelimit:login:<ip_address>"
```

**Step 2 — Manually unlock an IP (after verifying it is legitimate):**

```bash
kubectl exec -it redis-master-0 -n lomash-wood -- redis-cli DEL "ratelimit:login:<ip_address>"
```

**Step 3 — Unlock a locked user account:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_auth -c \
  "UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE email = '<email>';"
```

**Step 4 — Check if this is a brute-force attack:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_auth -c \
  "SELECT ip_address, COUNT(*) AS attempts, MAX(created_at) AS last_attempt
   FROM auth_audit_log
   WHERE event = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY ip_address
   HAVING COUNT(*) > 10
   ORDER BY attempts DESC;"
```

If brute-force is detected, block the IP at the AWS WAF level:

```bash
aws wafv2 update-ip-set \
  --name lomash-wood-blocked-ips \
  --scope REGIONAL \
  --id <ip-set-id> \
  --addresses "<attacker-ip>/32" \
  --lock-token <lock-token>
```

---

## Scenario 5 — Registration Failing

**Symptoms:** `POST /v1/auth/register` returning errors. New customers unable to create accounts.

**Step 1 — Check for database constraint violations:**

```bash
kubectl logs -n lomash-wood deployment/auth-service --tail=200 | grep -E "unique|constraint|P2002"
```

`P2002` is Prisma's unique constraint violation — likely a duplicate email registration attempt.

**Step 2 — Verify email sending is working (verification emails):**

```bash
kubectl logs -n lomash-wood deployment/notification-service --tail=200 | grep "registration\|verify"
```

If emails are not being sent, the registration may still succeed but the user won't receive a verification link. Follow the notification-service logs.

**Step 3 — Check if the user record was partially created:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_auth -c \
  "SELECT id, email, email_verified, created_at, role FROM users WHERE email = '<email>' ORDER BY created_at DESC;"
```

If the user exists but `email_verified = false`, resend the verification email:

```bash
curl -X POST https://api.lomashwood.com/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "<email>"}'
```

---

## Scenario 6 — OAuth / Social Login Failure

**Symptoms:** Social login buttons failing. Callback endpoints returning errors.

**Step 1 — Verify OAuth credentials:**

```bash
kubectl get secret lomash-wood-secrets -n lomash-wood \
  -o jsonpath='{.data.GOOGLE_CLIENT_ID}' | base64 -d
```

**Step 2 — Check callback URL configuration:**

Verify the redirect URI in the OAuth provider console matches:
- `https://api.lomashwood.com/v1/auth/callback/google`

**Step 3 — Review OAuth callback logs:**

```bash
kubectl logs -n lomash-wood deployment/auth-service --tail=300 | grep -i "oauth\|callback\|google"
```

---

## Admin Account Recovery

If admin accounts are locked out or inaccessible:

**Step 1 — Generate a temporary admin token:**

```bash
kubectl exec -it <auth-service-pod> -n lomash-wood -- node -e "
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { sub: '<admin-user-id>', role: 'admin', email: 'admin@lomashwood.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log(token);
"
```

**Step 2 — Use the token to reset the admin password:**

```bash
curl -X PATCH https://api.lomashwood.com/v1/auth/admin/reset-password \
  -H "Authorization: Bearer <temporary-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<admin-id>", "newPassword": "<secure-temp-password>"}'
```

**Step 3 — Force the admin to change password on next login:**

```bash
kubectl exec -it postgres-primary-0 -n lomash-wood -- psql -U lomash_admin -d lomash_auth -c \
  "UPDATE users SET must_change_password = true WHERE role = 'admin' AND id = '<admin-id>';"
```

---

## Post-Incident Checklist

- [ ] Root cause identified (database, Redis, JWT config, rate limit, brute force)
- [ ] Affected users notified if sessions were invalidated
- [ ] Security audit log reviewed for suspicious activity
- [ ] Rate limiting rules tuned if too aggressive or too permissive
- [ ] JWT secret rotated if compromised (with user communication plan)
- [ ] AWS WAF updated if attack traffic was identified
- [ ] Monitoring alerts confirmed as working
- [ ] Post-mortem documented

Reference: `security/policies/auth-policy.md` for authentication policy requirements.