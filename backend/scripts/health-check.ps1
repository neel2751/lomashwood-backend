# PowerShell script to check health of all Lomash Wood Backend Services

Write-Host "🏥 Checking health of all Lomash Wood Backend Services..." -ForegroundColor Green

# Service ports
$services = @{
    "api-gateway" = 3000
    "auth-service" = 3001
    "product-service" = 3002
    "order-service" = 3003
    "appointment-service" = 3004
    "customer-service" = 3005
    "content-service" = 3006
    "notification-service" = 3007
    "analytics-service" = 3008
    "upload-service" = 3009
}

$healthyCount = 0
$unhealthyCount = 0

# Check each service
foreach ($service in $services.Keys) {
    $port = $services[$service]
    Write-Host "🔍 Checking $service (port $port)..." -ForegroundColor Blue
    
    try {
        # Try to connect to the service
        $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $service is healthy" -ForegroundColor Green
        $healthyCount++
    }
    catch {
        Write-Host "❌ $service is not responding" -ForegroundColor Red
        
        # Try to get more details
        try {
            $errorResponse = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            Write-Host "   Service responded but with error status" -ForegroundColor Yellow
        }
        catch {
            Write-Host "   Service is not reachable" -ForegroundColor Yellow
        }
        $unhealthyCount++
    }
}

Write-Host "" -ForegroundColor White
Write-Host "🏥 Health check completed!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "✅ Healthy services: $healthyCount" -ForegroundColor Green
Write-Host "❌ Unhealthy services: $unhealthyCount" -ForegroundColor Red

if ($unhealthyCount -gt 0) {
    Write-Host "" -ForegroundColor White
    Write-Host "⚠️  Some services are unhealthy. Check logs for details." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "" -ForegroundColor White
    Write-Host "🎉 All services are healthy!" -ForegroundColor Green
}
