# Sửa lỗi: Đăng nhập Google và Persistence

## Vấn đề 1: Đăng nhập Google không lưu user vào database

### Nguyên nhân
- Client gọi `/api/auth/login` nhưng server không có route handler
- User được tạo ở client-side (mock) nhưng không được lưu vào PostgreSQL

### Giải pháp đã triển khai

#### 1. Tạo Auth Routes (`server/routes/authRoutes.ts`)
- **POST `/api/auth/login`**: Verify Google JWT token và lưu user vào database
  - Sử dụng `google-auth-library` để verify token
  - Tạo hoặc cập nhật user trong bảng `users` với `ON CONFLICT`
  - Trả về session token và user data

- **GET `/api/auth/session`**: Lấy thông tin session hiện tại
  - Verify session token
  - Trả về user data từ database

- **POST `/api/auth/logout`**: Đăng xuất (acknowledge)

#### 2. Đăng ký routes vào server
- Thêm `authRouter` vào `server/index.ts`
- Route: `/api/auth/*`

#### 3. Cấu hình cần thiết
Đảm bảo có biến môi trường:
```env
GOOGLE_CLIENT_ID=your-google-client-id
# hoặc
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Cách sử dụng
1. User đăng nhập với Google Sign-In (client-side)
2. Client gửi JWT credential đến `/api/auth/login`
3. Server verify token và lưu user vào database
4. Server trả về session token
5. Client lưu session token để dùng cho các request sau

## Vấn đề 2: Dữ liệu Google Docs không persist sau khi restart

### Tình trạng hiện tại
✅ **Dữ liệu đã được persist vào PostgreSQL:**
- Books → bảng `books`
- Chapters (raw content) → bảng `recent_chapters`
- Book contexts → bảng `book_contexts` (sau khi processing)
- Chapter metadata & embeddings → bảng `recent_chapters` (sau khi processing)

❌ **Vấn đề:**
- Job queue là in-memory (`simpleQueue`)
- Khi server restart, các pending jobs bị mất
- Các chapters chưa được process (extraction, embedding) sẽ không được xử lý

### Giải pháp đã triển khai

#### 1. Job Recovery System (`server/jobs/jobRecovery.ts`)

**`recoverBookProcessingJobs()`**
- Tìm các books chưa có `book_contexts`
- Queue lại jobs để extract book context

**`recoverChapterProcessingJobs()`**
- Tìm các chapters chưa có `summary` hoặc `embedding_vector`
- Queue lại jobs để extract metadata và generate embeddings

**`recoverAllJobs()`**
- Chạy recovery cho cả books và chapters
- Được gọi tự động khi server khởi động

#### 2. Tích hợp vào Server Startup
- `server/index.ts` gọi `recoverAllJobs()` sau khi deploy schema
- Recovery không làm fail server startup (non-critical)
- Log recovery results để theo dõi

### Cách hoạt động

1. **Khi ingest Google Doc:**
   - Raw data (books, chapters) được lưu ngay vào PostgreSQL
   - Processing jobs được queue (in-memory)

2. **Khi server restart:**
   - Dữ liệu raw vẫn còn trong database
   - Job recovery system kiểm tra:
     - Books chưa có context → queue lại
     - Chapters chưa có metadata/embeddings → queue lại
   - Jobs được xử lý tự động

3. **Kết quả:**
   - Dữ liệu luôn được persist
   - Processing jobs được recover tự động
   - Không mất dữ liệu khi restart

## Kiểm tra

### 1. Kiểm tra user được lưu
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

### 2. Kiểm tra dữ liệu Google Docs
```sql
-- Books
SELECT book_id, title, total_chapters FROM books;

-- Chapters
SELECT chapter_id, book_id, chapter_number, title 
FROM recent_chapters 
ORDER BY book_id, chapter_number;

-- Book contexts
SELECT book_id, summary IS NOT NULL as has_context
FROM book_contexts;

-- Chapter processing status
SELECT 
  chapter_id,
  summary IS NOT NULL as has_summary,
  embedding_vector IS NOT NULL as has_embedding
FROM recent_chapters;
```

### 3. Kiểm tra job recovery logs
Xem logs khi server khởi động:
```
Job recovery: X books, Y chapters queued
```

Hoặc query data flow logs:
```sql
SELECT * FROM data_flow_logs 
WHERE stage = 'system' 
  AND message LIKE '%recovery%'
ORDER BY created_at DESC;
```

## Lưu ý

### Job Queue hiện tại (In-Memory)
- ✅ Đơn giản, không cần Redis
- ❌ Mất jobs khi restart (đã có recovery)
- 💡 **Khuyến nghị production:** Sử dụng Bull/BullMQ + Redis để persist jobs

### Cải thiện tương lai
1. **Persistent Job Queue:**
   - Sử dụng BullMQ + Redis
   - Jobs được lưu trong Redis
   - Tự động recover khi worker restart

2. **Job Status Tracking:**
   - Lưu job status vào database
   - Theo dõi progress chi tiết
   - Retry logic tốt hơn

3. **User Sessions:**
   - Sử dụng JWT tokens thay vì simple session tokens
   - Refresh token mechanism
   - Session management tốt hơn

## Tóm tắt

✅ **Đã sửa:**
- Đăng nhập Google lưu user vào database
- Dữ liệu Google Docs được persist
- Job recovery tự động khi server restart

✅ **Hoạt động:**
- User đăng nhập → lưu vào `users` table
- Google Docs ingest → lưu vào `books` và `recent_chapters`
- Server restart → tự động recover pending jobs
- Dữ liệu luôn tồn tại trong PostgreSQL

