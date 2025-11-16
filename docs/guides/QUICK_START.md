# 🚀 Hướng Dẫn Khởi Động Dự Án - Dei8 AI Writing Studio

**Cập nhật:** 2024  
**Thời gian setup:** ~30-45 phút

---

## 📋 Yêu Cầu Hệ Thống

- **Node.js:** 18+ (khuyến nghị 20+)
- **PostgreSQL:** 15+ với pgvector extension
- **npm** hoặc **yarn**
- **Google Cloud Project** (cho Google Docs API & Gemini API)

---

## 📍 Vị Trí Chạy Lệnh (QUAN TRỌNG!)

**TẤT CẢ các lệnh phải chạy từ thư mục gốc của project:**

```
D:\Coding_learning\Writing advanced\Bot-Writing-Advanced
```

**Cách kiểm tra bạn đang ở đúng thư mục:**
- Phải thấy file `package.json` trong thư mục hiện tại
- Phải thấy thư mục `server/` và `components/`
- Phải thấy file `index.tsx` và `App.tsx`

**Windows PowerShell/CMD:**
```cmd
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
dir package.json
```

**Nếu thấy `package.json` → Bạn đang ở đúng vị trí! ✅**

---

## 🎯 Bước 1: Cài Đặt Dependencies

### 1.1. Navigate vào project
```bash
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
```

### 1.2. Cài đặt npm packages
```bash
npm install
```

**Lưu ý:** Nếu gặp lỗi với một số packages, đảm bảo whitelist cho:
- `googleapis`
- `express`
- `@types/*` packages

---

## 🗄️ Bước 2: Setup PostgreSQL Database

### 2.1. Kiểm tra PostgreSQL đã cài chưa

**Windows:**
```cmd
sc query postgresql-x64-15
```
(Nếu thấy `STATE: RUNNING` → PostgreSQL đang chạy)

**Hoặc kiểm tra trong Services:**
- Windows + R → `services.msc`
- Tìm service `postgresql-x64-15` (hoặc version của bạn)

### 2.2. Nếu chưa cài PostgreSQL

Xem hướng dẫn chi tiết: [../setup/SETUP_POSTGRESQL_WINDOWS.md](../setup/SETUP_POSTGRESQL_WINDOWS.md)

**Tóm tắt:**
1. Download PostgreSQL 15+ từ https://www.postgresql.org/download/windows/
2. Cài đặt (ghi nhớ password cho user `postgres`)
3. Cài pgvector extension (xem [../setup/INSTALL_PGVECTOR_WINDOWS.md](../setup/INSTALL_PGVECTOR_WINDOWS.md))

### 2.3. Tạo Database

**Option 1: Dùng psql**
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres
```

Sau đó chạy:
```sql
CREATE DATABASE bot_writing_advanced;
\c bot_writing_advanced
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
\q
```

**Option 2: Dùng pgAdmin**
1. Mở pgAdmin
2. Right-click **Databases** → **Create** → **Database**
3. Name: `bot_writing_advanced`
4. Click **Save**
5. Right-click database → **Query Tool**
6. Chạy:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 2.4. Chạy Schema (Tự động hoặc thủ công)

**Tự động:** Server sẽ tự động tạo schema khi khởi động lần đầu.

**Thủ công (nếu cần):**
```bash
# Từ project root
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

---

## 🔐 Bước 3: Setup Environment Variables

### 3.1. Tạo file `.env` (Backend)

Tạo file `.env` trong thư mục root (cùng cấp với `package.json`):

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bot_writing_advanced
DATABASE_SSL=false

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Google Gemini API
API_KEY=your_gemini_api_key_here

# Google Docs API - Option 1: Service Account (Recommended)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Docs API - Option 2: OAuth (Alternative)
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-client-secret
# GOOGLE_REFRESH_TOKEN=your-refresh-token
# GOOGLE_REDIRECT_URI=http://localhost:3001/oauth2callback
```

**Lưu ý:**
- Thay `YOUR_PASSWORD` bằng password PostgreSQL của bạn
- Nếu password có ký tự đặc biệt, cần URL encode (xem [../setup/DATABASE_URL_GUIDE.md](../setup/DATABASE_URL_GUIDE.md))
- Chọn **một trong hai** authentication methods (Service Account hoặc OAuth)

### 3.2. Tạo file `.env.local` (Frontend)

Tạo file `.env.local` trong thư mục root:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3001

# Google Sign-In (Frontend)
VITE_GOOGLE_CLIENT_ID=your-google-signin-client-id.apps.googleusercontent.com

# Gemini API Key (Frontend)
VITE_API_KEY=your_gemini_api_key_here
```

---

## 🔑 Bước 4: Setup Google Cloud Credentials

### 4.1. Lấy Gemini API Key

1. Vào: https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy API key → paste vào `API_KEY` trong `.env` và `.env.local`

### 4.2. Setup Google Docs API

**Option A: Service Account (Recommended - Không cần user consent)**

1. Vào: https://console.cloud.google.com/
2. Chọn project (hoặc tạo mới)
3. **Enable APIs:**
   - Vào **APIs & Services → Library**
   - Enable: **Google Docs API**
4. **Tạo Service Account:**
   - Vào **APIs & Services → Credentials**
   - Click **+ CREATE CREDENTIALS → Service Account**
   - Đặt tên → **Create and Continue**
   - Skip role assignment → **Done**
5. **Tạo Key:**
   - Click vào service account vừa tạo
   - Tab **Keys** → **Add Key → Create new key**
   - Chọn **JSON** → Download
   - Mở file JSON, copy:
     - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (giữ nguyên `\n`)
6. **Share Google Docs:**
   - Mở Google Doc bạn muốn phân tích
   - Click **Share** → Thêm email service account (view access)

**Option B: OAuth Client (Cần user consent)**

Xem hướng dẫn chi tiết: [../setup/GOOGLE_SIGNIN_SETUP.md](../setup/GOOGLE_SIGNIN_SETUP.md)

### 4.3. Setup Google Sign-In (Frontend)

1. Vào: https://console.cloud.google.com/
2. **APIs & Services → Credentials**
3. **+ CREATE CREDENTIALS → OAuth client ID**
4. **Application type:** Web application
5. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:5173
   ```
7. Copy **Client ID** → paste vào `VITE_GOOGLE_CLIENT_ID` trong `.env.local`

---

## ✅ Bước 5: Kiểm Tra Setup

### 5.1. Test Database Connection

```bash
npm run db:test
```

**Kết quả mong đợi:**
```
Database connection successful!
```

**Nếu lỗi:**
- Kiểm tra PostgreSQL service đang chạy
- Kiểm tra `DATABASE_URL` trong `.env`
- Xem [../setup/DATABASE_URL_GUIDE.md](../setup/DATABASE_URL_GUIDE.md)

### 5.2. Check Schema

```bash
npm run db:check
```

**Kết quả mong đợi:**
```
Schema Status: ✅ Deployed
```

**Nếu chưa deploy:**
- Server sẽ tự động deploy khi khởi động
- Hoặc chạy thủ công: `psql -U postgres -d bot_writing_advanced -f server/db/schema.sql`

---

## 🚀 Bước 6: Khởi Động Dự Án

### ⚠️ QUAN TRỌNG: Tất cả lệnh chạy từ thư mục gốc!

**Đảm bảo bạn đang ở:**
```
D:\Coding_learning\Writing advanced\Bot-Writing-Advanced
```

### 6.1. Khởi động Backend Server

**Mở Terminal/PowerShell/CMD 1:**

1. Navigate vào thư mục project:
   ```cmd
   cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
   ```

2. Chạy lệnh:
   ```bash
   npm run server
   ```

**Kết quả mong đợi:**
```
Schema already deployed
Server started on port 3001
```

**Nếu lỗi:**
- Kiểm tra `.env` file
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra port 3001 không bị chiếm

### 6.2. Khởi động Frontend

**Mở Terminal/PowerShell/CMD 2 (terminal mới):**

1. Navigate vào thư mục project (GIỐNG như terminal 1):
   ```cmd
   cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
   ```

2. Chạy lệnh:
   ```bash
   npm run dev
   ```

**Lưu ý:** Cả 2 terminals phải ở cùng thư mục gốc của project!

**Kết quả mong đợi:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6.3. Mở Browser

Mở trình duyệt và truy cập:
```
http://localhost:5173
```

---

## 🎉 Bước 7: Sử Dụng Ứng Dụng

### 7.1. Đăng nhập (Optional)

- Click **Sign in with Google** ở header
- Chọn tài khoản Google
- Workspace sẽ được sync lên server

### 7.2. Phân tích Google Docs

1. Trong sidebar, tìm form **"Phân tích Google Docs"**
2. Dán URL Google Doc (ví dụ: `https://docs.google.com/document/d/...`)
3. Click **Phân tích**
4. Đợi xử lý (có thể mất vài giây)
5. Workspace sẽ tự động tạo với 3 pages:
   - **Bản Nháp** - Để viết
   - **Đánh giá** - Nhận feedback từ AI
   - **Hoàn chỉnh** - Bản final

### 7.3. Trò chuyện với AI

1. Click nút **Chat** ở góc dưới bên phải
2. Hoặc dùng input bar ở dưới cùng
3. Gõ câu hỏi hoặc yêu cầu
4. AI sẽ trả lời dựa trên context của document

---

## 🐛 Troubleshooting

### Lỗi Database Connection

**Lỗi:** `Connection refused` hoặc `password authentication failed`

**Giải pháp:**
1. Kiểm tra PostgreSQL service đang chạy:
   ```cmd
   sc query postgresql-x64-15
   ```
2. Kiểm tra `DATABASE_URL` trong `.env`:
   - Format: `postgresql://username:password@host:port/database`
   - Password có ký tự đặc biệt → URL encode
3. Test connection:
   ```bash
   npm run db:test
   ```

### Lỗi Google Docs API

**Lỗi:** `403 Forbidden` hoặc `401 Unauthorized`

**Giải pháp:**
1. **Service Account:**
   - Kiểm tra service account email đúng
   - Kiểm tra private key format (có `\n`)
   - Đảm bảo đã share Google Doc với service account email
2. **OAuth:**
   - Kiểm tra refresh token còn valid
   - Regenerate refresh token nếu cần

### Lỗi Gemini API

**Lỗi:** `API key not found` hoặc `403`

**Giải pháp:**
1. Kiểm tra API key trong `.env` và `.env.local`
2. Đảm bảo API key đúng format
3. Kiểm tra quota/limits trong Google Cloud Console

### Lỗi Port Already in Use

**Lỗi:** `Port 3001 is already in use`

**Giải pháp:**
1. Tìm process đang dùng port:
   ```cmd
   netstat -ano | findstr :3001
   ```
2. Kill process hoặc đổi port trong `.env`:
   ```env
   PORT=3002
   ```
3. Update `VITE_API_BASE_URL` trong `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:3002
   ```

### Lỗi CORS

**Lỗi:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Giải pháp:**
1. Kiểm tra `CORS_ORIGIN` trong `.env`:
   ```env
   CORS_ORIGIN=http://localhost:5173
   ```
2. Restart backend server

---

## 📝 Checklist Khởi Động

Trước khi bắt đầu, đảm bảo:

- [ ] Node.js 18+ đã cài
- [ ] PostgreSQL 15+ đã cài và đang chạy
- [ ] pgvector extension đã cài
- [ ] Database `bot_writing_advanced` đã tạo
- [ ] File `.env` đã tạo với đầy đủ variables
- [ ] File `.env.local` đã tạo với đầy đủ variables
- [ ] Gemini API key đã có
- [ ] Google Docs API đã setup (Service Account hoặc OAuth)
- [ ] Google Sign-In Client ID đã có (nếu dùng sign-in)
- [ ] `npm install` đã chạy thành công
- [ ] Database connection test thành công (`npm run db:test`)
- [ ] Backend server khởi động thành công (`npm run server`)
- [ ] Frontend dev server khởi động thành công (`npm run dev`)
- [ ] Browser mở được `http://localhost:5173`

---

## 🔗 Tài Liệu Liên Quan

- [../INDEX.md](../INDEX.md) - Mục lục tài liệu
- [../../README.md](../../README.md) - Tài liệu chính
- [../PROJECT_STATUS.md](../PROJECT_STATUS.md) - Tình trạng dự án
- [../setup/DATABASE_URL_GUIDE.md](../setup/DATABASE_URL_GUIDE.md) - Hướng dẫn DATABASE_URL
- [../setup/SETUP_POSTGRESQL_WINDOWS.md](../setup/SETUP_POSTGRESQL_WINDOWS.md) - Setup PostgreSQL
- [../setup/INSTALL_PGVECTOR_WINDOWS.md](../setup/INSTALL_PGVECTOR_WINDOWS.md) - Setup pgvector
- [../setup/GOOGLE_SIGNIN_SETUP.md](../setup/GOOGLE_SIGNIN_SETUP.md) - Setup Google Sign-In
- [../troubleshooting/TROUBLESHOOTING.md](../troubleshooting/TROUBLESHOOTING.md) - Xử lý lỗi

---

## 💡 Tips

1. **Development:**
   - Dùng Service Account cho Google Docs API (dễ setup hơn)
   - Có thể bỏ qua Google Sign-In nếu chỉ test local
   - Dùng `npm run db:check` để verify schema

2. **Performance:**
   - Backend và Frontend nên chạy song song (2 terminals)
   - Nếu thay đổi `.env`, cần restart server

3. **Debugging:**
   - Check console logs của cả backend và frontend
   - Dùng `npm run db:test` để test database
   - Dùng `npm run db:check` để check schema

---

**Chúc bạn code vui vẻ! 🎉**

