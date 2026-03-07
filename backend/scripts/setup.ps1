# PowerShell setup script for Lomash Wood Backend Microservices

Write-Host "🚀 Setting up Lomash Wood Backend Microservices..." -ForegroundColor Green

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm found (version: $pnpmVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm is not installed. Please install pnpm first:" -ForegroundColor Red
    Write-Host "npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
pnpm install

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Blue
pnpm db:generate

# Build all services
Write-Host "🔨 Building all services..." -ForegroundColor Blue
pnpm build

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.example to .env and configure your environment variables" -ForegroundColor White
Write-Host "2. Run 'pnpm db:migrate' to set up the database" -ForegroundColor White
Write-Host "3. Run 'pnpm dev' to start all services in development mode" -ForegroundColor White
Write-Host "4. Or run 'docker-compose up' to start with Docker" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "📚 For more information, see README.md" -ForegroundColor Cyan
