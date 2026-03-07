# PowerShell script to build Docker images for Lomash Wood Backend Microservices

Write-Host "🐳 Building Docker images for Lomash Wood Backend Microservices..." -ForegroundColor Green

$services = @("api-gateway", "auth-service", "product-service", "order-service", "appointment-service", "customer-service", "content-service", "notification-service", "analytics-service", "upload-service")

foreach ($service in $services) {
    Write-Host "🔨 Building $service image..." -ForegroundColor Blue
    docker build -t lomashwood/$service`:latest ./services/$service
}

Write-Host "✅ All Docker images built successfully!" -ForegroundColor Green
