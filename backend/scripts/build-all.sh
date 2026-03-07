#!/bin/bash

echo "🔨 Building all Lomash Wood Backend Microservices..."

# Build API client first
echo "📦 Building API client..."
cd packages/api-client
pnpm build
cd ../..

# Build all services
services=("api-gateway" "auth-service" "product-service" "order-service" "appointment-service" "customer-service" "content-service" "notification-service" "analytics-service" "upload-service")

for service in "${services[@]}"; do
    echo "🔨 Building $service..."
    cd services/$service
    pnpm build
    cd ../..
done

echo "✅ All services built successfully!"
