#!/bin/bash

echo "🧪 Running tests for all Lomash Wood Backend Microservices..."

# Test API client
echo "📦 Testing API client..."
cd packages/api-client
pnpm test
cd ../..

# Test each service
services=("api-gateway" "auth-service" "product-service" "order-service" "appointment-service" "customer-service" "content-service" "notification-service" "analytics-service" "upload-service")

for service in "${services[@]}"; do
    echo "🔍 Testing $service..."
    cd services/$service
    pnpm test
    cd ../..
done

echo "✅ All tests completed!"
