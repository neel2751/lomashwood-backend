# ============================================================
# Stage 1: Base
# ============================================================
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN npm install -g pnpm


# ============================================================
# Stage 2: Dependencies
# ============================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile


# ============================================================
# Stage 3: Builder
# ============================================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build


# ============================================================
# Stage 4: Production Runner
# ============================================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

WORKDIR /app

# Install pnpm for production installs
RUN npm install -g pnpm

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy built output and Prisma artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Set correct ownership
RUN chown -R appuser:nodejs /app

USER appuser

# ---- Environment ----
ENV NODE_ENV=production
ENV PORT=3004

EXPOSE 3004

# ---- Health Check ----
# Appointment service health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# ---- Entrypoint ----
# Run Prisma migrations then start the server
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
