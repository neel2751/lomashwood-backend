# PowerShell script to deploy Lomash Wood Backend Microservices

Write-Host "🚀 Deploying Lomash Wood Backend Microservices..." -ForegroundColor Green

# Check if we're in production mode
if ($env:NODE_ENV -ne "production") {
    Write-Host "⚠️  Warning: NODE_ENV is not set to 'production'" -ForegroundColor Yellow
    Write-Host "Set NODE_ENV=production before deploying" -ForegroundColor Yellow
    exit 1
}

# Build all services
Write-Host "🔨 Building all services..." -ForegroundColor Blue
.\scripts\build-all.ps1

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Blue
pnpm db:migrate:deploy

# Build Docker images
Write-Host "🐳 Building Docker images..." -ForegroundColor Blue
.\scripts\docker-build.ps1

# Deploy to production (this would be environment-specific)
Write-Host "🚀 Deploying to production..." -ForegroundColor Green

# Example deployment commands (customize based on your deployment strategy)
# docker-compose -f docker-compose.prod.yml up -d
# kubectl apply -f k8s/
# gcloud app deploy

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify all services are running" -ForegroundColor White
Write-Host "2. Check health endpoints" -ForegroundColor White
Write-Host "3. Monitor logs for any issues" -ForegroundColor White
Write-Host "4. Run smoke tests" -ForegroundColor White
