# PowerShell script để kiểm tra luồng hoạt động trên Docker

Write-Host "🔍 Kiểm tra luồng hoạt động Docker..." -ForegroundColor Cyan
Write-Host ""

# Function to check service
function Check-Service {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Expected = ""
    )
    
    Write-Host "Checking $Name... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✓ OK" -ForegroundColor Green
        if ($Expected -and $response.Content) {
            Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
        }
        return $true
    }
    catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
        return $false
    }
}

# Wait for services
Write-Host "⏳ Đợi services khởi động..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check services
Write-Host ""
Write-Host "📊 Kiểm tra Health Checks:" -ForegroundColor Cyan
Write-Host ""

Check-Service -Name "Embedding Server" -Url "http://localhost:8000/health" -Expected "status"
Check-Service -Name "Backend API" -Url "http://localhost:3001/health" -Expected "status"
Check-Service -Name "Frontend" -Url "http://localhost:3000"

Write-Host ""
Write-Host "🔧 Kiểm tra Database Connection:" -ForegroundColor Cyan
Write-Host ""

# Test database connection
try {
    docker-compose exec -T backend npm run db:test 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ Database connection test failed (có thể do schema chưa deploy)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Database connection test failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Kiểm tra Schema:" -ForegroundColor Cyan
Write-Host ""

try {
    docker-compose exec -T backend npm run db:check 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema check OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ Schema check failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Schema check failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🧪 Test Embedding Service:" -ForegroundColor Cyan
Write-Host ""

# Test embedding
try {
    $body = @{ text = "Hello world" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:8000/embed" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✓ Embedding service working" -ForegroundColor Green
    Write-Host "  Dimensions: $($response.dimensions)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Embedding service test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Kiểm tra hoàn tất!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:3001"
Write-Host "  Embedding: http://localhost:8000"
Write-Host "  Database: localhost:5432"
Write-Host ""
Write-Host "📋 Xem logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Dừng services: docker-compose down" -ForegroundColor Yellow


