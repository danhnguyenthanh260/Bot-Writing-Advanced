# Quick Install pgvector for PostgreSQL 16 Windows

## ⚠️ Lưu Ý Quan Trọng

**pgvector KHÔNG có pre-built binaries trên GitHub Releases.**  
Bạn cần **build từ source** hoặc sử dụng **Docker**.

---

## 🚀 Phương Án 1: Build từ Source (Recommended)

### Yêu Cầu:
- Visual Studio Build Tools (hoặc Visual Studio với C++ workload)
- Git
- PostgreSQL 16 đã cài

### Quick Steps:

#### Step 1: Cài Visual Studio Build Tools

1. **Download:**
   - https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Download **Build Tools for Visual Studio 2022**

2. **Cài đặt:**
   - Chọn **Desktop development with C++** workload
   - Cài đặt (mất ~10-15 phút)

---

#### Step 2: Build pgvector

**Mở Command Prompt as Administrator:**
- Windows + R → `cmd` → Right-click → **Run as administrator**

**Chạy các lệnh sau:**

```cmd
# 1. Setup Visual Studio environment
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

# 2. Set PostgreSQL path
set "PGROOT=C:\Program Files\PostgreSQL\16"

# 3. Navigate to temp folder
cd %TEMP%

# 4. Clone pgvector repository (version mới nhất)
git clone https://github.com/pgvector/pgvector.git
cd pgvector

# 5. Build
nmake /F Makefile.win

# 6. Install (copy files to PostgreSQL)
nmake /F Makefile.win install
```

**Nếu gặp lỗi "Access is denied":**
- Ensure đang chạy Command Prompt **as Administrator**
- Hoặc copy manual (xem Step 3)

---

#### Step 3: Restart PostgreSQL Service

```cmd
net stop postgresql-x64-16
net start postgresql-x64-16
```

**Hoặc:**
- Windows + R → `services.msc`
- Tìm `postgresql-x64-16` → Right-click → **Restart**

---

#### Step 4: Verify & Enable Extension

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

### 🔧 Manual Copy (Nếu nmake install failed)

Sau khi build thành công, nếu `nmake install` không chạy được, copy manual:

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

**Xem hướng dẫn chi tiết:** `BUILD_PGVECTOR_WINDOWS.md`

---

## 🐳 Phương Án 2: Sử dụng Docker (Dễ Nhất - Không Cần Build)

Nếu việc build từ source quá phức tạp, dùng Docker. Có 2 cách:

---

### Cách A: Chỉ PostgreSQL với pgvector (Đơn Giản)

#### Step 1: Cài Docker Desktop

1. **Download Docker Desktop:**
   - https://www.docker.com/products/docker-desktop/
   - Download và cài đặt

2. **Start Docker Desktop** (đợi icon Docker ở system tray sẵn sàng)

---

#### Step 2: Stop PostgreSQL Service Hiện Tại

```powershell
# Stop PostgreSQL service Windows (nếu đang chạy)
net stop postgresql-x64-16
```

**Lưu ý:** Nếu muốn giữ cả PostgreSQL Windows và Docker, đổi port Docker sang 5433 (xem bên dưới).

---

#### Step 3: Chạy PostgreSQL với pgvector

**Option 1: Port mặc định (5432) - Thay thế PostgreSQL Windows**

```powershell
# Chạy PostgreSQL với pgvector trong Docker
docker run -d `
  --name postgres-pgvector `
  -e POSTGRES_PASSWORD=12345 `
  -e POSTGRES_DB=bot_writing_advanced `
  -p 5432:5432 `
  -v postgres_data:/var/lib/postgresql/data `
  pgvector/pgvector:pg16
```

**Option 2: Port khác (5433) - Chạy song song**

**Lưu ý:** "Chạy song song" có nghĩa là:
- Có thể có nhiều PostgreSQL instances chạy cùng lúc, mỗi cái trên port riêng:
  - PostgreSQL Windows service → port 5432
  - Docker container `postgres-pgvector` → port 5433
  - Docker container `writing-advanced-db` (từ docker-compose) → port 5432
- Bạn chọn một trong các options trên để dùng
- **Nếu đã có container từ docker-compose chạy trên 5432, không cần tạo thêm container mới!**

**⚠️ Quan trọng:** Trước khi tạo container mới, kiểm tra xem đã có container nào đang chạy chưa:
```powershell
# Xem tất cả containers PostgreSQL
docker ps | findstr postgres

# Nếu đã có container từ docker-compose (ví dụ: writing-advanced-db)
# → Chỉ cần enable extension vector trong container đó, không cần tạo mới!
```

```powershell
# Chạy trên port 5433 để không conflict với PostgreSQL Windows
docker run -d `
  --name postgres-pgvector `
  -e POSTGRES_PASSWORD=12345 `
  -e POSTGRES_DB=bot_writing_advanced `
  -p 5433:5432 `
  -v postgres_data:/var/lib/postgresql/data `
  pgvector/pgvector:pg16
```

**Nếu dùng Option 2, update DATABASE_URL với port 5433.**

**Kiểm tra container đã chạy:**
```powershell
# Xem container status
docker ps | findstr postgres-pgvector

# Kiểm tra container đã sẵn sàng
docker exec postgres-pgvector pg_isready -U postgres
```

**Nếu container chưa chạy hoặc bị stop:**
```powershell
# Start lại container
docker start postgres-pgvector

# Hoặc nếu container không tồn tại, chạy lại docker run command
```

---

#### Step 4: Update `.env`

**Nếu dùng Option 1 (port 5432):**
```
DATABASE_URL=postgresql://postgres:12345@localhost:5432/bot_writing_advanced
```

**Nếu dùng Option 2 (port 5433):**
```
DATABASE_URL=postgresql://postgres:12345@localhost:5433/bot_writing_advanced
```

**⚠️ Lưu ý:** 
- Port phải là `5433` (không phải `54333` hay `5432`)
- Sau khi sửa `.env`, test lại: `npm run db:test`
- Nếu vẫn lỗi, kiểm tra container đang chạy: `docker ps | findstr postgres-pgvector`

---

#### Step 5: Verify

```powershell
# Test connection
npm run db:test

# Install extension (tự động có sẵn trong Docker image)
npm run db:install-vector
```

**✅ Done!** Extension vector đã có sẵn trong Docker image.

---

### Cách B: Sử dụng docker-compose (Khuyến Nghị - Đầy Đủ)

Nếu bạn muốn chạy toàn bộ stack (PostgreSQL + Backend + Frontend + Embedding):

#### Step 1: Cài Docker Desktop

Giống như Cách A, Step 1.

---

#### Step 2: Stop PostgreSQL Service Windows

```powershell
net stop postgresql-x64-16
```

---

#### Step 3: Chạy với docker-compose

```powershell
# Chạy chỉ PostgreSQL (nếu chỉ cần database)
docker-compose up -d postgres

# Hoặc chạy toàn bộ stack
docker-compose up -d
```

**File `docker-compose.yml` đã có sẵn trong project:**
- PostgreSQL với pgvector: `pgvector/pgvector:pg16`
- Schema tự động deploy từ `server/db/schema.sql`
- Extension vector tự động enable

---

#### Step 4: Update `.env`

File `.env` sẽ tự động được đọc bởi docker-compose. Đảm bảo có:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345
POSTGRES_DB=bot_writing_advanced
DATABASE_URL=postgresql://postgres:12345@localhost:5432/bot_writing_advanced
```

---

#### Step 5: Verify

```powershell
# Test connection
npm run db:test

# Hoặc test từ trong container
docker-compose exec backend npm run db:test

# Install extension
npm run db:install-vector
```

**Xem hướng dẫn đầy đủ:** `DOCKER_SETUP.md`

---

### 🔧 Quản Lý Docker Container

**Xem containers đang chạy:**
```powershell
docker ps
```

**Xem logs:**
```powershell
# Logs của PostgreSQL container
docker logs postgres-pgvector

# Hoặc nếu dùng docker-compose
docker-compose logs postgres
```

**Dừng container:**
```powershell
# Dừng container
docker stop postgres-pgvector

# Hoặc nếu dùng docker-compose
docker-compose stop postgres
```

**Xóa container (giữ data):**
```powershell
docker rm postgres-pgvector
```

**Xóa container và data:**
```powershell
docker rm -v postgres-pgvector
```

**Restart container:**
```powershell
docker restart postgres-pgvector
```

---

### ⚠️ Lưu Ý Quan Trọng

1. **Data Persistence:** 
   - Data được lưu trong Docker volume `postgres_data`
   - Nếu xóa container, data vẫn còn (trừ khi dùng `-v`)
   - Để backup: `docker exec postgres-pgvector pg_dump -U postgres bot_writing_advanced > backup.sql`

2. **Port Conflict:**
   - Nếu PostgreSQL Windows đang chạy trên port 5432, dùng port 5433 cho Docker
   - Hoặc stop PostgreSQL Windows service

3. **Performance:**
   - Docker có thể chậm hơn một chút so với PostgreSQL native
   - Nhưng với development, sự khác biệt không đáng kể

4. **Troubleshooting:**
   - Xem `DOCKER_TROUBLESHOOTING.md` nếu gặp vấn đề
   - Kiểm tra Docker Desktop đã chạy: `docker ps`

---

## 🔍 Troubleshooting

### Lỗi Build từ Source

#### Lỗi: "nmake is not recognized"

**Giải pháp:**
- Ensure đã chạy `vcvars64.bat` trước khi chạy `nmake`
- Check Visual Studio Build Tools đã cài đúng

#### Lỗi: "Access is denied"

**Giải pháp:**
- Run Command Prompt as Administrator
- Hoặc copy files manual (xem Step 3 ở trên)

#### Lỗi: "PGROOT not found"

**Giải pháp:**
- Check path PostgreSQL:
  ```cmd
  dir "C:\Program Files\PostgreSQL\16"
  ```
- Update `PGROOT` path nếu khác:
  ```cmd
  set "PGROOT=C:\Program Files\PostgreSQL\16"
  ```

#### Lỗi: "Could not open extension control file"

**Giải pháp:**
- Check files đã copy:
  - `C:\Program Files\PostgreSQL\16\lib\vector.dll` ✅
  - `C:\Program Files\PostgreSQL\16\share\extension\vector.control` ✅
  - `C:\Program Files\PostgreSQL\16\share\extension\vector--*.sql` ✅
- Restart PostgreSQL service

---

### Lỗi Docker

#### Lỗi: "Cannot connect to the Docker daemon"

**Giải pháp:**
- Đảm bảo Docker Desktop đã chạy (icon Docker ở system tray)
- Kiểm tra: `docker ps` (nếu thành công → Docker đã sẵn sàng)

#### Lỗi: "Port already in use"

**Giải pháp:**
- Port 5432 đang được PostgreSQL Windows sử dụng
- Dùng Option 2 (port 5433) hoặc stop PostgreSQL Windows:
  ```powershell
  net stop postgresql-x64-16
  ```

#### Lỗi: "Container name already exists"

**Giải pháp:**
- Xóa container cũ:
  ```powershell
  docker rm postgres-pgvector
  ```
- Hoặc dùng tên khác: `--name postgres-pgvector-new`

#### Lỗi: "Connection refused" khi test database

**Giải pháp:**
- Kiểm tra container đang chạy: `docker ps`
- Kiểm tra logs: `docker logs postgres-pgvector`
- Đợi container khởi động xong (có thể mất 10-30 giây)
- Kiểm tra DATABASE_URL trong `.env` đúng chưa

#### Lỗi: "Extension vector is not available" trong Docker

**Giải pháp:**
- Image `pgvector/pgvector:pg16` đã có sẵn extension
- Kiểm tra extension có sẵn:
  ```powershell
  docker exec postgres-pgvector psql -U postgres -d bot_writing_advanced -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"
  ```
- Nếu không thấy, có thể image bị lỗi, thử pull lại:
  ```powershell
  docker pull pgvector/pgvector:pg16
  docker rm postgres-pgvector
  # Chạy lại docker run command
  ```

**Xem thêm:** `DOCKER_TROUBLESHOOTING.md` để biết thêm chi tiết.

---

## ✅ Success Checklist

**Nếu build từ source:**
- [ ] Visual Studio Build Tools đã cài
- [ ] Build pgvector thành công
- [ ] Files đã copy vào PostgreSQL folder
- [ ] PostgreSQL service đã restart
- [ ] Verified với `SELECT * FROM pg_available_extensions WHERE name = 'vector';`
- [ ] Enabled extension với `CREATE EXTENSION IF NOT EXISTS "vector";`
- [ ] Verified với `SELECT * FROM pg_extension WHERE extname = 'vector';`

**Nếu dùng Docker:**
- [ ] Docker Desktop đã cài và chạy
- [ ] Container `postgres-pgvector` đang chạy
- [ ] Updated `DATABASE_URL` trong `.env`
- [ ] Test connection thành công
- [ ] Extension vector đã enable

---

## 📚 Tài Liệu Tham Khảo

- **Build từ source chi tiết:** `BUILD_PGVECTOR_WINDOWS.md`
- **Hướng dẫn đầy đủ:** `INSTALL_PGVECTOR_WINDOWS.md`
- **pgvector GitHub:** https://github.com/pgvector/pgvector

---

**Status:** Ready to Install  
**Time:** 
- Build từ source: ~20-30 phút
- Docker: ~5 phút  
**Priority:** HIGH











