# PowerShell script to start all services
# Usage: .\start_all.ps1

Write-Host "🚀 Starting all services..." -ForegroundColor Green

# Check Python
Write-Host "`n📋 Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ $pythonVersion" -ForegroundColor Green

# Check Python dependencies
Write-Host "`n📋 Checking Python dependencies..." -ForegroundColor Yellow
python -c "import sentence_transformers; import fastapi; import uvicorn" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Python dependencies missing. Installing..." -ForegroundColor Yellow
    python -m pip install sentence-transformers fastapi uvicorn
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Python dependencies!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Python dependencies installed" -ForegroundColor Green

# Check Node.js dependencies
Write-Host "`n📋 Checking Node.js dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Node modules not found. Installing..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Node.js dependencies!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green

# Start all services
Write-Host "`n🚀 Starting all services with concurrently..." -ForegroundColor Green
Write-Host "   - Local Embedding Server (port 8000)" -ForegroundColor Cyan
Write-Host "   - Backend Server (port 3001)" -ForegroundColor Cyan
Write-Host "   - Frontend Dev Server (port 5173)" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all services`n" -ForegroundColor Yellow

npm run dev:all

