# 🔧 Docker Troubleshooting Guide

## Lỗi thường gặp và cách khắc phục

### 1. Docker Desktop chưa chạy

**Lỗi:**
```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/...": 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Nguyên nhân:** Docker Desktop chưa được khởi động.

**Giải pháp:**
1. Mở Docker Desktop từ Start Menu hoặc Desktop
2. Đợi Docker Desktop khởi động hoàn toàn (icon Docker ở system tray sẽ không còn loading)
3. Kiểm tra Docker đã sẵn sàng:
   ```powershell
   docker ps
   ```
   Nếu thành công, bạn sẽ thấy danh sách containers (có thể rỗng).

### 2. Docker Desktop không khởi động được

**Triệu chứng:** Docker Desktop không mở được hoặc bị crash.

**Giải pháp:**
1. **Kiểm tra WSL 2 (Windows):**
   ```powershell
   wsl --status
   ```
   Nếu chưa có WSL 2, cài đặt:
   ```powershell
   wsl --install
   ```

2. **Restart Docker Desktop:**
   - Right-click vào Docker icon ở system tray
   - Chọn "Restart Docker Desktop"

3. **Kiểm tra Virtualization:**
   - Đảm bảo Virtualization đã được bật trong BIOS
   - Kiểm tra trong Task Manager > Performance > CPU > Virtualization: Enabled

### 3. Port đã được sử dụng

**Lỗi:**
```
Error: bind: address already in use
```

**Giải pháp:**
1. Tìm process đang dùng port:
   ```powershell
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :8000
   netstat -ano | findstr :5432
   ```

2. Dừng process hoặc đổi port trong `docker-compose.yml`

### 4. Không đủ dung lượng disk

**Lỗi:**
```
no space left on device
```

**Giải pháp:**
1. Dọn dẹp Docker:
   ```powershell
   docker system prune -a --volumes
   ```

2. Kiểm tra dung lượng:
   ```powershell
   docker system df
   ```

### 5. Build image thất bại

**Lỗi:** Build process bị fail ở một bước nào đó.

**Giải pháp:**
1. Xem logs chi tiết:
   ```powershell
   docker-compose build --no-cache --progress=plain
   ```

2. Build từng service riêng để tìm lỗi:
   ```powershell
   docker-compose build backend
   docker-compose build embedding
   docker-compose build frontend
   ```

### 6. Container không start được

**Lỗi:** Container exit ngay sau khi start.

**Giải pháp:**
1. Xem logs:
   ```powershell
   docker-compose logs [service-name]
   # Ví dụ:
   docker-compose logs backend
   docker-compose logs embedding
   ```

2. Chạy container với interactive mode để debug:
   ```powershell
   docker-compose run --rm backend sh
   ```

### 7. Database connection failed

**Lỗi:** Backend không kết nối được database.

**Giải pháp:**
1. Kiểm tra database đã sẵn sàng:
   ```powershell
   docker-compose exec postgres pg_isready -U postgres
   ```

2. Kiểm tra DATABASE_URL:
   ```powershell
   docker-compose exec backend env | findstr DATABASE_URL
   ```

3. Test connection thủ công:
   ```powershell
   docker-compose exec backend npm run db:test
   ```

### 8. Embedding server chậm khởi động

**Triệu chứng:** Embedding service mất nhiều thời gian để healthy.

**Giải pháp:**
- Bình thường! Embedding server cần tải model lần đầu (có thể mất 2-5 phút)
- Kiểm tra logs:
  ```powershell
  docker-compose logs -f embedding
  ```
- Đợi thấy message: `[OK] Model loaded: ...`

### 9. Frontend không load được

**Triệu chứng:** Frontend không hiển thị hoặc lỗi connection.

**Giải pháp:**
1. Kiểm tra frontend đã build xong:
   ```powershell
   docker-compose logs frontend
   ```

2. Kiểm tra VITE_API_BASE_URL:
   - Trong browser, mở DevTools > Console
   - Kiểm tra có lỗi CORS không
   - Kiểm tra network requests

3. Kiểm tra backend đã sẵn sàng:
   ```powershell
   curl http://localhost:3001/health
   ```

### 10. Permission denied (Linux/Mac)

**Lỗi:** Permission denied khi chạy docker commands.

**Giải pháp:**
```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER
# Logout và login lại
```

## 🔍 Debug Commands

### Kiểm tra trạng thái
```powershell
# Xem tất cả containers
docker-compose ps

# Xem logs tất cả services
docker-compose logs

# Xem logs một service cụ thể
docker-compose logs -f [service-name]

# Xem resource usage
docker stats
```

### Vào trong container
```powershell
# Backend
docker-compose exec backend sh

# Database
docker-compose exec postgres psql -U postgres -d writing_advanced

# Embedding
docker-compose exec embedding python
```

### Cleanup
```powershell
# Dừng và xóa containers
docker-compose down

# Dừng, xóa containers và volumes
docker-compose down -v

# Xóa images
docker-compose down --rmi all

# Dọn dẹp toàn bộ
docker system prune -a --volumes
```

## 📞 Cần giúp đỡ?

Nếu vẫn gặp vấn đề:
1. Kiểm tra Docker Desktop đã chạy
2. Xem logs chi tiết: `docker-compose logs`
3. Kiểm tra system requirements
4. Thử restart Docker Desktop


