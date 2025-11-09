@echo off
REM Batch script to start all services
REM Usage: start_all.bat

echo 🚀 Starting all services...
echo.

REM Check Python
echo 📋 Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python found
echo.

REM Check Python dependencies
echo 📋 Checking Python dependencies...
python -c "import sentence_transformers; import fastapi; import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python dependencies missing. Installing...
    python -m pip install sentence-transformers fastapi uvicorn
    if errorlevel 1 (
        echo ❌ Failed to install Python dependencies!
        pause
        exit /b 1
    )
)
echo ✅ Python dependencies installed
echo.

REM Check Node.js dependencies
echo 📋 Checking Node.js dependencies...
if not exist "node_modules" (
    echo ⚠️  Node modules not found. Installing...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install Node.js dependencies!
        pause
        exit /b 1
    )
)
echo ✅ Node.js dependencies installed
echo.

REM Start all services
echo 🚀 Starting all services with concurrently...
echo    - Local Embedding Server (port 8000)
echo    - Backend Server (port 3001)
echo    - Frontend Dev Server (port 5173)
echo.
echo Press Ctrl+C to stop all services
echo.

call npm run dev:all

