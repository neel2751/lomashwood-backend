#!/bin/bash

echo "🐳 Building Docker images for Lomash Wood Backend Microservices..."

# Build all service images
services=("api-gateway" "auth-service" "product-service" "order-service" "appointment-service" "customer-service" "content-service" "notification-service" "analytics-service" "upload-service")

for service in "${services[@]}"; do
    echo "🔨 Building $service image..."
    docker build -t lomashwood/$service:latest ./services/$service
done

echo "✅ All Docker images built successfully!"
