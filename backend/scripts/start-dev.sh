#!/bin/bash

echo "🚀 Starting Lomash Wood Backend Microservices in Development Mode..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update the configuration."
fi

# Start database and Redis with Docker (if available)
if command -v docker-compose &> /dev/null; then
    echo "🐳 Starting database and Redis with Docker..."
    docker-compose up -d postgres redis
    sleep 5
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm db:generate

# Run database migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

# Start all services in development mode
echo "🚀 Starting all microservices..."
pnpm dev
