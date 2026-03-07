#!/bin/bash

echo "🏥 Checking health of all Lomash Wood Backend Services..."

# Service ports
declare -A SERVICES=(
    ["api-gateway"]="3000"
    ["auth-service"]="3001"
    ["product-service"]="3002"
    ["order-service"]="3003"
    ["appointment-service"]="3004"
    ["customer-service"]="3005"
    ["content-service"]="3006"
    ["notification-service"]="3007"
    ["analytics-service"]="3008"
    ["upload-service"]="3009"
)

# Check each service
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    echo "🔍 Checking $service (port $port)..."
    
    # Try to connect to the service
    if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is not responding"
        
        # Try to get more details
        if curl -s "http://localhost:$port/health" 2>/dev/null; then
            echo "   Service responded but with error status"
        else
            echo "   Service is not reachable"
        fi
    fi
done

echo ""
echo "🏥 Health check completed!"
echo ""
echo "📊 Summary:"
echo "✅ Healthy services: $(grep -c "✅" <<< "$(for service in "${!SERVICES[@]}"; do curl -s -f "http://localhost:${SERVICES[$service]}/health" > /dev/null 2>&1 && echo "✅" || echo "❌"; done)")"
echo "❌ Unhealthy services: $(grep -c "❌" <<< "$(for service in "${!SERVICES[@]}"; do curl -s -f "http://localhost:${SERVICES[$service]}/health" > /dev/null 2>&1 && echo "✅" || echo "❌"; done)")"
