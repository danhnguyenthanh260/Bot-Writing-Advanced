# Hướng Dẫn Setup Database Từng Bước

Sau khi xóa sạch database, làm thế nào để setup lại và đảm bảo code kết nối được.

## Bước 1: Tạo Database Thủ Công

```bash
psql -U postgres
```

```sql
-- Tạo database mới
CREATE DATABASE bot_writing_advanced;

-- Kiểm tra đã tạo thành công
\l

-- Thoát
\q
```

## Bước 2: Kiểm Tra DATABASE_URL trong .env

Mở file `.env` và đảm bảo có:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bot_writing_advanced
```

**Lưu ý quan trọng:**
- Thay `YOUR_PASSWORD` bằng password thực tế của bạn
- Nếu password có ký tự đặc biệt (@, :, /, #, %), cần URL encode:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`
  - `#` → `%23`
  - `%` → `%25`

**Ví dụ:**
- Password: `mypass@123` → `mypass%40123`
- Password: `pass:word` → `pass%3Aword`

## Bước 3: Test Connection Cơ Bản

### Option A: Dùng psql (Khuyến nghị để test nhanh)

```bash
psql -U postgres -d bot_writing_advanced
```

Nếu kết nối được, bạn sẽ thấy:
```
psql (15.x)
Type "help" for help.

bot_writing_advanced=#
```

Thoát: `\q`

### Option B: Dùng Script (Nếu connection.ts hoạt động)

```bash
npm run db:test
```

## Bước 4: Apply Schema

Vì script setup không chạy được, dùng SQL trực tiếp:

```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

**Kết quả mong đợi:**
```
CREATE EXTENSION
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
...
```

## Bước 5: Verify Schema Đã Apply

```bash
psql -U postgres -d bot_writing_advanced
```

```sql
-- Kiểm tra số lượng tables (phải có 12)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Liệt kê tất cả tables
\dt

-- Kiểm tra extensions
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector');
```

**Kết quả mong đợi:**
- 12 tables: books, users, book_contexts, recent_chapters, chapter_chunks, workspaces, workspace_chat_messages, workspace_canvas_pages, embedding_cache, processing_status, data_flow_logs, chapter_archive
- 2 extensions: uuid-ossp, vector

## Bước 6: Test Connection Từ Code

### Test 1: Kiểm tra DATABASE_URL

Tạo file test đơn giản `test-db-connection.js`:

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
    console.error('\n💡 Check:');
    console.error('  1. DATABASE_URL in .env');
    console.error('  2. PostgreSQL service running');
    console.error('  3. Database exists');
    process.exit(1);
  });
```

Chạy:
```bash
node test-db-connection.js
```

### Test 2: Dùng Script Có Sẵn

```bash
npm run db:test
```

## Troubleshooting Connection Issues

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
   ```javascript
   // Test trong Node.js
   const password = 'my@pass:123';
   const encoded = encodeURIComponent(password);
   console.log(encoded); // my%40pass%3A123
   ```

3. **Dùng biến môi trường riêng lẻ thay vì DATABASE_URL:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=bot_writing_advanced
   ```
   
   Sau đó sửa `connection.ts` để ưu tiên các biến này.

### Lỗi: "database does not exist"

**Giải pháp:**
```sql
CREATE DATABASE bot_writing_advanced;
```

### Lỗi: "connection refused"

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL service
sc query postgresql-x64-15

# Khởi động nếu chưa chạy
net start postgresql-x64-15
```

## Checklist Sau Khi Setup

Sau khi hoàn thành, đảm bảo:

- [ ] Database `bot_writing_advanced` đã được tạo
- [ ] `DATABASE_URL` trong `.env` đúng format
- [ ] Có thể kết nối bằng `psql -U postgres -d bot_writing_advanced`
- [ ] Schema đã được apply (12 tables)
- [ ] Extensions đã cài (uuid-ossp, vector)
- [ ] `npm run db:test` hoặc script test connection thành công

## Quick Test Commands

```bash
# 1. Test connection bằng psql
psql -U postgres -d bot_writing_advanced -c "SELECT version();"

# 2. Kiểm tra tables
psql -U postgres -d bot_writing_advanced -c "\dt"

# 3. Kiểm tra extensions
psql -U postgres -d bot_writing_advanced -c "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');"

# 4. Test từ code (nếu connection.ts hoạt động)
npm run db:test
```

## Nếu Vẫn Không Kết Nối Được

1. **Kiểm tra PostgreSQL service:**
   ```bash
   sc query postgresql-x64-15
   ```

2. **Test connection thủ công:**
   ```bash
   psql -U postgres -h localhost -p 5432
   ```

3. **Kiểm tra .env file:**
   - Đảm bảo không có khoảng trắng thừa
   - Đảm bảo password đúng
   - Thử URL encode password nếu có ký tự đặc biệt

4. **Tạo file test đơn giản:**
   ```javascript
   // test-simple.js
   const { Pool } = require('pg');
   const pool = new Pool({
     host: 'localhost',
     port: 5432,
     user: 'postgres',
     password: 'your_password', // Thay bằng password thực
     database: 'bot_writing_advanced'
   });
   
   pool.query('SELECT 1')
     .then(() => console.log('✅ OK'))
     .catch(err => console.error('❌', err.message))
     .finally(() => pool.end());
   ```

