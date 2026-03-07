#!/bin/bash

echo "📊 Lomash Wood Backend Services Status"
echo "=================================="

# Check PM2 status
if command -v pm2 &> /dev/null; then
    echo ""
    echo "📋 PM2 Status:"
    pm2 status
fi

# Check Docker status
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi

# Check system resources
echo ""
echo "💻 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
echo "Memory Usage: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Disk Usage: $(df -h . | awk 'NR==2{print $5}')"

# Check database connection
echo ""
    echo "🗄️ Database Status:"
if command -v psql &> /dev/null; then
    if PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SELECT 1;" &> /dev/null; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
    fi
else
    echo "⚠️  PostgreSQL client not found"
fi

# Check Redis connection
echo ""
echo "🔴 Redis Status:"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis connection successful"
    else
        echo "❌ Redis connection failed"
    fi
else
    echo "⚠️  Redis client not found"
fi

# Check port availability
echo ""
echo "🔌 Port Status:"
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

for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "✅ Port $port ($service) is in use"
    else
        echo "❌ Port $port ($service) is not in use"
    fi
done

# Check log files
echo ""
echo "📝 Log Files:"
if [ -d "logs" ]; then
    echo "Log directory exists"
    echo "Recent log files:"
    ls -la logs/ 2>/dev/null | head -10
else
    echo "No logs directory found"
fi

# Check environment variables
echo ""
echo "🔧 Environment:"
echo "NODE_ENV: ${NODE_ENV:-'not set'}"
echo "DATABASE_URL: ${DATABASE_URL:+'set'}"
echo "REDIS_URL: ${REDIS_URL:+'set'}"
echo "JWT_SECRET: ${JWT_SECRET:+'set'}"

echo ""
echo "=================================="
echo "📊 Status check completed!"
