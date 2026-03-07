# PowerShell script to view logs for Lomash Wood Backend Services

param(
    [Parameter(Mandatory=$false)]
    [string]$Service = ""
)

Write-Host "📋 Viewing logs for Lomash Wood Backend Services..." -ForegroundColor Green

# Available services
$services = @(
    "api-gateway",
    "auth-service", 
    "product-service",
    "order-service",
    "appointment-service",
    "customer-service",
    "content-service",
    "notification-service",
    "analytics-service",
    "upload-service"
)

if ([string]::IsNullOrEmpty($Service)) {
    Write-Host "Usage: .\logs.ps1 -Service <service-name>" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "Available services:" -ForegroundColor Cyan
    foreach ($svc in $services) {
        Write-Host "  $svc" -ForegroundColor White
    }
    Write-Host "" -ForegroundColor White
    Write-Host "Or use 'all' to view all service logs" -ForegroundColor Cyan
    exit 1
}

# Function to show logs for a service
function Show-Logs {
    param([string]$service)
    
    Write-Host "📋 Showing logs for $service..." -ForegroundColor Blue
    
    # Check if service is running with PM2
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        $pm2List = pm2 list 2>$null
        if ($pm2List -match $service) {
            pm2 logs $service --lines 50
            return
        }
    }
    
    # Check if service is running with Docker
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerPs = docker ps --format "table {{.Names}}" 2>$null
        if ($dockerPs -match "lomashwood-$service") {
            docker logs --tail 50 "lomashwood-$service"
            return
        }
    }
    
    # Check if service is running as a process
    $process = Get-Process | Where-Object { $_.ProcessName -like "*$service*" } -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Service is running but logs are not available through PM2 or Docker" -ForegroundColor Yellow
        Write-Host "Check the logs directory or use Event Viewer" -ForegroundColor Yellow
        return
    }
    
    Write-Host "❌ Service $service is not running" -ForegroundColor Red
}

# Show logs for specific service or all services
if ($Service -eq "all") {
    Write-Host "📋 Showing logs for all services..." -ForegroundColor Blue
    
    foreach ($service in $services) {
        Write-Host "" -ForegroundColor White
        Write-Host "==========================================" -ForegroundColor Cyan
        Show-Logs -service $service
        Write-Host "==========================================" -ForegroundColor Cyan
    }
} else {
    if ($services -contains $Service) {
        Show-Logs -service $Service
    } else {
        Write-Host "❌ Unknown service: $Service" -ForegroundColor Red
        Write-Host "Available services: $($services -join ', ')" -ForegroundColor Yellow
        exit 1
    }
}
