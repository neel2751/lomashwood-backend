#!/bin/bash

echo "🚀 Deploying Lomash Wood Backend Microservices..."

# Check if we're in production mode
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
    echo "Set NODE_ENV=production before deploying"
    exit 1
fi

# Build all services
echo "🔨 Building all services..."
./scripts/build-all.sh

# Run database migrations
echo "🗄️ Running database migrations..."
pnpm db:migrate:deploy

# Build Docker images
echo "🐳 Building Docker images..."
./scripts/docker-build.sh

# Deploy to production (this would be environment-specific)
echo "🚀 Deploying to production..."

# Example deployment commands (customize based on your deployment strategy)
# docker-compose -f docker-compose.prod.yml up -d
# kubectl apply -f k8s/
# gcloud app deploy

echo "✅ Deployment completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Verify all services are running"
echo "2. Check health endpoints"
echo "3. Monitor logs for any issues"
echo "4. Run smoke tests"
