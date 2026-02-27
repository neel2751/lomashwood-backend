
FROM node:20.14.0-alpine3.20 AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app


COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json       ./packages/shared-types/
COPY packages/shared-utils/package.json       ./packages/shared-utils/
COPY packages/shared-validation/package.json  ./packages/shared-validation/
COPY packages/auth-client/package.json        ./packages/auth-client/
COPY api-gateway/package.json                 ./api-gateway/

RUN pnpm install --frozen-lockfile --filter api-gateway...


FROM deps AS builder

COPY packages/ ./packages/
COPY api-gateway/ ./api-gateway/

RUN pnpm --filter api-gateway... build


FROM lomash-base:20-alpine AS runner

WORKDIR /app


COPY --from=deps    --chown=nodeuser:nodejs /app/node_modules            ./node_modules
COPY --from=deps    --chown=nodeuser:nodejs /app/packages                ./packages
COPY --from=builder --chown=nodeuser:nodejs /app/api-gateway/dist        ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/api-gateway/package.json ./package.json

USER nodeuser

EXPOSE 3000

ENV PORT=3000
ENV SERVICE_NAME=api-gateway

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fs http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
