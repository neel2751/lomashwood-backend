
FROM redis:7.2.5-alpine

LABEL maintainer="platform-team@lomashwood.co.uk"
LABEL description="Lomash Wood local dev Redis — all service caches and queues"


RUN apk add --no-cache \
      curl \
      bash \
      tzdata \
 && rm -rf /var/cache/apk/*

ENV TZ=Europe/London


RUN mkdir -p /data \
 && chown redis:redis /data

VOLUME ["/data"]


RUN mkdir -p /usr/local/etc/redis
COPY redis.conf /usr/local/etc/redis/redis.conf


RUN mkdir -p /tls && chown redis:redis /tls

COPY docker-entrypoint-redis.sh /usr/local/bin/docker-entrypoint-redis.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-redis.sh


USER redis

HEALTHCHECK \
  --interval=10s \
  --timeout=5s \
  --start-period=20s \
  --retries=5 \
  CMD redis-cli \
        -a "${REDIS_PASSWORD:-changeme_local}" \
        --no-auth-warning \
        ping | grep -q PONG || exit 1

EXPOSE 6379

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-redis.sh"]
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
