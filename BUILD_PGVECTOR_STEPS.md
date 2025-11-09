# Build pgvector - Step by Step Commands

## 📋 Full Command Sequence

### Part 1: Setup Visual Studio Build Tools

**Nếu chưa cài:**
1. Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Cài đặt với **Desktop development with C++** workload

---

### Part 2: Build pgvector (Sau khi cài Visual Studio Build Tools)

**Mở Command Prompt as Administrator và chạy:**

```cmd
REM ============================================
REM Step 1: Navigate to project folder
REM ============================================
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"

REM ============================================
REM Step 2: Setup Visual Studio environment
REM ============================================
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

REM (Nếu không tìm thấy, thử path này:)
REM call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

REM ============================================
REM Step 3: Set PostgreSQL path
REM ============================================
set "PGROOT=C:\Program Files\PostgreSQL\16"

REM ============================================
REM Step 4: Verify environment
REM ============================================
echo %PGROOT%
nmake /?

REM Nếu thấy PGROOT và nmake command → OK!

REM ============================================
REM Step 5: Clone pgvector
REM ============================================
cd %TEMP%
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector

REM ============================================
REM Step 6: Build pgvector
REM ============================================
nmake /F Makefile.win

REM Chờ build xong (~1-2 phút)
REM Nếu thành công → thấy "Creating vector.dll"

REM ============================================
REM Step 7: Install (copy files to PostgreSQL)
REM ============================================
nmake /F Makefile.win install

REM Nếu thành công → files đã được copy

REM ============================================
REM Step 8: Restart PostgreSQL
REM ============================================
net stop postgresql-x64-16
net start postgresql-x64-16

REM ============================================
REM Step 9: Verify & Enable Extension
REM ============================================
cd "C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -d bot_writing_advanced
```

**Trong psql, chạy:**
```sql
-- Check extension có sẵn
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- Enable extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
\q
```

**Nếu thấy row → ✅ Success!**

---

## 🔍 Troubleshooting Commands

### Check Visual Studio Build Tools path:
```cmd
dir "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
dir "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
dir "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
```

### Check PostgreSQL path:
```cmd
dir "C:\Program Files\PostgreSQL\16"
```

### Check git installed:
```cmd
git --version
```

### Check build files:
```cmd
dir "%TEMP%\pgvector\vector.dll"
dir "%TEMP%\pgvector\vector.control"
```

### Check installed files:
```cmd
dir "C:\Program Files\PostgreSQL\16\lib\vector.dll"
dir "C:\Program Files\PostgreSQL\16\share\extension\vector.control"
```

---

## ✅ Success Checklist

Sau khi chạy tất cả commands:

- [ ] Visual Studio Build Tools đã cài
- [ ] `vcvars64.bat` chạy thành công
- [ ] `PGROOT` environment variable set đúng
- [ ] `nmake` command recognized
- [ ] pgvector repository cloned thành công
- [ ] Build thành công (thấy `vector.dll`)
- [ ] Install thành công (files copied)
- [ ] PostgreSQL service restarted
- [ ] Extension available: `SELECT * FROM pg_available_extensions WHERE name = 'vector';` returns row
- [ ] Extension enabled: `CREATE EXTENSION vector;` thành công
- [ ] Extension verified: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns row

---

## 🐛 Common Errors & Fixes

### Error: "vcvars64.bat not found"
**Fix:** Check Visual Studio Build Tools installation path
```cmd
REM Try different paths:
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
```

### Error: "nmake is not recognized"
**Fix:** Ensure `vcvars64.bat` đã chạy trước khi dùng `nmake`
```cmd
REM Run vcvars64.bat first!
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
nmake /?
```

### Error: "Access is denied" (install)
**Fix:** Run as Administrator hoặc copy manual
```cmd
REM Copy manual:
copy "%TEMP%\pgvector\vector.dll" "C:\Program Files\PostgreSQL\16\lib\"
copy "%TEMP%\pgvector\vector.control" "C:\Program Files\PostgreSQL\16\share\extension\"
copy "%TEMP%\pgvector\vector--*.sql" "C:\Program Files\PostgreSQL\16\share\extension\"
```

---

**Status:** Ready to Execute  
**Time:** ~20-30 minutes total  
**Priority:** HIGH






