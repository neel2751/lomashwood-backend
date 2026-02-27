# ─────────────────────────────────────────────────────────────────────────────
# Lomash Wood – Analytics Service
# Multi-stage Dockerfile
#   Stage 1 : deps     – install ALL dependencies (including devDeps for build)
#   Stage 2 : builder  – compile TypeScript → dist/
#   Stage 3 : pruner   – produce a lean node_modules (prod only)
#   Stage 4 : runner   – final minimal image shipped to registry
#
# Analytics service handles:
#   • Event tracking & ingestion
#   • Funnel & cohort analysis
#   • Dashboard aggregations
#   • Report generation & exports
#   • Real-time data pipeline (Kafka consumer)
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

# Copy service-specific manifest
COPY services/analytics-service/package.json ./services/analytics-service/

# Copy shared internal packages that analytics-service depends on
COPY packages/shared-types/package.json      ./packages/shared-types/
COPY packages/shared-utils/package.json      ./packages/shared-utils/
COPY packages/shared-validation/package.json ./packages/shared-validation/
COPY packages/event-bus/package.json         ./packages/event-bus/

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
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/analytics-service/node_modules \
                 ./services/analytics-service/node_modules

# Copy shared package sources (needed for tsc path resolution)
COPY packages/ ./packages/

# Copy the service source
COPY services/analytics-service/ ./services/analytics-service/

# Copy root tsconfig that services extend
COPY tsconfig.json ./

WORKDIR /app/services/analytics-service

# Generate Prisma client
# Analytics uses Prisma for storing aggregated metrics, dashboards,
# funnel definitions, export jobs and report metadata
RUN pnpm exec prisma generate

# Compile TypeScript → dist/
RUN pnpm run build


# =============================================================================
# Stage 3 – pruner
# Strip devDependencies so the final image only carries production deps
# =============================================================================
FROM node:${NODE_VERSION} AS pruner

RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/analytics-service/package.json  ./services/analytics-service/
COPY packages/shared-types/package.json       ./packages/shared-types/
COPY packages/shared-utils/package.json       ./packages/shared-utils/
COPY packages/shared-validation/package.json  ./packages/shared-validation/
COPY packages/event-bus/package.json          ./packages/event-bus/

RUN pnpm install --frozen-lockfile --prod


# =============================================================================
# Stage 4 – runner  (final image)
# Minimal, non-root, production-ready container
# =============================================================================
FROM node:${NODE_VERSION} AS runner

# ── Security hardening ────────────────────────────────────────────────────────
RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser

# ── OS dependencies ───────────────────────────────────────────────────────────
# curl      – health-check probe
# dumb-init – correct PID-1 signal forwarding (graceful shutdown)
# python3   – required by some native analytics/csv export packages
# make gcc  – native module compilation (e.g. sharp, better-sqlite3)
RUN apk add --no-cache \
      curl \
      dumb-init \
      python3 \
      make \
      g++

WORKDIR /app

# ── Copy production node_modules ──────────────────────────────────────────────
COPY --from=pruner  --chown=appuser:appgroup \
     /app/node_modules \
     ./node_modules

COPY --from=pruner  --chown=appuser:appgroup \
     /app/services/analytics-service/node_modules \
     ./services/analytics-service/node_modules

# ── Copy compiled output ──────────────────────────────────────────────────────
COPY --from=builder --chown=appuser:appgroup \
     /app/services/analytics-service/dist \
     ./dist

# ── Copy Prisma schema + generated client ─────────────────────────────────────
COPY --from=builder --chown=appuser:appgroup \
     /app/services/analytics-service/prisma \
     ./prisma

COPY --from=builder --chown=appuser:appgroup \
     /app/node_modules/.prisma \
     ./node_modules/.prisma

# ── Copy runtime manifest ─────────────────────────────────────────────────────
COPY --from=builder --chown=appuser:appgroup \
     /app/services/analytics-service/package.json \
     ./package.json

# ── Environment defaults (overridden by K8s ConfigMap / Secrets) ──────────────
ENV NODE_ENV=production \
    PORT=4007 \
    LOG_LEVEL=info \
    # Prisma
    PRISMA_LOG_LEVEL=warn \
    # Graceful shutdown – allow in-flight aggregation jobs to complete
    SHUTDOWN_TIMEOUT_MS=20000 \
    # Event ingestion batch settings
    INGESTION_BATCH_SIZE=500 \
    INGESTION_FLUSH_INTERVAL_MS=5000 \
    # Export job concurrency
    EXPORT_CONCURRENCY=2 \
    # Data retention (days) – used by purge-old-events job
    EVENT_RETENTION_DAYS=365

# ── Expose service port ───────────────────────────────────────────────────────
EXPOSE 4007

# ── Health check ──────────────────────────────────────────────────────────────
# Longer start-period because analytics needs to:
#   1. Connect to Postgres
#   2. Connect to Redis
#   3. Connect to Kafka consumer group
#   4. Warm up in-memory aggregation cache
HEALTHCHECK \
  --interval=30s \
  --timeout=15s \
  --start-period=40s \
  --retries=3 \
  CMD curl -f http://localhost:4007/health || exit 1

# ── Switch to non-root user ───────────────────────────────────────────────────
USER appuser

# ── Entrypoint ────────────────────────────────────────────────────────────────
# dumb-init ensures SIGTERM is forwarded correctly for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
