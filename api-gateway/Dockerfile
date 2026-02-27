
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

COPY api-gateway/package*.json ./
COPY api-gateway/tsconfig.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY api-gateway/src ./src

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN apk add --no-cache dumb-init

COPY api-gateway/package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

COPY api-gateway/.env.example ./.env.example

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]

FROM node:20-alpine AS development

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

COPY api-gateway/package*.json ./
COPY api-gateway/tsconfig.json ./
COPY api-gateway/nodemon.json ./

RUN npm install

COPY api-gateway/src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]
