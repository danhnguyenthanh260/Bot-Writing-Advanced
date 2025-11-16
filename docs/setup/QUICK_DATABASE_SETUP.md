# Quick Database Setup

Hướng dẫn nhanh để setup database mới.

## Bước 1: Tạo Database (Thủ Công)

Kết nối đến PostgreSQL:

```bash
psql -U postgres
```

Tạo database:

```sql
CREATE DATABASE bot_writing_advanced;
\q
```

## Bước 2: Apply Schema

Sau khi database đã được tạo, chạy:

```bash
npm run db:setup
```

Script sẽ:
- ✅ Apply schema mới (12 bảng)
- ✅ Tạo migration tracking table
- ✅ Đánh dấu migrations đã apply

## Hoặc Dùng SQL Trực Tiếp

Nếu script không chạy được, dùng SQL trực tiếp:

```bash
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

## Kiểm Tra

```bash
npm run db:check
```

Xem chi tiết trong `DATABASE_SETUP_GUIDE.md`.

