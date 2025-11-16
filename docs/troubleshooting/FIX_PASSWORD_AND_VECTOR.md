# Sửa Lỗi Password và Cài pgvector

## Vấn đề 1: Password Connection Error

**Lỗi:** `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**Giải pháp:** Đã sửa `connection.ts` để xử lý password tốt hơn. Nếu vẫn lỗi, thử:

### Option 1: Dùng biến môi trường riêng lẻ

Thay vì `DATABASE_URL`, dùng các biến riêng trong `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=12345
DB_NAME=bot_writing_advanced
```

### Option 2: URL encode password trong DATABASE_URL

Nếu password có ký tự đặc biệt, URL encode:

```env
# Password: 12345
DATABASE_URL=postgresql://postgres:12345@localhost:5432/bot_writing_advanced

# Password: pass@123 → encode thành pass%40123
DATABASE_URL=postgresql://postgres:pass%40123@localhost:5432/bot_writing_advanced
```

## Vấn đề 2: Extension "vector" chưa được cài

**Lỗi:** `extension "vector" is not available`

**Giải pháp:** Có 2 cách:

### Cách 1: Cài pgvector (Khuyến nghị cho production)

Xem hướng dẫn trong:
- `BUILD_PGVECTOR_WINDOWS.md`
- `QUICK_INSTALL_PGVECTOR.md`

Sau khi cài xong:
```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

### Cách 2: Dùng Schema Tạm Thời (Để test nhanh)

Dùng schema không có vector để setup trước:

```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema_without_vector.sql
```

Schema này dùng `BYTEA` thay vì `vector(384)` cho các cột embedding.

**Lưu ý:** Sau khi cài pgvector, cần migrate lại:
```sql
-- 1. Cài extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Đổi kiểu dữ liệu
ALTER TABLE recent_chapters 
  ALTER COLUMN embedding_vector TYPE vector(384) USING embedding_vector::text::vector;

ALTER TABLE chapter_chunks 
  ALTER COLUMN chunk_embedding TYPE vector(384) USING chunk_embedding::text::vector;

ALTER TABLE embedding_cache 
  ALTER COLUMN embedding_vector TYPE vector(384) USING embedding_vector::text::vector;

ALTER TABLE chapter_archive 
  ALTER COLUMN embedding_vector TYPE vector(384) USING embedding_vector::text::vector;
```

## Setup Nhanh (Không Cần Vector Ngay)

### Bước 1: Tạo database
```bash
psql -U postgres
CREATE DATABASE bot_writing_advanced;
\q
```

### Bước 2: Apply schema không có vector
```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema_without_vector.sql
```

### Bước 3: Test connection
```bash
npm run db:test
```

Nếu vẫn lỗi password, thử dùng biến môi trường riêng lẻ (xem Option 1 ở trên).

### Bước 4: Cài pgvector sau (khi cần)

Khi cần dùng embeddings, cài pgvector và migrate (xem Cách 2 ở trên).

## Kiểm Tra Sau Khi Setup

```bash
psql -U postgres -d bot_writing_advanced
```

```sql
-- Kiểm tra tables (phải có 12)
\dt

-- Kiểm tra extensions
SELECT extname FROM pg_extension;

-- Kiểm tra connection từ code
-- Chạy: npm run db:test
```

## Troubleshooting

### Vẫn lỗi password sau khi sửa

1. **Kiểm tra .env file:**
   - Không có khoảng trắng thừa
   - Không có quotes (`"` hoặc `'`)
   - Password đúng

2. **Test với psql:**
   ```bash
   psql -U postgres -d bot_writing_advanced
   ```
   Nếu psql kết nối được nhưng code không → vấn đề ở cách parse password

3. **Dùng biến riêng lẻ:**
   Thay `DATABASE_URL` bằng `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.

### Vector extension không cài được

1. **Kiểm tra PostgreSQL version:**
   ```sql
   SELECT version();
   ```

2. **Xem hướng dẫn cài pgvector:**
   - `BUILD_PGVECTOR_WINDOWS.md`
   - Cần Visual Studio Build Tools

3. **Tạm thời dùng schema không có vector:**
   - `server/db/schema_without_vector.sql`
   - Có thể migrate sau

## Tóm Tắt

✅ **Đã sửa:** `connection.ts` để xử lý password tốt hơn
✅ **Đã tạo:** `schema_without_vector.sql` để setup không cần pgvector
✅ **Hướng dẫn:** Cài pgvector và migrate sau

**Next steps:**
1. Apply schema không có vector: `psql -U postgres -d bot_writing_advanced -f server/db/schema_without_vector.sql`
2. Test connection: `npm run db:test`
3. Cài pgvector sau khi cần (xem BUILD_PGVECTOR_WINDOWS.md)

