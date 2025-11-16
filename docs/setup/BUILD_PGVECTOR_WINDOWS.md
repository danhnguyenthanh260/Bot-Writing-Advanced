# Build pgvector từ Source - Windows (Dễ Nhất)

## ✅ Cách Đơn Giản Nhất - Dùng Makefile.win

### Yêu Cầu:
- Visual Studio Build Tools (hoặc Visual Studio với C++ workload)
- Git
- PostgreSQL 16 đã cài

---

## 🚀 Quick Steps

### Step 1: Cài Visual Studio Build Tools

1. **Download:**
   - https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Download **Build Tools for Visual Studio 2022**

2. **Cài đặt:**
   - Chọn **Desktop development with C++** workload
   - Cài đặt (mất ~10-15 phút)

---

### Step 2: Setup Environment

**Mở Command Prompt as Administrator:**
- Windows + R → `cmd` → Right-click → **Run as administrator**

**Chạy các lệnh sau:**

```cmd
# 1. Setup Visual Studio environment
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

# 2. Set PostgreSQL path (cho PostgreSQL 16)
set "PGROOT=C:\Program Files\PostgreSQL\16"

# 3. Verify
echo %PGROOT%
```

**Nếu thấy path hiện ra → ✅ OK!**

---

### Step 3: Clone & Build pgvector

```cmd
# 1. Navigate to temp folder
cd %TEMP%

# 2. Clone pgvector repository
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector

# 3. Build (tự động detect Makefile.win)
nmake /F Makefile.win

# 4. Install (copy files to PostgreSQL)
nmake /F Makefile.win install
```

**Nếu gặp lỗi "Access is denied":**
- Ensure đang chạy Command Prompt **as Administrator**
- Hoặc copy manual sau khi build

---

### Step 4: Restart PostgreSQL Service

```cmd
net stop postgresql-x64-16
net start postgresql-x64-16
```

---

### Step 5: Verify & Enable Extension

**Mở psql:**
```cmd
cd "C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -d bot_writing_advanced
```

**Trong psql:**
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

### Lỗi: "nmake is not recognized"

**Giải pháp:**
- Ensure đã chạy `vcvars64.bat` trước khi chạy `nmake`
- Check Visual Studio Build Tools đã cài đúng

### Lỗi: "Access is denied"

**Giải pháp:**
- Run Command Prompt as Administrator
- Hoặc copy files manual:
  - Copy `vector.dll` từ `build/Release/` → `C:\Program Files\PostgreSQL\16\lib\`
  - Copy `vector.control` và `vector--*.sql` từ `build/` → `C:\Program Files\PostgreSQL\16\share\extension\`

### Lỗi: "PGROOT not found"

**Giải pháp:**
- Check path PostgreSQL:
  ```cmd
  dir "C:\Program Files\PostgreSQL\16"
  ```
- Update `PGROOT` path nếu khác:
  ```cmd
  set "PGROOT=C:\Program Files\PostgreSQL\16"
  ```

---

## ✅ Quick Copy (Nếu nmake install failed)

Sau khi build thành công, bạn có thể copy manual:

```cmd
# Build folder sẽ ở: %TEMP%\pgvector

# Copy .dll
copy "%TEMP%\pgvector\vector.dll" "C:\Program Files\PostgreSQL\16\lib\"

# Copy control và SQL files
copy "%TEMP%\pgvector\vector.control" "C:\Program Files\PostgreSQL\16\share\extension\"
copy "%TEMP%\pgvector\vector--*.sql" "C:\Program Files\PostgreSQL\16\share\extension\"

# Restart service
net stop postgresql-x64-16
net start postgresql-x64-16
```

---

## 🐳 Alternative: Docker (Nếu Build Quá Phức Tạp)

Nếu build từ source quá phức tạp, dùng Docker:

```bash
# Cài Docker Desktop for Windows trước
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bot_writing_advanced \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

**Update `.env`:**
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bot_writing_advanced
```

**pgvector đã có sẵn trong Docker image!** ✅

---

## 📝 Full Command Sequence

```cmd
# Run as Administrator

# 1. Setup Visual Studio
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

# 2. Set PostgreSQL path
set "PGROOT=C:\Program Files\PostgreSQL\16"

# 3. Clone & Build
cd %TEMP%
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install

# 4. Restart PostgreSQL
net stop postgresql-x64-16
net start postgresql-x64-16

# 5. Test
cd "C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -d bot_writing_advanced
```

**Trong psql:**
```sql
CREATE EXTENSION IF NOT EXISTS "vector";
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

**Status:** Ready to Build  
**Time:** ~20-30 minutes (bao gồm cài Visual Studio Build Tools)  
**Difficulty:** Medium















