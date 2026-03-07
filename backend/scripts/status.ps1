# PowerShell script to check status of Lomash Wood Backend Services

Write-Host "📊 Lomash Wood Backend Services Status" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan

# Check PM2 status
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "" -ForegroundColor White
    Write-Host "📋 PM2 Status:" -ForegroundColor Blue
    pm2 status
}

# Check Docker status
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "" -ForegroundColor White
    Write-Host "🐳 Docker Status:" -ForegroundColor Blue
    docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
}

# Check system resources
Write-Host "" -ForegroundColor White
Write-Host "💻 System Resources:" -ForegroundColor Blue

$cpuUsage = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
$memory = Get-WmiObject -Class Win32_OperatingSystem
$memoryUsage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
$diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)

Write-Host "CPU Usage: $cpuUsage%" -ForegroundColor White
Write-Host "Memory Usage: $memoryUsage%" -ForegroundColor White
Write-Host "Disk Usage: $diskUsage%" -ForegroundColor White

# Check database connection
Write-Host "" -ForegroundColor White
Write-Host "🗄️ Database Status:" -ForegroundColor Blue

if (Get-Command psql -ErrorAction SilentlyContinue) {
    try {
        $env:PGPASSWORD = $env:DATABASE_PASSWORD
        $result = & psql -h $env:DATABASE_HOST -U $env:DATABASE_USER -d $env:DATABASE_NAME -c "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Database connection failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  PostgreSQL client not found" -ForegroundColor Yellow
}

# Check Redis connection
Write-Host "" -ForegroundColor White
Write-Host "🔴 Redis Status:" -ForegroundColor Blue

if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
    try {
        $result = redis-cli ping 2>$null
        if ($result -eq "PONG") {
            Write-Host "✅ Redis connection successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Redis connection failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Redis connection failed" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Redis client not found" -ForegroundColor Yellow
}

# Check port availability
Write-Host "" -ForegroundColor White
Write-Host "🔌 Port Status:" -ForegroundColor Blue

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

foreach ($service in $services.Keys) {
    $port = $services[$service]
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        Write-Host "✅ Port $port ($service) is in use" -ForegroundColor Green
    } catch {
        Write-Host "❌ Port $port ($service) is not in use" -ForegroundColor Red
    }
}

# Check log files
Write-Host "" -ForegroundColor White
Write-Host "📝 Log Files:" -ForegroundColor Blue

if (Test-Path "logs") {
    Write-Host "Log directory exists" -ForegroundColor Green
    Write-Host "Recent log files:" -ForegroundColor White
    Get-ChildItem -Path "logs" -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.Name) - $($_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "No logs directory found" -ForegroundColor Yellow
}

# Check environment variables
Write-Host "" -ForegroundColor White
Write-Host "🔧 Environment:" -ForegroundColor Blue

$nodeEnv = $env:NODE_ENV
$databaseUrl = if ($env:DATABASE_URL) { "set" } else { "not set" }
$redisUrl = if ($env:REDIS_URL) { "set" } else { "not set" }
$jwtSecret = if ($env:JWT_SECRET) { "set" } else { "not set" }

Write-Host "NODE_ENV: $nodeEnv" -ForegroundColor White
Write-Host "DATABASE_URL: $databaseUrl" -ForegroundColor White
Write-Host "REDIS_URL: $redisUrl" -ForegroundColor White
Write-Host "JWT_SECRET: $jwtSecret" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📊 Status check completed!" -ForegroundColor Green
