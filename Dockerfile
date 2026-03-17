FROM node:24-alpine AS base

FROM base AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# We create a simple JS config that works in the slim runner environment
RUN echo 'module.exports = { \
  schema: "prisma/schema.prisma", \
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seeds/seed.ts" }, \
  datasource: { url: process.env.DATABASE_URL } \
};' > prisma.config.js

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# LOGIC: 
# 1. Run migrations (This is safe, it never deletes data).
# 2. IF RUN_DB_SEED is "true", run the seed.
# 3. Start the app.
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.js && ([ \"$RUN_DB_SEED\" = \"true\" ] && npx prisma db seed --config prisma.config.js || echo 'Skipping seed') && node server.js"]