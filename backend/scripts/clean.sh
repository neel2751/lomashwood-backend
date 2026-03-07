#!/bin/bash

echo "🧹 Cleaning Lomash Wood Backend Microservices..."

# Clean build artifacts
echo "🗑️  Removing build artifacts..."
find . -name "dist" -type d -exec rm -rf {} +
find . -name "node_modules" -type d -exec rm -rf {} +

# Clean generated files
echo "🗑️  Removing generated files..."
rm -f packages/api-client/dist/*
rm -f services/*/dist/*

# Clean logs
echo "🗑️  Removing log files..."
find . -name "*.log" -delete
find . -name "logs" -type d -exec rm -rf {} +

# Clean Docker
echo "🐳 Cleaning Docker..."
docker-compose down --volumes --remove-orphans
docker system prune -f

echo "✅ Cleaning complete!"
