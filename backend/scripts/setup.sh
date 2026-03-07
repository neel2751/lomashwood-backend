#!/bin/bash

echo "🚀 Setting up Lomash Wood Backend Microservices..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm found"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm db:generate

# Build all services
echo "🔨 Building all services..."
pnpm build

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Copy .env.example to .env and configure your environment variables"
echo "2. Run 'pnpm db:migrate' to set up the database"
echo "3. Run 'pnpm dev' to start all services in development mode"
echo "4. Or run 'docker-compose up' to start with Docker"
echo ""
echo "📚 For more information, see README.md"
