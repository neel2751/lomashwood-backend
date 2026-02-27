
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
COPY services/customer-service/package.json   ./services/customer-service/

RUN pnpm install --frozen-lockfile --filter customer-service...


FROM deps AS prisma-gen

COPY services/customer-service/prisma ./services/customer-service/prisma
RUN pnpm --filter customer-service exec prisma generate


FROM prisma-gen AS builder

COPY packages/                               ./packages/
COPY services/customer-service/src           ./services/customer-service/src
COPY services/customer-service/tsconfig.json ./services/customer-service/tsconfig.json

RUN pnpm --filter customer-service build


FROM lomash-base:20-alpine AS runner

WORKDIR /app

COPY --from=deps       --chown=nodeuser:nodejs /app/node_modules                         ./node_modules
COPY --from=deps       --chown=nodeuser:nodejs /app/packages                             ./packages
COPY --from=prisma-gen --chown=nodeuser:nodejs /app/node_modules/.prisma                 ./node_modules/.prisma
COPY --from=builder    --chown=nodeuser:nodejs /app/services/customer-service/dist       ./dist
COPY --from=builder    --chown=nodeuser:nodejs /app/services/customer-service/package.json ./package.json
COPY --from=builder    --chown=nodeuser:nodejs /app/services/customer-service/prisma     ./prisma

USER nodeuser

EXPOSE 3006

ENV PORT=3006
ENV SERVICE_NAME=customer-service

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fs http://localhost:3006/health || exit 1

CMD ["node", "dist/main.js"]
