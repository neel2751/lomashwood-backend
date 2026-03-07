#!/bin/bash

echo "📋 Viewing logs for Lomash Wood Backend Services..."

# Check if a specific service is requested
if [ $# -eq 0 ]; then
    echo "Usage: ./logs.sh [service-name]"
    echo ""
    echo "Available services:"
    echo "  api-gateway"
    echo "  auth-service"
    echo "  product-service"
    echo "  order-service"
    echo "  appointment-service"
    echo "  customer-service"
    echo "  content-service"
    echo "  notification-service"
    echo "  analytics-service"
    echo "  upload-service"
    echo ""
    echo "Or use 'all' to view all service logs"
    exit 1
fi

SERVICE=$1

# Function to show logs for a service
show_logs() {
    local service=$1
    echo "📋 Showing logs for $service..."
    
    # Check if service is running with PM2
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "$service"; then
            pm2 logs $service --lines 50
            return
        fi
    fi
    
    # Check if service is running with Docker
    if command -v docker &> /dev/null; then
        if docker ps --format "table {{.Names}}" | grep -q "lomashwood-$service"; then
            docker logs --tail 50 "lomashwood-$service"
            return
        fi
    fi
    
    # Check if service is running as a process
    if pgrep -f "$service" > /dev/null; then
        echo "Service is running but logs are not available through PM2 or Docker"
        echo "Check the logs directory or use journalctl"
        return
    fi
    
    echo "❌ Service $service is not running"
}

# Show logs for specific service or all services
if [ "$SERVICE" = "all" ]; then
    echo "📋 Showing logs for all services..."
    
    services=("api-gateway" "auth-service" "product-service" "order-service" "appointment-service" "customer-service" "content-service" "notification-service" "analytics-service" "upload-service")
    
    for service in "${services[@]}"; do
        echo ""
        echo "=========================================="
        show_logs $service
        echo "=========================================="
    done
else
    show_logs $SERVICE
fi
