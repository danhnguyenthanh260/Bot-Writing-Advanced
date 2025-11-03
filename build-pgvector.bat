@echo off
REM ============================================
REM Build pgvector for PostgreSQL 16 Windows
REM Run as Administrator!
REM ============================================

echo ============================================
echo Building pgvector for PostgreSQL 16
echo ============================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run as Administrator!
    pause
    exit /b 1
)

echo [Step 1/9] Setting up Visual Studio environment...
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" 2>nul
if %errorLevel% neq 0 (
    echo Trying alternative path...
    call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" 2>nul
    if %errorLevel% neq 0 (
        echo Trying Visual Studio Community...
        call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" 2>nul
        if %errorLevel% neq 0 (
            echo ERROR: Visual Studio Build Tools not found!
            echo Please install Visual Studio Build Tools first.
            echo Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
            pause
            exit /b 1
        )
    )
)
echo OK: Visual Studio environment setup complete
echo.

echo [Step 2/9] Setting PostgreSQL path...
set "PGROOT=C:\Program Files\PostgreSQL\16"
if not exist "%PGROOT%" (
    echo ERROR: PostgreSQL 16 not found at %PGROOT%
    echo Please check your PostgreSQL installation path.
    pause
    exit /b 1
)
echo OK: PostgreSQL path set to %PGROOT%
echo.

echo [Step 3/9] Verifying environment...
nmake /? >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: nmake not found! Visual Studio environment may not be set up correctly.
    pause
    exit /b 1
)
echo OK: nmake is available
echo.

git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: git not found! Installing git...
    echo Please install git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo OK: git is available
echo.

echo [Step 4/9] Navigating to temp folder...
cd %TEMP%
echo Current directory: %CD%
echo.

echo [Step 5/9] Cloning pgvector repository...
if exist "pgvector" (
    echo pgvector folder exists, removing old version...
    rmdir /s /q pgvector
)
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
if %errorLevel% neq 0 (
    echo ERROR: Failed to clone pgvector repository
    pause
    exit /b 1
)
echo OK: Repository cloned successfully
echo.

echo [Step 6/9] Navigating to pgvector folder...
cd pgvector
echo Current directory: %CD%
echo.

echo [Step 7/9] Building pgvector...
echo This may take 1-2 minutes...
nmake /F Makefile.win
if %errorLevel% neq 0 (
    echo ERROR: Build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)
echo OK: Build completed successfully
echo.

echo [Step 8/9] Installing pgvector (copying files to PostgreSQL)...
nmake /F Makefile.win install
if %errorLevel% neq 0 (
    echo WARNING: Install command failed, trying manual copy...
    if exist "vector.dll" (
        copy "vector.dll" "%PGROOT%\lib\" >nul
        echo Copied vector.dll
    )
    if exist "vector.control" (
        copy "vector.control" "%PGROOT%\share\extension\" >nul
        copy "vector--*.sql" "%PGROOT%\share\extension\" >nul
        echo Copied extension files
    )
) else (
    echo OK: Files installed successfully
)
echo.

echo [Step 9/9] Restarting PostgreSQL service...
net stop postgresql-x64-16
timeout /t 2 /nobreak >nul
net start postgresql-x64-16
if %errorLevel% neq 0 (
    echo WARNING: PostgreSQL service restart may have failed
    echo Please restart manually from Services (services.msc)
) else (
    echo OK: PostgreSQL service restarted
)
echo.

echo ============================================
echo Build completed!
echo ============================================
echo.
echo Next steps:
echo 1. Open psql: cd "C:\Program Files\PostgreSQL\16\bin" ^&^& psql -U postgres -d bot_writing_advanced
echo 2. Run: CREATE EXTENSION IF NOT EXISTS "vector";
echo 3. Verify: SELECT * FROM pg_extension WHERE extname = 'vector';
echo.
pause


