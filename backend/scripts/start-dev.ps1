# PowerShell script to start Lomash Wood Backend Microservices in Development Mode

Write-Host "🚀 Starting Lomash Wood Backend Microservices in Development Mode..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please review and update the configuration." -ForegroundColor Green
}

# Start database and Redis with Docker (if available)
try {
    $dockerVersion = docker-compose --version
    Write-Host "🐳 Starting database and Redis with Docker..." -ForegroundColor Blue
    docker-compose up -d postgres redis
    Start-Sleep -Seconds 5
} catch {
    Write-Host "⚠️  Docker Compose not found. Please start PostgreSQL and Redis manually." -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Blue
pnpm db:generate

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Blue
pnpm db:migrate

# Start all services in development mode
Write-Host "🚀 Starting all microservices..." -ForegroundColor Green
pnpm dev
