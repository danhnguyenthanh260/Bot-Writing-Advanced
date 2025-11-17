# Hướng Dẫn Setup Database

Hướng dẫn đầy đủ về setup database PostgreSQL cho dự án, bao gồm quick start, chi tiết và troubleshooting.

## 📋 Mục Lục

1. [Quick Start](#quick-start)
2. [Setup Chi Tiết](#setup-chi-tiết)
3. [Troubleshooting](#troubleshooting)
4. [Migration System](#migration-system)

---

## 🚀 Quick Start

### Yêu Cầu

- PostgreSQL đã được cài đặt và đang chạy
- File `.env` có cấu hình `DATABASE_URL`

### Bước 1: Tạo Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE bot_writing_advanced;
\q
```

### Bước 2: Apply Schema

```bash
npm run db:setup
```

Script sẽ tự động:
- ✅ Tạo database nếu chưa có
- ✅ Apply schema mới (12 bảng)
- ✅ Tạo migration tracking table
- ✅ Đánh dấu migrations đã apply

### Bước 3: Kiểm Tra

```bash
npm run db:check
```

**Xong!** Database đã sẵn sàng sử dụng.

---

## 📖 Setup Chi Tiết

### Cách 1: Sử dụng Script Tự Động (Khuyến nghị)

#### Bước 1: Kiểm tra cấu hình

Đảm bảo file `.env` có `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bot_writing_advanced
```

Hoặc các biến riêng lẻ:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bot_writing_advanced
```

#### Bước 2: Chạy setup script

```bash
npm run db:setup
```

Script sẽ tự động:
1. ✅ Kết nối đến PostgreSQL (database `postgres`)
2. ✅ Tạo database `bot_writing_advanced` nếu chưa có
3. ✅ Apply schema mới (tất cả 12 bảng)
4. ✅ Tạo migration tracking table
5. ✅ Đánh dấu migrations đã apply

### Cách 2: Setup Thủ Công

#### Bước 1: Tạo database

Kết nối đến PostgreSQL:

```bash
psql -U postgres
```

Tạo database:

```sql
CREATE DATABASE bot_writing_advanced;
\q
```

#### Bước 2: Apply schema

```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

#### Bước 3: Apply migration data_flow_logs (nếu cần)

```bash
psql -U postgres -d bot_writing_advanced -f server/db/migrate_data_flow_logs.sql
```

### Kiểm Tra Kết Quả

#### Kiểm tra database đã được tạo:

```bash
psql -U postgres -l | findstr bot_writing_advanced
```

#### Kiểm tra tables:

```bash
npm run db:check
```

Hoặc trong psql:

```sql
\c bot_writing_advanced
\dt
```

#### Kiểm tra migrations đã apply:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

---

## 🔧 Troubleshooting

### Lỗi: Database không tồn tại

```
Error: database "bot_writing_advanced" does not exist
```

**Giải pháp**: Script sẽ tự động tạo database. Nếu vẫn lỗi, kiểm tra:
- PostgreSQL service đang chạy
- User có quyền tạo database
- `DATABASE_URL` đúng format

### Lỗi: Permission denied

```
Error: permission denied to create database
```

**Giải pháp**: Đảm bảo user trong `DATABASE_URL` có quyền tạo database:

```sql
-- Kết nối với superuser
psql -U postgres

-- Cấp quyền
ALTER USER your_user CREATEDB;
```

### Lỗi: Extension không tồn tại

```
Error: extension "vector" does not exist
```

**Giải pháp**: Cài đặt pgvector extension. Xem [PGVECTOR_SETUP.md](./PGVECTOR_SETUP.md)

### Lỗi: Table already exists

Script sẽ tự động bỏ qua nếu table đã tồn tại. Nếu muốn reset hoàn toàn:

```bash
npm run db:reset
```

⚠️ **Cảnh báo**: `db:reset` sẽ **XÓA TOÀN BỘ DỮ LIỆU**

### Lỗi: "client password must be a string"

**Nguyên nhân:** Password trong DATABASE_URL không được parse đúng.

**Giải pháp:**

1. **Kiểm tra password trong .env:**
   ```env
   # Đúng
   DATABASE_URL=postgresql://postgres:12345@localhost:5432/bot_writing_advanced
   
   # Sai (có khoảng trắng)
   DATABASE_URL=postgresql://postgres: 12345 @localhost:5432/bot_writing_advanced
   ```

2. **Nếu password có ký tự đặc biệt, URL encode:**
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - `#` → `%23`
   - `%` → `%25`

   **Ví dụ:**
   - Password: `mypass@123` → `mypass%40123`
   - Password: `pass:word` → `pass%3Aword`

3. **Dùng biến môi trường riêng lẻ thay vì DATABASE_URL:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=bot_writing_advanced
   ```

### Lỗi: "connection refused"

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL service
sc query postgresql-x64-15

# Khởi động nếu chưa chạy
net start postgresql-x64-15
```

### Test Connection

#### Option A: Dùng psql (Khuyến nghị)

```bash
psql -U postgres -d bot_writing_advanced
```

Nếu kết nối được, bạn sẽ thấy:
```
psql (15.x)
Type "help" for help.

bot_writing_advanced=#
```

#### Option B: Dùng Script

```bash
npm run db:test
```

#### Option C: Test thủ công

Tạo file `test-db-connection.js`:

```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT version(), current_database()')
  .then(result => {
    console.log('✅ Connection successful!');
    console.log('Database:', result.rows[0].current_database);
    pool.end();
  })
  .catch(error => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });
```

Chạy:
```bash
node test-db-connection.js
```

---

## 🔄 Migration System

### Migration Tracking Table

Script tự động tạo bảng `schema_migrations` để theo dõi các migration đã apply:

```sql
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Migrations Hiện Tại

1. **1.0.0-initial**: Initial schema với tất cả 12 bảng
2. **1.0.1-data-flow-logs**: Thêm bảng `data_flow_logs`

### Thêm Migration Mới Trong Tương Lai

Khi cần thêm migration mới:

1. Tạo file migration SQL: `server/db/migrations/YYYYMMDD-description.sql`
2. Thêm function vào `setupDatabase.ts`:

```typescript
async function applyNewMigration(pool: Pool): Promise<void> {
  const version = '1.0.2-new-feature';
  const description = 'Add new feature';
  
  if (await isMigrationApplied(pool, version)) {
    return;
  }
  
  // Apply migration SQL
  const migrationSQL = readFileSync('path/to/migration.sql', 'utf-8');
  await pool.query(migrationSQL);
  await markMigrationApplied(pool, version, description);
}
```

3. Gọi function trong `setupDatabase()`:

```typescript
await applyNewMigration(pool);
```

### Cập Nhật Database Sau Này

Khi có schema mới hoặc migration mới:

1. **Cập nhật code**: Pull code mới có migration
2. **Chạy setup lại**: `npm run db:setup`
   - Script sẽ tự động phát hiện migrations chưa apply
   - Chỉ apply các migrations mới
   - Không ảnh hưởng đến dữ liệu hiện có

---

## ✅ Checklist Sau Khi Setup

Sau khi hoàn thành, đảm bảo:

- [ ] Database `bot_writing_advanced` đã được tạo
- [ ] `DATABASE_URL` trong `.env` đúng format
- [ ] Có thể kết nối bằng `psql -U postgres -d bot_writing_advanced`
- [ ] Schema đã được apply (12 tables)
- [ ] Extensions đã cài (uuid-ossp, vector)
- [ ] `npm run db:test` hoặc script test connection thành công

---

## 📝 Quick Reference

| Lệnh | Mô tả |
|------|------|
| `npm run db:setup` | Setup database mới hoặc cập nhật |
| `npm run db:check` | Kiểm tra schema đã deploy |
| `npm run db:test` | Test connection |
| `npm run db:reset` | ⚠️ Reset database (xóa toàn bộ dữ liệu) |

---

## ⚠️ Lưu Ý Quan Trọng

- ⚠️ `db:reset` sẽ **XÓA TOÀN BỘ DỮ LIỆU**
- ✅ `db:setup` an toàn, không xóa dữ liệu hiện có
- ✅ Migrations chỉ apply 1 lần (tracked trong `schema_migrations`)
- ✅ Có thể chạy `db:setup` nhiều lần an toàn

---

**Xem thêm:**
- [DATABASE_URL_GUIDE.md](./DATABASE_URL_GUIDE.md) - Hướng dẫn cấu hình DATABASE_URL
- [VERIFY_DATABASE_CONNECTION.md](./VERIFY_DATABASE_CONNECTION.md) - Kiểm tra kết nối
- [DB_RESET_GUIDE.md](./DB_RESET_GUIDE.md) - Reset database
- [DATABASE_TABLES_OVERVIEW.md](./DATABASE_TABLES_OVERVIEW.md) - Tổng quan các bảng

