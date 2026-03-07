# PowerShell script to run tests for all Lomash Wood Backend Microservices

Write-Host "🧪 Running tests for all Lomash Wood Backend Microservices..." -ForegroundColor Green

# Test API client
Write-Host "📦 Testing API client..." -ForegroundColor Blue
Set-Location packages/api-client
pnpm test
Set-Location ../..

# Test each service
$services = @("api-gateway", "auth-service", "product-service", "order-service", "appointment-service", "customer-service", "content-service", "notification-service", "analytics-service", "upload-service")

foreach ($service in $services) {
    Write-Host "🔍 Testing $service..." -ForegroundColor Blue
    Set-Location services/$service
    pnpm test
    Set-Location ../..
}

Write-Host "✅ All tests completed!" -ForegroundColor Green
