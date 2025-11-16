# Sửa Lỗi Port 5433

## Vấn Đề

Bạn đã tạo container `postgres-pgvector` trên port 5433, nhưng `.env` đang dùng port sai.

## Giải Pháp

### Step 1: Kiểm tra Container Đang Chạy

```powershell
docker ps | findstr postgres-pgvector
```

Nếu thấy container đang chạy → OK!

### Step 2: Sửa `.env`

Mở file `.env` và sửa `DATABASE_URL`:

**Sai:**
```
DATABASE_URL=postgresql://postgres:12345@localhost:54333/bot_writing_advanced
#                                                          ^^^^^^ SAI - 5 chữ số
```

**Đúng:**
```
DATABASE_URL=postgresql://postgres:12345@localhost:5433/bot_writing_advanced
#                                                         ^^^^^ ĐÚNG - 4 chữ số
```

### Step 3: Test Connection

```powershell
npm run db:test
```

Nếu thành công, bạn sẽ thấy:
```
✅ Connection successful!
```

### Step 4: Enable Extension Vector

```powershell
npm run db:install-vector
```

## Tại Sao Phải Đổi Port?

**Không bắt buộc đổi port nếu:**
- Bạn chỉ dùng Docker container `postgres-pgvector` (port 5433)
- Hoặc chỉ dùng PostgreSQL Windows (port 5432)
- Hoặc chỉ dùng container từ docker-compose (port 5432)

**Cần đổi port nếu:**
- Bạn muốn chạy **cả 2 cùng lúc**:
  - PostgreSQL Windows trên port 5432
  - Docker container trên port 5433
- Hoặc bạn đã có container khác trên port 5432 và muốn thêm container mới

## Tình Huống Của Bạn

Dựa vào Docker Desktop UI:
- Container `postgres-pgvector` đang chạy trên port **5433** ✅
- Container `writing-advanced-db` đã stop (không chạy)

**Khuyến nghị:**
1. Dùng container `postgres-pgvector` trên port 5433 (đã có extension vector)
2. Sửa `.env` để dùng port 5433
3. Test connection

## Quick Fix

```powershell
# 1. Kiểm tra container đang chạy
docker ps | findstr postgres-pgvector

# 2. Sửa .env (port 5433, không phải 54333)
# DATABASE_URL=postgresql://postgres:12345@localhost:5433/bot_writing_advanced

# 3. Test
npm run db:test

# 4. Enable extension
npm run db:install-vector
```




