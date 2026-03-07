# PowerShell script to build all Lomash Wood Backend Microservices

Write-Host "🔨 Building all Lomash Wood Backend Microservices..." -ForegroundColor Green

# Build API client first
Write-Host "📦 Building API client..." -ForegroundColor Blue
Set-Location packages/api-client
pnpm build
Set-Location ../..

# Build all services
$services = @("api-gateway", "auth-service", "product-service", "order-service", "appointment-service", "customer-service", "content-service", "notification-service", "analytics-service", "upload-service")

foreach ($service in $services) {
    Write-Host "🔨 Building $service..." -ForegroundColor Blue
    Set-Location services/$service
    pnpm build
    Set-Location ../..
}

Write-Host "✅ All services built successfully!" -ForegroundColor Green
