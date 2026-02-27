
FROM node:20.14.0-alpine3.20 AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json       ./packages/shared-types/
COPY packages/shared-utils/package.json       ./packages/shared-utils/
COPY packages/shared-validation/package.json  ./packages/shared-validation/
COPY packages/event-bus/package.json          ./packages/event-bus/
COPY services/auth-service/package.json       ./services/auth-service/

RUN pnpm install --frozen-lockfile --filter auth-service...


FROM deps AS prisma-gen

COPY services/auth-service/prisma ./services/auth-service/prisma
RUN pnpm --filter auth-service exec prisma generate


FROM prisma-gen AS builder

COPY packages/                        ./packages/
COPY services/auth-service/src        ./services/auth-service/src
COPY services/auth-service/tsconfig.json ./services/auth-service/tsconfig.json

RUN pnpm --filter auth-service build


FROM lomash-base:20-alpine AS runner

WORKDIR /app

COPY --from=deps       --chown=nodeuser:nodejs /app/node_modules                      ./node_modules
COPY --from=deps       --chown=nodeuser:nodejs /app/packages                          ./packages
COPY --from=prisma-gen --chown=nodeuser:nodejs /app/node_modules/.prisma              ./node_modules/.prisma
COPY --from=builder    --chown=nodeuser:nodejs /app/services/auth-service/dist        ./dist
COPY --from=builder    --chown=nodeuser:nodejs /app/services/auth-service/package.json ./package.json
COPY --from=builder    --chown=nodeuser:nodejs /app/services/auth-service/prisma      ./prisma

USER nodeuser

EXPOSE 3001

ENV PORT=3001
ENV SERVICE_NAME=auth-service

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fs http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
