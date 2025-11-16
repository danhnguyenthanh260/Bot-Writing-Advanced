# Hướng Dẫn Kiểm Tra Kết Nối Database

Sau khi tạo database thủ công, làm thế nào để đảm bảo code đã kết nối được với database.

## Bước 1: Tạo Database Thủ Công

```bash
psql -U postgres
```

```sql
CREATE DATABASE bot_writing_advanced;
\q
```

## Bước 2: Kiểm Tra Connection

### Cách 1: Dùng Script Verify (Khuyến nghị)

```bash
npm run db:verify
```

Script này sẽ kiểm tra:
- ✅ Connection đến database
- ✅ Database có tồn tại không
- ✅ Extensions đã cài chưa (uuid-ossp, vector)
- ✅ Tables đã được tạo chưa (12 bảng)
- ✅ Migration tracking table

### Cách 2: Test Connection Cơ Bản

```bash
npm run db:test
```

### Cách 3: Kiểm Tra Thủ Công

```bash
psql -U postgres -d bot_writing_advanced
```

```sql
-- Kiểm tra connection
SELECT version(), current_database(), current_user;

-- Kiểm tra extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');

-- Kiểm tra tables
\dt

-- Kiểm tra số lượng tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

## Bước 3: Apply Schema (Nếu Chưa Có Tables)

Nếu `db:verify` báo thiếu tables, apply schema:

### Option 1: Dùng Script (Nếu chạy được)

```bash
npm run db:setup
```

### Option 2: SQL Trực Tiếp (Khuyến nghị nếu script lỗi)

```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

## Bước 4: Verify Lại

Sau khi apply schema, verify lại:

```bash
npm run db:verify
```

Kết quả mong đợi:
```
✅ Connection successful!
✅ Database exists
✅ Extensions installed
✅ All 12 tables present
✅ Migration tracking ready
```

## Troubleshooting

### Lỗi: Connection failed

```
❌ Connection failed: SASL: SCRAM-SERVER-FIRST-MESSAGE
```

**Giải pháp:**
1. Kiểm tra PostgreSQL service đang chạy:
   ```bash
   sc query postgresql-x64-15
   ```

2. Kiểm tra DATABASE_URL trong `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/bot_writing_advanced
   ```

3. Test connection thủ công:
   ```bash
   psql -U postgres -d bot_writing_advanced
   ```

### Lỗi: Database does not exist

```
❌ Database does not exist
```

**Giải pháp:**
```sql
CREATE DATABASE bot_writing_advanced;
```

### Lỗi: Extensions missing

```
❌ uuid-ossp - NOT INSTALLED
❌ vector - NOT INSTALLED
```

**Giải pháp:**
```sql
-- uuid-ossp thường có sẵn
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- vector cần cài đặt (xem BUILD_PGVECTOR_WINDOWS.md)
CREATE EXTENSION IF NOT EXISTS "vector";
```

### Lỗi: Tables missing

```
❌ books - MISSING
❌ users - MISSING
...
```

**Giải pháp:**
Apply schema:
```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

## Checklist

Sau khi setup, đảm bảo:

- [ ] PostgreSQL service đang chạy
- [ ] Database `bot_writing_advanced` đã được tạo
- [ ] `DATABASE_URL` trong `.env` đúng format
- [ ] `npm run db:verify` pass tất cả tests
- [ ] Có 12 tables trong database
- [ ] Extensions (uuid-ossp, vector) đã cài

## Quick Commands

```bash
# 1. Verify connection và setup
npm run db:verify

# 2. Nếu thiếu tables, apply schema
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql

# 3. Verify lại
npm run db:verify

# 4. Test connection cơ bản
npm run db:test
```

## Kết Quả Mong Đợi

Khi `npm run db:verify` chạy thành công, bạn sẽ thấy:

```
🚀 Database Setup Verification
==================================================
✅ Connection successful!
   - PostgreSQL: PostgreSQL 15.x
   - Database: bot_writing_advanced
   - User: postgres

✅ Database exists
   - Size: XXX kB

✅ Extensions installed
   ✅ uuid-ossp (v1.1)
   ✅ vector (v0.5.0)

✅ All 12 tables present
   ✅ books
   ✅ users
   ✅ book_contexts
   ... (tất cả 12 bảng)

✅ Migration tracking ready
   ✅ Applied migrations: 2
      - 1.0.0-initial: Initial schema
      - 1.0.1-data-flow-logs: Add data_flow_logs table

✅ Database setup is complete and ready to use!
```

