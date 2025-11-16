# Database Reset Guide

## Vấn đề hiện tại

Script reset đã được tạo nhưng có 2 vấn đề:

1. **Database Connection Error**: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`
   - Có thể do `DATABASE_URL` trong `.env` không đúng format
   - Hoặc password trong connection string không phải string

2. **Import Path**: Đã sửa trong `migrate.ts`

## Cách sửa

### 1. Kiểm tra DATABASE_URL trong `.env`

Đảm bảo `DATABASE_URL` có format đúng:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

Ví dụ:
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/writing_db
```

**Lưu ý**: Nếu password có ký tự đặc biệt, cần URL encode:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

### 2. Chạy reset schema

Sau khi sửa `.env`, chạy:

```bash
npm run db:reset
```

Hoặc kiểm tra schema hiện tại:

```bash
npm run db:check
```

## Scripts đã tạo

- `npm run db:reset` - Drop và recreate toàn bộ schema
- `npm run db:check` - Kiểm tra schema status

## Manual Reset (nếu script không chạy được)

Nếu script không chạy được, bạn có thể chạy SQL trực tiếp trong PostgreSQL:

```sql
-- Drop all tables
DROP TABLE IF EXISTS chapter_archive CASCADE;
DROP TABLE IF EXISTS processing_status CASCADE;
DROP TABLE IF EXISTS embedding_cache CASCADE;
DROP TABLE IF EXISTS workspace_canvas_pages CASCADE;
DROP TABLE IF EXISTS workspace_chat_messages CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS chapter_chunks CASCADE;
DROP TABLE IF EXISTS recent_chapters CASCADE;
DROP TABLE IF EXISTS book_contexts CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Sau đó chạy toàn bộ file schema.sql
```

## Files liên quan

- `server/db/resetSchema.ts` - Script reset schema
- `server/db/checkSchema.ts` - Script check schema
- `server/db/schema.sql` - Schema definition
- `server/db/migrate.ts` - Auto-deploy schema











