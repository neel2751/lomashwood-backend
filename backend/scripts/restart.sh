#!/bin/bash

echo "🔄 Restarting Lomash Wood Backend Microservices..."

# Stop all services
echo "🛑 Stopping all services..."
if command -v pm2 &> /dev/null; then
    pm2 stop all
    pm2 delete all
fi

if command -v docker-compose &> /dev/null; then
    docker-compose down
fi

# Wait a moment for services to stop
sleep 3

# Start services again
echo "🚀 Starting all services..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js
else
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        echo "⚠️  Neither PM2 nor Docker Compose found. Starting services manually..."
        # Start services manually
        cd services/api-gateway && npm start &
        cd ../auth-service && npm start &
        cd ../product-service && npm start &
        cd ../order-service && npm start &
        cd ../appointment-service && npm start &
        cd ../customer-service && npm start &
        cd ../content-service && npm start &
        cd ../notification-service && npm start &
        cd ../analytics-service && npm start &
        cd ../upload-service && npm start &
        cd ../..
    fi
fi

echo "✅ Services restarted!"
echo ""
echo "🏥 Checking service health..."
sleep 5
./scripts/health-check.sh
