FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../../pnpm-lock.yaml ./
COPY ../../pnpm-workspace.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY ../../packages ./packages
COPY src ./src

# Build the application
RUN pnpm build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3007

CMD ["node", "dist/main.js"]
