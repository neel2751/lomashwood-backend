# ─────────────────────────────────────────────────────────────────────────────
# Lomash Wood – Customer Service
# Multi-stage Dockerfile
#   Stage 1 : deps     – install ALL dependencies (including devDeps for build)
#   Stage 2 : builder  – compile TypeScript → dist/
#   Stage 3 : pruner   – produce a lean node_modules (prod only)
#   Stage 4 : runner   – final minimal image shipped to registry
# ─────────────────────────────────────────────────────────────────────────────

# ── Global build args ─────────────────────────────────────────────────────────
ARG NODE_VERSION=20-alpine3.19
ARG PNPM_VERSION=9.1.0

# =============================================================================
# Stage 1 – deps
# Install all deps (dev + prod) so TypeScript can compile
# =============================================================================
FROM node:${NODE_VERSION} AS deps

# Install pnpm globally
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Copy workspace root manifests (monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy service-specific manifests
COPY services/customer-service/package.json ./services/customer-service/

# Copy shared internal packages that this service depends on
COPY packages/shared-types/package.json    ./packages/shared-types/
COPY packages/shared-utils/package.json    ./packages/shared-utils/
COPY packages/shared-validation/package.json ./packages/shared-validation/
COPY packages/event-bus/package.json       ./packages/event-bus/

# Install everything (workspace-aware, frozen lockfile)
RUN pnpm install --frozen-lockfile


# =============================================================================
# Stage 2 – builder
# Compile TypeScript source to JavaScript
# =============================================================================
FROM node:${NODE_VERSION} AS builder

RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/services/customer-service/node_modules \
                                                ./services/customer-service/node_modules

# Copy shared package sources (needed for tsc path resolution)
COPY packages/ ./packages/

# Copy the service source
COPY services/customer-service/ ./services/customer-service/

# Copy root tsconfig that services extend
COPY tsconfig.json ./

WORKDIR /app/services/customer-service

# Generate Prisma client before compiling
RUN pnpm exec prisma generate

# Compile TypeScript
RUN pnpm run build


# =============================================================================
# Stage 3 – pruner
# Strip devDependencies so the final image only carries production deps
# =============================================================================
FROM node:${NODE_VERSION} AS pruner

RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/customer-service/package.json ./services/customer-service/
COPY packages/shared-types/package.json     ./packages/shared-types/
COPY packages/shared-utils/package.json     ./packages/shared-utils/
COPY packages/shared-validation/package.json ./packages/shared-validation/
COPY packages/event-bus/package.json        ./packages/event-bus/

RUN pnpm install --frozen-lockfile --prod


# =============================================================================
# Stage 4 – runner  (final image)
# Minimal, non-root, production-ready container
# =============================================================================
FROM node:${NODE_VERSION} AS runner

# ── Security hardening ────────────────────────────────────────────────────────
# Run as a non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser

# ── OS dependencies ───────────────────────────────────────────────────────────
# curl  – health-check probe
# dumb-init – PID-1 signal handling
RUN apk add --no-cache curl dumb-init

WORKDIR /app

# ── Copy production node_modules ──────────────────────────────────────────────
COPY --from=pruner  --chown=appuser:appgroup \
     /app/node_modules                   ./node_modules
COPY --from=pruner  --chown=appuser:appgroup \
     /app/services/customer-service/node_modules \
                                         ./services/customer-service/node_modules

# ── Copy compiled output ──────────────────────────────────────────────────────
COPY --from=builder --chown=appuser:appgroup \
     /app/services/customer-service/dist ./dist

# ── Copy Prisma schema + generated client ─────────────────────────────────────
COPY --from=builder --chown=appuser:appgroup \
     /app/services/customer-service/prisma ./prisma

COPY --from=builder --chown=appuser:appgroup \
     /app/node_modules/.prisma           ./node_modules/.prisma

# ── Copy runtime config ───────────────────────────────────────────────────────
COPY --from=builder --chown=appuser:appgroup \
     /app/services/customer-service/package.json ./package.json

# ── Environment defaults (overridden by K8s ConfigMap / Secrets) ──────────────
ENV NODE_ENV=production \
    PORT=4005 \
    LOG_LEVEL=info \
    # Prisma
    PRISMA_LOG_LEVEL=warn \
    # Graceful shutdown window
    SHUTDOWN_TIMEOUT_MS=10000

# ── Expose service port ───────────────────────────────────────────────────────
EXPOSE 4005

# ── Health check (Kubernetes also has its own probe) ─────────────────────────
HEALTHCHECK \
  --interval=30s \
  --timeout=10s \
  --start-period=20s \
  --retries=3 \
  CMD curl -f http://localhost:4005/health || exit 1

# ── Switch to non-root user ───────────────────────────────────────────────────
USER appuser

# ── Entrypoint ────────────────────────────────────────────────────────────────
# dumb-init ensures SIGTERM is forwarded correctly for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
