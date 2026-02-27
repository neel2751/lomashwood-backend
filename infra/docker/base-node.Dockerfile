
FROM node:20.14.0-alpine3.20 AS base

LABEL maintainer="platform-team@lomashwood.co.uk"
LABEL org.opencontainers.image.source="https://github.com/lomash-wood/lomash-wood-backend"


RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nodeuser


RUN apk add --no-cache \
      dumb-init \
      curl \
      ca-certificates \
      openssl \
      tzdata \
 && rm -rf /var/cache/apk/*


ENV TZ=Europe/London


ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate


WORKDIR /app


ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"


EXPOSE 3000


ENTRYPOINT ["dumb-init", "--"]
