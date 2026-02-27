FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN npm install -g pnpm@9

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY services/product-service/package.json ./services/product-service/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-validation/package.json ./packages/shared-validation/
COPY packages/event-bus/package.json ./packages/event-bus/
COPY packages/auth-client/package.json ./packages/auth-client/

RUN pnpm install --frozen-lockfile --filter product-service...

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/product-service/node_modules ./services/product-service/node_modules

COPY packages/ ./packages/
COPY services/product-service/ ./services/product-service/
COPY turbo.json ./
COPY tsconfig.json* ./

WORKDIR /app/services/product-service
RUN pnpx prisma generate

WORKDIR /app
RUN pnpm --filter shared-types build 2>/dev/null || true
RUN pnpm --filter shared-utils build 2>/dev/null || true
RUN pnpm --filter shared-validation build 2>/dev/null || true
RUN pnpm --filter event-bus build 2>/dev/null || true
RUN pnpm --filter auth-client build 2>/dev/null || true
RUN pnpm --filter product-service build

FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002

COPY --from=builder --chown=appuser:nodejs /app/services/product-service/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/services/product-service/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/services/product-service/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/services/product-service/node_modules ./node_modules

RUN mkdir -p ./node_modules/@lomash-wood/shared-utils/dist \
             ./node_modules/@lomash-wood/shared-types/dist \
             ./node_modules/@lomash-wood/shared-validation/dist \
             ./node_modules/@lomash-wood/event-bus/dist \
             ./node_modules/@lomash-wood/auth-client/dist

COPY --from=builder --chown=appuser:nodejs /app/packages/shared-types/dist ./node_modules/@lomash-wood/shared-types/dist/
COPY --from=builder --chown=appuser:nodejs /app/packages/shared-utils/dist ./node_modules/@lomash-wood/shared-utils/dist/
COPY --from=builder --chown=appuser:nodejs /app/packages/shared-validation/dist ./node_modules/@lomash-wood/shared-validation/dist/
COPY --from=builder --chown=appuser:nodejs /app/packages/event-bus/dist ./node_modules/@lomash-wood/event-bus/dist/
COPY --from=builder --chown=appuser:nodejs /app/packages/auth-client/dist ./node_modules/@lomash-wood/auth-client/dist/

USER appuser

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["sh", "-c", "node -e \"const { execSync } = require('child_process'); execSync('npx prisma migrate deploy', { stdio: 'inherit' });\" && node dist/main.js"]