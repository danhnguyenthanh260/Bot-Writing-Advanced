# Script kiểm tra và sửa port trong .env

Write-Host "🔍 Kiểm tra containers PostgreSQL..." -ForegroundColor Cyan

# Kiểm tra containers đang chạy
$containers = docker ps --format "{{.Names}}:{{.Ports}}" | Select-String "postgres"
Write-Host "`nContainers đang chạy:" -ForegroundColor Yellow
$containers

Write-Host "`n🔍 Kiểm tra .env file..." -ForegroundColor Cyan

if (Test-Path .env) {
    $content = Get-Content .env -Raw
    $databaseUrl = $content | Select-String -Pattern "DATABASE_URL=(.+)"
    
    if ($databaseUrl) {
        $url = $databaseUrl.Matches[0].Groups[1].Value
        Write-Host "`nDATABASE_URL hiện tại:" -ForegroundColor Yellow
        Write-Host $url -ForegroundColor Gray
        
        # Kiểm tra port
        if ($url -match "localhost:(\d+)") {
            $port = $matches[1]
            Write-Host "`nPort hiện tại: $port" -ForegroundColor Yellow
            
            if ($port -eq "54333") {
                Write-Host "❌ Port SAI: 54333 (phải là 5433)" -ForegroundColor Red
                Write-Host "`n💡 Sửa .env:" -ForegroundColor Cyan
                Write-Host "DATABASE_URL=postgresql://postgres:12345@localhost:5433/bot_writing_advanced" -ForegroundColor Green
            }
            elseif ($port -eq "5433") {
                Write-Host "✅ Port ĐÚNG: 5433" -ForegroundColor Green
            }
            elseif ($port -eq "5432") {
                Write-Host "⚠️  Port 5432 - Đang kết nối vào PostgreSQL Windows hoặc container khác" -ForegroundColor Yellow
                Write-Host "💡 Nếu muốn dùng container postgres-pgvector, đổi sang port 5433" -ForegroundColor Cyan
            }
        }
    }
    else {
        Write-Host "❌ Không tìm thấy DATABASE_URL trong .env" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ File .env không tồn tại" -ForegroundColor Red
}

Write-Host "`n📋 Hướng dẫn:" -ForegroundColor Cyan
Write-Host "1. Kiểm tra container: docker ps | findstr postgres-pgvector" -ForegroundColor White
Write-Host "2. Sửa .env: DATABASE_URL=postgresql://postgres:12345@localhost:5433/bot_writing_advanced" -ForegroundColor White
Write-Host "3. Test: npm run db:test" -ForegroundColor White




