# 🐳 Docker Setup Guide

Hướng dẫn chạy ứng dụng trên Docker để kiểm tra luồng hoạt động.

## 📋 Yêu cầu

- Docker Desktop (Windows/Mac) hoặc Docker Engine + Docker Compose (Linux)
- Git

## 🚀 Quick Start

### 1. Tạo file `.env`

```bash
cp .env.example .env
```

Sau đó chỉnh sửa các giá trị cần thiết trong `.env`:
- `GEMINI_API_KEY`: API key từ Google AI Studio
- `POSTGRES_PASSWORD`: Mật khẩu database (nếu muốn thay đổi)

### 2. Build và chạy tất cả services

```bash
docker-compose up --build
```

Hoặc chạy ở background:

```bash
docker-compose up -d --build
```

### 3. Kiểm tra services

Sau khi build xong, các services sẽ chạy trên:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Embedding Server**: http://localhost:8000
- **PostgreSQL**: localhost:5432

### 4. Kiểm tra health

**Tự động (khuyến nghị):**

```bash
# Windows PowerShell
.\docker-test-flow.ps1

# Linux/Mac
chmod +x docker-test-flow.sh
./docker-test-flow.sh
```

**Thủ công:**

```bash
# Backend health
curl http://localhost:3001/health

# Embedding server health
curl http://localhost:8000/health

# Database connection (từ trong container)
docker-compose exec backend npm run db:test
```

## 🔍 Kiểm tra luồng hoạt động

### 1. Database Schema

Schema sẽ tự động được deploy khi container PostgreSQL khởi động lần đầu (từ `server/db/schema.sql`).

Kiểm tra schema:
```bash
docker-compose exec backend npm run db:check
```

### 2. Embedding Service

Test embedding service:
```bash
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Hello world"]}'
```

### 3. Backend API

Test Google Docs import:
```bash
curl -X POST http://localhost:3001/api/google-docs/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.google.com/document/d/YOUR_DOC_ID"}'
```

### 4. Frontend

Mở browser và truy cập: http://localhost:3000

## 📊 Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ embedding
docker-compose logs -f embedding

# Chỉ database
docker-compose logs -f postgres
```

## 🛠️ Commands hữu ích

```bash
# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (xóa database data)
docker-compose down -v

# Rebuild một service cụ thể
docker-compose build backend
docker-compose up -d backend

# Vào shell của container
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d writing_advanced

# Xem status
docker-compose ps
```

## 🔧 Troubleshooting

### Database không kết nối được

1. Kiểm tra database đã sẵn sàng:
```bash
docker-compose exec postgres pg_isready -U postgres
```

2. Kiểm tra DATABASE_URL trong backend container:
```bash
docker-compose exec backend env | grep DATABASE_URL
```

### Embedding server chậm khởi động

Embedding server cần tải model lần đầu (có thể mất vài phút). Kiểm tra logs:
```bash
docker-compose logs -f embedding
```

### Frontend không kết nối được backend

1. Kiểm tra `VITE_API_BASE_URL` trong `.env`
2. Kiểm tra CORS settings trong backend
3. Kiểm tra network:
```bash
docker-compose exec frontend wget -O- http://backend:3001/health
```

## 📝 Development Mode

Để chạy ở development mode với hot-reload:

### Option 1: Chỉ chạy infrastructure (DB, Embedding) trên Docker

```bash
# Chạy chỉ DB và Embedding
docker-compose up postgres embedding

# Chạy backend và frontend local
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

### Option 2: Sử dụng volumes để mount code

Sửa `docker-compose.yml` để mount code vào containers (đã có sẵn cho backend).

## 🎯 Kiểm tra luồng hoạt động đầy đủ

1. **Start services**: `docker-compose up -d`
2. **Wait for health**: Đợi tất cả services healthy (30s-2 phút)
3. **Check database**: `docker-compose exec backend npm run db:check`
4. **Test embedding**: `curl http://localhost:8000/health`
5. **Test backend**: `curl http://localhost:3001/health`
6. **Open frontend**: http://localhost:3000
7. **Import Google Doc**: Sử dụng UI để import một Google Doc
8. **Check processing**: Xem logs để kiểm tra processing flow
9. **Test semantic search**: Gửi query từ frontend

## 📦 Production Build

Để build production images:

```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

