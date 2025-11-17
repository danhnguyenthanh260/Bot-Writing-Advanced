# Hướng Dẫn Cài Đặt pgvector Extension

Hướng dẫn đầy đủ về cài đặt pgvector extension cho PostgreSQL trên Windows.

## 📋 Mục Lục

1. [Quick Start](#quick-start)
2. [Option 1: Build từ Source (Recommended)](#option-1-build-từ-source-recommended)
3. [Option 2: Pre-built Binary (Nếu có)](#option-2-pre-built-binary-nếu-có)
4. [Option 3: Docker (Alternative)](#option-3-docker-alternative)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Yêu Cầu

- Visual Studio Build Tools (hoặc Visual Studio với C++ workload)
- Git
- PostgreSQL 16 đã cài

### Các Bước Nhanh

1. **Cài Visual Studio Build Tools:**
   - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Chọn **Desktop development with C++** workload

2. **Build pgvector:**
   ```cmd
   # Run as Administrator
   call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
   set "PGROOT=C:\Program Files\PostgreSQL\16"
   cd %TEMP%
   git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
   cd pgvector
   nmake /F Makefile.win
   nmake /F Makefile.win install
   ```

3. **Restart PostgreSQL:**
   ```cmd
   net stop postgresql-x64-16
   net start postgresql-x64-16
   ```

4. **Enable Extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "vector";
   ```

**Xong!** Xem chi tiết bên dưới.

---

## 🔨 Option 1: Build từ Source (Recommended)

### ⚠️ Lưu Ý Quan Trọng

**pgvector KHÔNG có pre-built binaries trên GitHub Releases.**  
Bạn cần **build từ source** hoặc sử dụng **Docker**.

### Yêu Cầu

- Visual Studio Build Tools (hoặc Visual Studio với C++ workload)
- Git
- PostgreSQL 16 đã cài

### Step 1: Cài Visual Studio Build Tools

1. **Download:**
   - https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Download **Build Tools for Visual Studio 2022**

2. **Cài đặt:**
   - Chọn **Desktop development with C++** workload
   - Cài đặt (mất ~10-15 phút)

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

**Lưu ý:** Nếu không tìm thấy `vcvars64.bat`, thử các path sau:
```cmd
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
```

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
- Hoặc copy manual sau khi build (xem Step 4)

### Step 4: Restart PostgreSQL Service

```cmd
net stop postgresql-x64-16
net start postgresql-x64-16
```

**Hoặc:**
- Windows + R → `services.msc`
- Tìm `postgresql-x64-16` → Right-click → **Restart**

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

### Quick Copy (Nếu nmake install failed)

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

## 📦 Option 2: Pre-built Binary (Nếu có)

### ⚠️ Lưu Ý

**pgvector thường KHÔNG có pre-built binaries cho Windows.**  
Nếu bạn tìm thấy, đây là cách sử dụng:

### Bước 1: Download pgvector Binary

1. **Vào trang Release của pgvector:**
   - https://github.com/pgvector/pgvector/releases
   - Hoặc: https://github.com/pgvector/pgvector/tags

2. **Tìm version phù hợp với PostgreSQL 16:**
   - Tìm file `.zip` cho PostgreSQL 16 Windows
   - Ví dụ: `pgvector-v0.5.1-postgresql-16-windows-x64.zip`
   - Nếu không có sẵn cho PostgreSQL 16, thử version gần nhất hoặc xem Option 1

3. **Download file .zip**

### Bước 2: Extract và Copy Files

1. **Extract file .zip** bạn vừa download

2. **Copy các file sau:**

   **a) Copy .dll files vào `lib` folder:**
   ```
   Từ: extracted_folder/lib/
   Đến: C:\Program Files\PostgreSQL\16\lib\
   ```
   - Copy tất cả file `.dll` (ví dụ: `vector.dll`)

   **b) Copy control và SQL files vào `share/extension` folder:**
   ```
   Từ: extracted_folder/share/extension/
   Đến: C:\Program Files\PostgreSQL\16\share\extension\
   ```
   - Copy `vector.control`
   - Copy tất cả file `vector--*.sql`

### Bước 3: Restart PostgreSQL Service

1. **Mở Services:**
   - Windows + R → `services.msc` → Enter

2. **Tìm PostgreSQL service:**
   - Tìm service có tên: `postgresql-x64-16` (hoặc tương tự)
   - Right-click → **Restart**

### Bước 4: Verify Installation

1. **Mở psql:**
   ```cmd
   cd "C:\Program Files\PostgreSQL\16\bin"
   psql -U postgres -d bot_writing_advanced
   ```

2. **Check extension có sẵn:**
   ```sql
   SELECT * FROM pg_available_extensions WHERE name = 'vector';
   ```
   - Nếu thấy row → ✅ Extension có sẵn!

3. **Enable extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "vector";
   ```

4. **Verify:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
   - Nếu thấy row → ✅ Success!

---

## 🐳 Option 3: Docker (Alternative)

Nếu build từ source quá phức tạp, dùng Docker:

### Cài Docker Desktop for Windows

1. Download: https://www.docker.com/products/docker-desktop
2. Cài đặt và khởi động Docker Desktop

### Chạy PostgreSQL với pgvector

```bash
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bot_writing_advanced \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

**Update `.env`:**
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bot_writing_advanced
```

**pgvector đã có sẵn trong Docker image!** ✅

### Enable Extension

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## 🔧 Troubleshooting

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

### Lỗi: "Could not open extension control file"

**Nguyên nhân:** Files chưa được copy đúng hoặc thiếu files.

**Giải pháp:**
1. Check các files đã copy:
   - `C:\Program Files\PostgreSQL\16\lib\vector.dll` ✅
   - `C:\Program Files\PostgreSQL\16\share\extension\vector.control` ✅
   - `C:\Program Files\PostgreSQL\16\share\extension\vector--*.sql` ✅

2. **Verify trong psql:**
   ```sql
   SELECT * FROM pg_available_extensions WHERE name = 'vector';
   ```
   - Nếu không thấy → Files chưa copy đúng

3. **Check permissions:**
   - Right-click PostgreSQL folder → Properties → Security
   - Ensure `Everyone` có `Read` permission (hoặc ít nhất user PostgreSQL đang chạy)

4. **Restart PostgreSQL service**

### Lỗi: "The specified module could not be found" (khi CREATE EXTENSION)

**Nguyên nhân:** Thiếu dependencies (.dll files).

**Giải pháp:**
- Ensure tất cả `.dll` files đã được copy vào `lib` folder
- Check `vector.dll` có trong `lib` folder
- Restart PostgreSQL service

### Lỗi: Version mismatch

**Nguyên nhân:** pgvector binary không tương thích với PostgreSQL version.

**Giải pháp:**
- Download đúng version cho PostgreSQL 16
- Hoặc build từ source (Option 1)

---

## ✅ Verification Checklist

Sau khi cài, verify:

- [ ] `vector.dll` có trong `C:\Program Files\PostgreSQL\16\lib\`
- [ ] `vector.control` có trong `C:\Program Files\PostgreSQL\16\share\extension\`
- [ ] `vector--*.sql` files có trong `C:\Program Files\PostgreSQL\16\share\extension\`
- [ ] PostgreSQL service đã restart
- [ ] Query `SELECT * FROM pg_available_extensions WHERE name = 'vector';` trả về row
- [ ] `CREATE EXTENSION IF NOT EXISTS "vector";` thành công
- [ ] Query `SELECT * FROM pg_extension WHERE extname = 'vector';` trả về row

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

## 🎯 Recommended Next Steps

1. **Try Option 1 first** (Build from source) - Recommended
2. **Nếu quá phức tạp**, dùng Docker (Option 3)
3. **Nếu tìm thấy pre-built binary**, dùng Option 2

---

**Xem thêm:**
- [SETUP_VS_BUILD_TOOLS.md](./SETUP_VS_BUILD_TOOLS.md) - Setup Visual Studio Build Tools
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Setup database

