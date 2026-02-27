
FROM postgres:16.3-alpine

LABEL maintainer="platform-team@lomashwood.co.uk"
LABEL description="Lomash Wood local dev PostgreSQL — all service databases"

RUN apk add --no-cache \
      curl \
      bash \
      tzdata \
 && rm -rf /var/cache/apk/*

ENV TZ=Europe/London
ENV PGDATA=/var/lib/postgresql/data/pgdata

COPY init.sql /docker-entrypoint-initdb.d/00_init.sql

COPY postgresql.dev.conf /etc/postgresql/postgresql.dev.conf

HEALTHCHECK \
  --interval=10s \
  --timeout=5s \
  --start-period=30s \
  --retries=5 \
  CMD pg_isready -U "${POSTGRES_USER:-lomash_master}" -d "${POSTGRES_DB:-lomash_dev}" || exit 1


COPY docker-entrypoint-override.sh /docker-entrypoint-override.sh
RUN chmod +x /docker-entrypoint-override.sh

ENTRYPOINT ["/docker-entrypoint-override.sh"]
CMD ["postgres"]

EXPOSE 5432
