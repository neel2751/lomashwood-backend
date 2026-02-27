# Pull Request

## 📋 Description


## 🔗 Related Issue
Closes #

## 🏷️ Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 🔧 Refactor
- [ ] 📦 Dependency update
- [ ] 🐳 Docker / Infrastructure change
- [ ] 🗄️ Database / Prisma schema change
- [ ] 📝 Documentation update
- [ ] 🔒 Security fix

---

## 🧩 Affected Services / Packages

**Services:**
- [ ] `api-gateway`
- [ ] `auth-service`
- [ ] `product-service`
- [ ] `appointment-service`
- [ ] `order-payment-service`
- [ ] `content-service`
- [ ] `customer-service`
- [ ] `notification-service`
- [ ] `analytics-service`

**Shared Packages:**
- [ ] `shared-types`
- [ ] `shared-utils`
- [ ] `shared-validation`
- [ ] `event-bus`
- [ ] `auth-client`

---

## 🗄️ Database Changes
- [ ] No database changes
- [ ] New Prisma migration added
- [ ] `schema.prisma` updated
- [ ] Migration is backward compatible
- [ ] Seed data updated

**Migration name (if applicable):**
```
e.g. 20260220000000_add_review_status
```

---

## 🔌 API Changes


| Method | Endpoint | Service | Change |
|--------|----------|---------|--------|
|        |          |         |        |

---

## 🌍 Environment Variables
- [ ] No new environment variables
- [ ] New variables added to `.env.example`

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
|          |         |          |             |

---

## 🐳 Docker / Infrastructure Changes
- [ ] No Docker changes
- [ ] `Dockerfile` updated
- [ ] `docker-compose.yml` updated
- [ ] New service added
- [ ] Health check updated

---

## 🔒 Security Checklist
- [ ] No secrets or API keys committed
- [ ] Input validation added for new endpoints
- [ ] Authentication middleware applied to protected routes
- [ ] Authorization / role checks applied (`requireRole`, `requireAdmin`)
- [ ] Rate limiting applied where needed (`authRateLimiter`, `apiKeyRateLimiter`, etc.)
- [ ] No sensitive data exposed in logs or API responses

---

## ✅ Testing Checklist
- [ ] Project builds without errors (`pnpm build`)
- [ ] TypeScript compiles without errors (`pnpm tsc --noEmit`)
- [ ] All existing tests pass (`pnpm test`)
- [ ] New tests written for new functionality
- [ ] Tested locally with Docker (`docker compose up --build`)
- [ ] API endpoints tested manually (Postman / curl)
- [ ] Health check endpoints verified (`/health`, `/ready`, `/metrics`)
- [ ] Auth flow tested (token verification, refresh, expiry)
- [ ] Rate limiting behaviour verified (if applicable)
- [ ] Prisma migrations run cleanly (`npx prisma migrate deploy`)

---

## 📸 Screenshots / Logs
<details>
<summary>Click to expand</summary>

```
Paste relevant logs, API responses, or screenshots here
```

</details>

---

## 📝 Additional Notes

## 👀 Reviewer Focus Areas

