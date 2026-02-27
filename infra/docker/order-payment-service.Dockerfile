
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
COPY packages/payment-client/package.json     ./packages/payment-client/
COPY services/order-payment-service/package.json ./services/order-payment-service/

RUN pnpm install --frozen-lockfile --filter order-payment-service...

FROM deps AS prisma-gen

COPY services/order-payment-service/prisma ./services/order-payment-service/prisma
RUN pnpm --filter order-payment-service exec prisma generate

FROM prisma-gen AS builder

COPY packages/                                     ./packages/
COPY services/order-payment-service/src            ./services/order-payment-service/src
COPY services/order-payment-service/tsconfig.json  ./services/order-payment-service/tsconfig.json

RUN pnpm --filter order-payment-service build

FROM lomash-base:20-alpine AS runner

WORKDIR /app

COPY --from=deps       --chown=nodeuser:nodejs /app/node_modules                              ./node_modules
COPY --from=deps       --chown=nodeuser:nodejs /app/packages                                  ./packages
COPY --from=prisma-gen --chown=nodeuser:nodejs /app/node_modules/.prisma                      ./node_modules/.prisma
COPY --from=builder    --chown=nodeuser:nodejs /app/services/order-payment-service/dist       ./dist
COPY --from=builder    --chown=nodeuser:nodejs /app/services/order-payment-service/package.json ./package.json
COPY --from=builder    --chown=nodeuser:nodejs /app/services/order-payment-service/prisma     ./prisma

USER nodeuser

EXPOSE 3003

ENV PORT=3003
ENV SERVICE_NAME=order-payment-service

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fs http://localhost:3003/health || exit 1

CMD ["node", "dist/main.js"]
