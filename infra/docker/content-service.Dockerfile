
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
COPY services/content-service/package.json    ./services/content-service/

RUN pnpm install --frozen-lockfile --filter content-service...


FROM deps AS prisma-gen

COPY services/content-service/prisma ./services/content-service/prisma
RUN pnpm --filter content-service exec prisma generate


FROM prisma-gen AS builder

COPY packages/                              ./packages/
COPY services/content-service/src           ./services/content-service/src
COPY services/content-service/tsconfig.json ./services/content-service/tsconfig.json

RUN pnpm --filter content-service build


FROM lomash-base:20-alpine AS runner

WORKDIR /app


RUN apk add --no-cache vips-dev fftw-dev build-base python3

COPY --from=deps       --chown=nodeuser:nodejs /app/node_modules                        ./node_modules
COPY --from=deps       --chown=nodeuser:nodejs /app/packages                            ./packages
COPY --from=prisma-gen --chown=nodeuser:nodejs /app/node_modules/.prisma                ./node_modules/.prisma
COPY --from=builder    --chown=nodeuser:nodejs /app/services/content-service/dist       ./dist
COPY --from=builder    --chown=nodeuser:nodejs /app/services/content-service/package.json ./package.json
COPY --from=builder    --chown=nodeuser:nodejs /app/services/content-service/prisma     ./prisma

USER nodeuser

EXPOSE 3005

ENV PORT=3005
ENV SERVICE_NAME=content-service

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fs http://localhost:3005/health || exit 1

CMD ["node", "dist/main.js"]
