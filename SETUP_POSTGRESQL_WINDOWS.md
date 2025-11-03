# Setup PostgreSQL + pgvector trên Windows

## 📋 Hướng Dẫn Chi Tiết cho Windows

---

## Bước 1: Cài Đặt PostgreSQL

### Option 1: Download Installer (Recommended)

1. **Download PostgreSQL:**
   - Vào: https://www.postgresql.org/download/windows/
   - Download **PostgreSQL 15+** (hoặc latest version)
   - Chọn **Windows x86-64** installer

2. **Cài đặt:**
   - Chạy installer (.exe)
   - **Lưu ý:** Ghi nhớ password cho user `postgres` (sẽ cần dùng sau)
   - Port mặc định: `5432`
   - Installation directory mặc định: `C:\Program Files\PostgreSQL\15`

3. **Verify installation:**
   - PostgreSQL sẽ tự động start service
   - Check trong **Services** (Windows + R → `services.msc`)
   - Tìm service: **postgresql-x64-15** (hoặc version của bạn)

---

## Bước 2: Cài Đặt pgvector Extension

### Option 1: Download Pre-built Binary (Easiest)

1. **Download pgvector:**
   - Vào: https://github.com/pgvector/pgvector/releases
   - Download file `.zip` cho PostgreSQL version của bạn
   - Ví dụ: `pgvector-v0.5.1-postgresql-15-windows-x64.zip`

2. **Extract và Copy:**
   - Extract file `.zip`
   - Copy các file `.dll` vào thư mục PostgreSQL `lib`:
     ```
     C:\Program Files\PostgreSQL\15\lib\
     ```
   - Copy file `vector.control` và `vector--*.sql` vào thư mục `share/extension`:
     ```
     C:\Program Files\PostgreSQL\15\share\extension\
     ```

3. **Restart PostgreSQL Service:**
   - Mở **Services** (Windows + R → `services.msc`)
   - Tìm service **postgresql-x64-15**
   - Right-click → **Restart**

### Option 2: Build from Source (Advanced)

Nếu pre-built binary không có, bạn có thể build từ source:
```bash
# Cần cài Visual Studio Build Tools trước
# Xem: https://github.com/pgvector/pgvector#windows
```

---

## Bước 3: Truy Cập PostgreSQL

### Option 1: Sử dụng psql (Command Line)

1. **Mở Command Prompt hoặc PowerShell:**
   - Windows + R → `cmd` hoặc `powershell`

2. **Navigate đến PostgreSQL bin folder:**
   ```cmd
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```

3. **Kết nối với PostgreSQL:**
   ```cmd
   psql -U postgres
   ```
   - Nhập password của user `postgres` (password bạn đã set khi cài)

4. **Tạo database:**
   ```sql
   CREATE DATABASE bot_writing_advanced;
   ```

5. **Kết nối vào database vừa tạo:**
   ```sql
   \c bot_writing_advanced
   ```

6. **Enable extensions:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "vector";
   ```

7. **Verify pgvector đã được cài:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
   Nếu thấy row với `extname = 'vector'` → ✅ pgvector đã cài thành công!

---

### Option 2: Sử dụng pgAdmin (GUI - Dễ hơn)

1. **Mở pgAdmin:**
   - Start Menu → Tìm **pgAdmin 4**
   - Mở pgAdmin 4

2. **Kết nối với server:**
   - Right-click **Servers** → **Register** → **Server**
   - Name: `PostgreSQL 15` (hoặc tên bạn muốn)
   - Connection tab:
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: (password bạn đã set)
   - Click **Save**

3. **Tạo database:**
   - Expand **Servers** → **PostgreSQL 15** → **Databases**
   - Right-click **Databases** → **Create** → **Database**
   - Database name: `bot_writing_advanced`
   - Click **Save**

4. **Enable extensions:**
   - Expand **bot_writing_advanced** → **Extensions**
   - Right-click **Extensions** → **Create** → **Extension**
   - Name: `uuid-ossp` → Click **Save**
   - Repeat cho `vector` extension

5. **Verify pgvector:**
   - Right-click **bot_writing_advanced** → **Query Tool**
   - Run query:
     ```sql
     SELECT * FROM pg_extension WHERE extname = 'vector';
     ```
   - Nếu thấy result → ✅ Success!

---

## Bước 4: Chạy Schema SQL

### Option 1: Từ psql Command Line

1. **Mở Command Prompt:**
   ```cmd
   cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
   ```

2. **Chạy schema:**
   ```cmd
   "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d bot_writing_advanced -f server/db/schema.sql
   ```
   - Nhập password khi được hỏi

### Option 2: Từ pgAdmin Query Tool

1. **Mở pgAdmin** → Connect to `bot_writing_advanced` database

2. **Open Query Tool:**
   - Right-click **bot_writing_advanced** → **Query Tool**

3. **Copy và paste nội dung file `server/db/schema.sql`** vào Query Tool

4. **Click Execute** (hoặc F5)

5. **Verify:**
   - Run query:
     ```sql
     SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public';
     ```
   - Bạn sẽ thấy tất cả tables đã được tạo: `books`, `users`, `book_contexts`, etc.

---

## Bước 5: Test Connection từ Code

1. **Update `.env` file:**
   ```bash
   DATABASE_URL=postgres://postgres:your_password@localhost:5432/bot_writing_advanced
   ```
   Replace `your_password` với password của bạn.

2. **Test connection:**
   ```bash
   npm run server
   ```

3. **Bạn sẽ thấy:**
   ```
   Database connected
   ```

---

## 🐛 Troubleshooting

### Lỗi: "extension 'vector' does not exist"

**Nguyên nhân:** pgvector chưa được cài đúng.

**Giải pháp:**
1. Check các file `.dll` đã copy vào `lib` folder chưa
2. Check `vector.control` và `vector--*.sql` đã copy vào `share/extension` chưa
3. **Restart PostgreSQL service**
4. Verify trong pgAdmin: 
   ```sql
   SELECT * FROM pg_available_extensions WHERE name = 'vector';
   ```
   Nếu không thấy → pgvector chưa được install đúng

### Lỗi: "password authentication failed"

**Nguyên nhân:** Sai password.

**Giải pháp:**
- Reset password:
  1. Mở `pg_hba.conf` (thường ở: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`)
  2. Tạm thời set `md5` → `trust` (chỉ để test)
  3. Restart PostgreSQL service
  4. Connect và change password:
     ```sql
     ALTER USER postgres WITH PASSWORD 'new_password';
     ```
  5. Set lại `trust` → `md5` trong `pg_hba.conf`
  6. Restart service

### Lỗi: "could not connect to server"

**Nguyên nhân:** PostgreSQL service chưa chạy.

**Giải pháp:**
1. Mở **Services** (Windows + R → `services.msc`)
2. Tìm **postgresql-x64-15**
3. Right-click → **Start**

### Lỗi: "port 5432 is already in use"

**Nguyên nhân:** Port bị conflict.

**Giải pháp:**
- Check process đang dùng port 5432:
  ```cmd
  netstat -ano | findstr :5432
  ```
- Hoặc thay đổi port trong PostgreSQL config

---

## ✅ Checklist

- [ ] PostgreSQL 15+ đã cài đặt
- [ ] PostgreSQL service đang chạy
- [ ] pgvector extension đã cài (files .dll, .control, .sql)
- [ ] PostgreSQL service đã restart sau khi cài pgvector
- [ ] Database `bot_writing_advanced` đã được tạo
- [ ] Extensions `uuid-ossp` và `vector` đã enable
- [ ] Schema SQL đã chạy thành công
- [ ] `.env` file đã được cấu hình
- [ ] Test connection từ code thành công

---

## 📝 Quick Reference Commands

### psql Commands:
```sql
-- List all databases
\l

-- Connect to database
\c database_name

-- List all tables
\dt

-- List all extensions
\dx

-- Exit psql
\q
```

### Useful Queries:
```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check table structure
\d table_name
```

---

## 🚀 Next Steps

Sau khi setup xong PostgreSQL + pgvector:

1. **Test connection** từ code:
   ```bash
   npm run server
   ```

2. **Continue với Phase 1:**
   - Xem `PHASE_1_QUICK_START.md`
   - Implement các services còn lại

---

**Status:** Ready to Start  
**Difficulty:** Medium  
**Time:** ~30 minutes


