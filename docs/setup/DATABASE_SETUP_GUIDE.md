# Hướng Dẫn Setup Database Mới

Hướng dẫn tạo database mới và apply schema trên PostgreSQL, với hệ thống migration để dễ dàng cập nhật sau này.

## Yêu Cầu

- PostgreSQL đã được cài đặt và đang chạy
- File `.env` có cấu hình `DATABASE_URL` hoặc các biến môi trường DB_*

## Cách 1: Sử dụng Script Tự Động (Khuyến nghị)

### Bước 1: Kiểm tra cấu hình

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

### Bước 2: Chạy setup script

```bash
npm run db:setup
```

Script sẽ tự động:
1. ✅ Kết nối đến PostgreSQL (database `postgres`)
2. ✅ Tạo database `bot_writing_advanced` nếu chưa có
3. ✅ Apply schema mới (tất cả 12 bảng)
4. ✅ Tạo migration tracking table
5. ✅ Đánh dấu migrations đã apply

## Cách 2: Setup Thủ Công

### Bước 1: Tạo database

Kết nối đến PostgreSQL:

```bash
psql -U postgres
```

Tạo database:

```sql
CREATE DATABASE bot_writing_advanced;
\q
```

### Bước 2: Apply schema

```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

### Bước 3: Apply migration data_flow_logs (nếu cần)

```bash
psql -U postgres -d bot_writing_advanced -f server/db/migrate_data_flow_logs.sql
```

## Kiểm Tra Kết Quả

### Kiểm tra database đã được tạo:

```bash
psql -U postgres -l | findstr bot_writing_advanced
```

### Kiểm tra tables:

```bash
npm run db:check
```

Hoặc trong psql:

```sql
\c bot_writing_advanced
\dt
```

### Kiểm tra migrations đã apply:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Hệ Thống Migration

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

## Cập Nhật Database Sau Này

Khi có schema mới hoặc migration mới:

1. **Cập nhật code**: Pull code mới có migration
2. **Chạy setup lại**: `npm run db:setup`
   - Script sẽ tự động phát hiện migrations chưa apply
   - Chỉ apply các migrations mới
   - Không ảnh hưởng đến dữ liệu hiện có

## Troubleshooting

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

**Giải pháp**: Cài đặt pgvector extension. Xem `BUILD_PGVECTOR_WINDOWS.md`

### Lỗi: Table already exists

Script sẽ tự động bỏ qua nếu table đã tồn tại. Nếu muốn reset hoàn toàn:

```bash
npm run db:reset
```

## Tóm Tắt

✅ **Setup mới**: `npm run db:setup`
✅ **Kiểm tra**: `npm run db:check`
✅ **Reset**: `npm run db:reset` (⚠️ Xóa toàn bộ dữ liệu)
✅ **Migration tracking**: Tự động theo dõi migrations đã apply
✅ **Cập nhật tương lai**: Chỉ cần chạy lại `npm run db:setup`

## Lưu Ý

- ⚠️ `db:reset` sẽ **XÓA TOÀN BỘ DỮ LIỆU**
- ✅ `db:setup` an toàn, không xóa dữ liệu hiện có
- ✅ Migrations chỉ apply 1 lần (tracked trong `schema_migrations`)
- ✅ Có thể chạy `db:setup` nhiều lần an toàn

