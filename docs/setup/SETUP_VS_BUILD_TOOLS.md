# Setup Visual Studio Build Tools - Windows

## 🎯 Step 2: Build pgvector từ Source - Part 1

### Bước 1: Cài Visual Studio Build Tools

#### Download & Install

1. **Download Visual Studio Build Tools:**
   - Vào: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Click **Download** cho **Build Tools for Visual Studio 2022**
   - File sẽ là: `vs_buildtools.exe` (~3MB)

2. **Cài đặt:**
   - Chạy `vs_buildtools.exe`
   - Chọn **Desktop development with C++** workload
   - **Quan trọng:** Đảm bảo check:
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
     - ✅ Windows 10 SDK (hoặc version mới nhất)
     - ✅ C++ CMake tools for Windows (optional nhưng recommended)
   - Click **Install**
   - Mất khoảng **10-15 phút** (tùy internet speed)

3. **Verify Installation:**
   - Sau khi cài xong, check:
     ```cmd
     dir "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
     ```
   - Nếu thấy file → ✅ Success!

---

### Bước 2: Setup Environment & Build

**Sau khi cài xong Visual Studio Build Tools:**

1. **Mở Command Prompt as Administrator:**
   - Windows + R → `cmd` → Right-click → **Run as administrator**

2. **Chạy các lệnh sau:**

```cmd
# 1. Navigate to project folder
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"

# 2. Setup Visual Studio environment
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

# 3. Set PostgreSQL path
set "PGROOT=C:\Program Files\PostgreSQL\16"

# 4. Verify environment
echo %PGROOT%
nmake /?
```

**Nếu thấy `%PGROOT%` hiện ra và `nmake` command recognized → ✅ OK!**

---

### Bước 3: Clone & Build pgvector

**Tiếp tục trong cùng Command Prompt window:**

```cmd
# 1. Navigate to temp folder
cd %TEMP%

# 2. Clone pgvector repository
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git

# 3. Navigate to pgvector folder
cd pgvector

# 4. Build pgvector
nmake /F Makefile.win

# 5. Install (copy files to PostgreSQL)
nmake /F Makefile.win install
```

**Nếu build thành công, bạn sẽ thấy:**
```
Creating library vector.lib and object vector.exp
   Creating vector.dll
```

**Nếu install thành công, bạn sẽ thấy files được copy vào PostgreSQL folders.**

---

### Bước 4: Restart PostgreSQL Service

```cmd
# Stop PostgreSQL
net stop postgresql-x64-16

# Start PostgreSQL
net start postgresql-x64-16
```

---

### Bước 5: Verify & Enable Extension

**Mở psql:**
```cmd
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
```

**Nếu thấy row → ✅ Success!**

---

## 🔍 Troubleshooting

### Lỗi: "git is not recognized"

**Giải pháp:**
- Cài Git: https://git-scm.com/download/win
- Restart Command Prompt sau khi cài

### Lỗi: "nmake is not recognized"

**Giải pháp:**
- Ensure đã chạy `vcvars64.bat` trước khi chạy `nmake`
- Check Visual Studio Build Tools đã cài đúng

### Lỗi: "Access is denied" (khi install)

**Giải pháp:**
- Ensure đang chạy Command Prompt **as Administrator**
- Hoặc copy manual sau khi build (xem dưới)

---

## 📝 Manual Copy (Nếu nmake install failed)

Sau khi build thành công, bạn có thể copy manual:

```cmd
# Files sẽ ở: %TEMP%\pgvector

# Copy .dll file
copy "%TEMP%\pgvector\vector.dll" "C:\Program Files\PostgreSQL\16\lib\"

# Copy control file
copy "%TEMP%\pgvector\vector.control" "C:\Program Files\PostgreSQL\16\share\extension\"

# Copy SQL files
copy "%TEMP%\pgvector\vector--*.sql" "C:\Program Files\PostgreSQL\16\share\extension\"

# Restart PostgreSQL
net stop postgresql-x64-16
net start postgresql-x64-16
```

---

## ✅ Quick Checklist

- [ ] Visual Studio Build Tools đã cài đặt
- [ ] Git đã cài đặt
- [ ] Command Prompt đang chạy **as Administrator**
- [ ] Đã chạy `vcvars64.bat` để setup environment
- [ ] Đã set `PGROOT` environment variable
- [ ] Đã clone pgvector repository
- [ ] Đã build pgvector thành công (`nmake /F Makefile.win`)
- [ ] Đã install pgvector (`nmake /F Makefile.win install`)
- [ ] PostgreSQL service đã restart
- [ ] Extension đã được enable trong PostgreSQL
- [ ] Verified với `SELECT * FROM pg_extension WHERE extname = 'vector';`

---

## 🚀 Next Steps

Sau khi enable extension thành công:

1. **Test connection từ code:**
   ```bash
   npm run server
   ```

2. **Continue với Phase 1:**
   - Xem `PHASE_1_FOUNDATION.md`
   - Implement các services còn lại

---

**Status:** Ready to Install  
**Time:** ~15-20 minutes (Visual Studio Build Tools) + ~5-10 minutes (build pgvector)  
**Priority:** HIGH















