# PowerShell script to restart Lomash Wood Backend Microservices

Write-Host "🔄 Restarting Lomash Wood Backend Microservices..." -ForegroundColor Green

# Stop all services
Write-Host "🛑 Stopping all services..." -ForegroundColor Blue

if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 stop all
    pm2 delete all
}

if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose down
}

# Wait a moment for services to stop
Start-Sleep -Seconds 3

# Start services again
Write-Host "🚀 Starting all services..." -ForegroundColor Blue

if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 start ecosystem.config.js
} elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose up -d
} else {
    Write-Host "⚠️  Neither PM2 nor Docker Compose found. Starting services manually..." -ForegroundColor Yellow
    # Start services manually
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/api-gateway" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/auth-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/product-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/order-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/appointment-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/customer-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/content-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/notification-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/analytics-service" -WindowStyle Hidden
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "services/upload-service" -WindowStyle Hidden
}

Write-Host "✅ Services restarted!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🏥 Checking service health..." -ForegroundColor Blue
Start-Sleep -Seconds 5
.\scripts\health-check.ps1
