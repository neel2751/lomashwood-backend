# PowerShell script to clean Lomash Wood Backend Microservices

Write-Host "🧹 Cleaning Lomash Wood Backend Microservices..." -ForegroundColor Green

# Clean build artifacts
Write-Host "🗑️  Removing build artifacts..." -ForegroundColor Blue
Get-ChildItem -Path . -Recurse -Directory -Name "dist" | ForEach-Object { Remove-Item -Path $_ -Recurse -Force }
Get-ChildItem -Path . -Recurse -Directory -Name "node_modules" | ForEach-Object { Remove-Item -Path $_ -Recurse -Force }

# Clean generated files
Write-Host "🗑️  Removing generated files..." -ForegroundColor Blue
Remove-Item -Path "packages/api-client/dist/*" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "services" -Recurse -Directory -Name "dist" | ForEach-Object { Remove-Item -Path $_ -Recurse -Force }

# Clean logs
Write-Host "🗑️  Removing log files..." -ForegroundColor Blue
Get-ChildItem -Path . -Recurse -File -Name "*.log" | ForEach-Object { Remove-Item -Path $_ -Force }
Get-ChildItem -Path . -Recurse -Directory -Name "logs" | ForEach-Object { Remove-Item -Path $_ -Recurse -Force }

# Clean Docker
Write-Host "🐳 Cleaning Docker..." -ForegroundColor Blue
try {
    docker-compose down --volumes --remove-orphans
    docker system prune -f
} catch {
    Write-Host "⚠️  Docker not available or not running." -ForegroundColor Yellow
}

Write-Host "✅ Cleaning complete!" -ForegroundColor Green
