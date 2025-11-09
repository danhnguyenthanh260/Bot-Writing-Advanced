# Vấn Đề Khi Chạy Script Database Schema

## Tổng Quan

Khi không áp dụng database schema của project, việc chạy script sẽ gặp nhiều lỗi. Tài liệu này giải thích các vấn đề phổ biến và cách khắc phục.

## Các Vấn Đề Phổ Biến

### 1. **Lỗi Kết Nối Database**

**Triệu chứng:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
hoặc
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Nguyên nhân:**
- PostgreSQL service chưa chạy
- `DATABASE_URL` trong `.env` không đúng format
- Database chưa được tạo
- Password có ký tự đặc biệt chưa được URL encode

**Cách khắc phục:**

1. **Kiểm tra PostgreSQL service đang chạy:**
```cmd
sc query postgresql-x64-15
```
Nếu không chạy, start service:
```cmd
net start postgresql-x64-15
```

2. **Kiểm tra DATABASE_URL trong `.env`:**
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

3. **Tạo database nếu chưa có:**
```sql
CREATE DATABASE bot_writing_advanced;
```

4. **URL encode password nếu có ký tự đặc biệt:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- ` ` (space) → `%20`

---

### 2. **Lỗi Extension Không Tồn Tại**

**Triệu chứng:**
```
ERROR: extension "uuid-ossp" does not exist
hoặc
ERROR: extension "vector" does not exist
```

**Nguyên nhân:**
- Extension `uuid-ossp` chưa được cài (thường có sẵn trong PostgreSQL)
- Extension `vector` (pgvector) chưa được cài đặt

**Cách khắc phục:**

1. **Cài pgvector extension:**
   - Xem hướng dẫn trong `INSTALL_PGVECTOR_WINDOWS.md` hoặc `BUILD_PGVECTOR_WINDOWS.md`
   - Hoặc chạy script `build-pgvector.bat`

2. **Kiểm tra extension đã cài:**
```sql
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
```

3. **Cài extension thủ công (nếu cần):**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

### 3. **Lỗi File Path Không Tìm Thấy**

**Triệu chứng:**
```
Error: ENOENT: no such file or directory, open '...\server\db\schema.sql'
```

**Nguyên nhân:**
- Script chạy từ thư mục sai
- File `schema.sql` không tồn tại
- `process.cwd()` trả về path không đúng

**Cách khắc phục:**

1. **Chạy script từ thư mục root của project:**
```bash
# Đảm bảo đang ở thư mục root (có file package.json)
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
npm run db:reset
```

2. **Kiểm tra file tồn tại:**
```bash
ls server/db/schema.sql
```

3. **Sửa path trong script nếu cần:**
   - File `migrate.ts` dùng `process.cwd()` để tìm file
   - Đảm bảo chạy từ đúng thư mục

---

### 4. **Lỗi TypeScript Execution**

**Triệu chứng:**
```
Error: Cannot find module '...'
hoặc
SyntaxError: Unexpected token 'export'
```

**Nguyên nhân:**
- `ts-node` chưa được cài hoặc config sai
- Module resolution không đúng với ESM
- Thiếu flag `--esm` khi chạy TypeScript

**Cách khắc phục:**

1. **Kiểm tra script trong `package.json`:**
```json
"db:reset": "ts-node --esm server/db/resetSchema.ts",
"db:check": "ts-node --esm server/db/checkSchema.ts"
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Kiểm tra `tsconfig.json` có config đúng:**
   - `"module": "ESNext"`
   - `"moduleResolution": "bundler"`

---

### 5. **Lỗi Query Fail Do Tables Không Tồn Tại**

**Triệu chứng:**
```
Error: relation "books" does not exist
hoặc
Error: relation "users" does not exist
```

**Nguyên nhân:**
- Schema chưa được deploy
- Tables bị xóa hoặc chưa tạo
- Database connection đang trỏ đến database khác

**Cách khắc phục:**

1. **Chạy script deploy schema:**
```bash
npm run db:reset
```

2. **Hoặc chạy thủ công từ file SQL:**
```bash
# Dùng psql
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

3. **Kiểm tra schema đã deploy:**
```bash
npm run db:check
```

---

### 6. **Lỗi Permission Denied**

**Triệu chứng:**
```
Error: permission denied for schema public
hoặc
Error: must be owner of database
```

**Nguyên nhân:**
- User không có quyền tạo tables/extensions
- Database owner không đúng

**Cách khắc phục:**

1. **Đảm bảo dùng superuser (postgres):**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bot_writing_advanced
```

2. **Hoặc grant quyền cho user:**
```sql
GRANT ALL PRIVILEGES ON DATABASE bot_writing_advanced TO your_user;
GRANT ALL ON SCHEMA public TO your_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_user;
```

---

## Quy Trình Khắc Phục Tổng Thể

### Bước 1: Kiểm Tra Môi Trường

```bash
# 1. Kiểm tra PostgreSQL đang chạy
sc query postgresql-x64-15

# 2. Kiểm tra file .env tồn tại và có DATABASE_URL
cat .env

# 3. Kiểm tra database đã tạo
psql -U postgres -l | findstr bot_writing_advanced
```

### Bước 2: Test Connection

```bash
# Test connection đơn giản
npm run db:check
```

Nếu lỗi connection → sửa `DATABASE_URL` trong `.env`

### Bước 3: Kiểm Tra Extensions

```sql
-- Connect vào database
psql -U postgres -d bot_writing_advanced

-- Kiểm tra extensions
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');
```

Nếu thiếu → cài extensions (xem phần 2)

### Bước 4: Deploy Schema

```bash
# Option 1: Dùng script
npm run db:reset

# Option 2: Dùng psql trực tiếp
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

### Bước 5: Verify Schema

```bash
npm run db:check
```

Nếu thấy "Schema exists" → thành công!

---

## Checklist Trước Khi Chạy Script

- [ ] PostgreSQL service đang chạy
- [ ] File `.env` tồn tại và có `DATABASE_URL` đúng format
- [ ] Database `bot_writing_advanced` đã được tạo
- [ ] Extension `uuid-ossp` có sẵn (mặc định có)
- [ ] Extension `vector` (pgvector) đã được cài
- [ ] Đang chạy script từ thư mục root của project
- [ ] Dependencies đã được cài (`npm install`)
- [ ] User có quyền tạo tables/extensions

---

## Scripts Có Sẵn

### `npm run db:reset`
- Drop tất cả tables hiện có
- Deploy lại schema từ `schema.sql`
- **CẢNH BÁO:** Xóa toàn bộ dữ liệu!

### `npm run db:check`
- Kiểm tra schema đã deploy chưa
- Hiển thị số rows trong mỗi table
- Không thay đổi database

---

## Troubleshooting Nâng Cao

### Vấn đề: Script chạy nhưng không tạo tables

**Kiểm tra:**
1. Xem log output có lỗi gì không
2. Kiểm tra database connection có đúng database không
3. Kiểm tra user có quyền tạo tables không

**Giải pháp:**
```sql
-- Kiểm tra tables
\dt

-- Kiểm tra quyền
SELECT current_user, current_database();

-- Tạo thủ công nếu cần
\i server/db/schema.sql
```

### Vấn đề: Lỗi khi chạy từ script nhưng chạy SQL trực tiếp thì OK

**Nguyên nhân:** Có thể do:
- Path resolution sai
- Environment variables không load
- Module import issues

**Giải pháp:**
1. Đảm bảo chạy từ root directory
2. Kiểm tra `.env` được load (script dùng `dotenv`)
3. Thử chạy SQL trực tiếp bằng psql

---

## Liên Kết Tài Liệu

- `DATABASE_URL_GUIDE.md` - Hướng dẫn setup DATABASE_URL
- `DB_RESET_GUIDE.md` - Hướng dẫn reset database
- `INSTALL_PGVECTOR_WINDOWS.md` - Cài pgvector extension
- `SETUP_POSTGRESQL_WINDOWS.md` - Setup PostgreSQL

---

## Tóm Tắt

**Vấn đề chính:** Khi không có schema, script sẽ fail vì:
1. Không thể kết nối database (thiếu config)
2. Không thể tạo extensions (chưa cài pgvector)
3. Không thể tạo tables (schema chưa deploy)
4. Script không tìm thấy file (path sai)

**Giải pháp:** Luôn đảm bảo:
1. PostgreSQL đang chạy
2. `.env` có `DATABASE_URL` đúng
3. Database đã được tạo
4. Extensions đã được cài
5. Chạy script từ đúng thư mục


