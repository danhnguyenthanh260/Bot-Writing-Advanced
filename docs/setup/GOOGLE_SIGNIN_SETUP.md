# Hướng Dẫn Setup Google Sign-In

## Lỗi "Client ID is not found" (403)

Lỗi này xảy ra khi thiếu hoặc sai Google Client ID cho Google Sign-In.

## Bước 1: Tạo OAuth 2.0 Client ID cho Web Application

1. **Truy cập Google Cloud Console:**
   - Đi tới: https://console.cloud.google.com/
   - Chọn project của bạn (hoặc tạo mới)

2. **Enable Google Sign-In API:**
   - Vào **APIs & Services → Library**
   - Tìm "Google Sign-In API" hoặc "Identity Toolkit API"
   - Click **Enable** nếu chưa enable

3. **Tạo OAuth 2.0 Client ID:**
   - Vào **APIs & Services → Credentials**
   - Click **+ CREATE CREDENTIALS → OAuth client ID**
   - Nếu chưa có OAuth consent screen, bạn sẽ được yêu cầu cấu hình:
     - **User Type:** External (cho development) hoặc Internal (cho G Suite)
     - **App name:** Tên ứng dụng của bạn
     - **User support email:** Email của bạn
     - **Developer contact:** Email của bạn
     - Click **Save and Continue** qua các bước
   - **Application type:** Chọn **Web application**
   - **Name:** Đặt tên (ví dụ: "Writing Studio Web Client")

4. **Cấu hình Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:5173
   https://yourdomain.com (nếu deploy)
   ```

5. **Cấu hình Authorized redirect URIs:**
   ```
   http://localhost:3000
   http://localhost:5173
   https://yourdomain.com (nếu deploy)
   ```

6. **Lấy Client ID:**
   - Click **Create**
   - Copy **Client ID** (có dạng: `xxxxx-xxxxx.apps.googleusercontent.com`)
   - **LƯU Ý:** Không cần Client Secret cho Google Sign-In (chỉ cần cho backend OAuth)

## Bước 2: Cấu hình trong Project

1. **Tạo file `.env` trong thư mục gốc:**
   ```bash
   # .env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

2. **Đảm bảo file `.env` không bị commit:**
   - Kiểm tra `.gitignore` có chứa `.env`

3. **Restart development server:**
   ```bash
   npm run dev
   ```

## Kiểm tra

Sau khi cấu hình, Google Sign-In button sẽ:
- Hiển thị mà không có lỗi console
- Khi click, mở popup đăng nhập Google
- Sau khi đăng nhập, trả về credential JWT

## Troubleshooting

### Lỗi 403 "The given client ID is not found"
- ✅ Kiểm tra Client ID đúng format (có `.apps.googleusercontent.com`)
- ✅ Kiểm tra Client ID không có khoảng trắng
- ✅ Restart dev server sau khi thêm `.env`
- ✅ Kiểm tra `VITE_GOOGLE_CLIENT_ID` trong `.env` (có `VITE_` prefix)

### Lỗi "redirect_uri_mismatch"
- ✅ Thêm đúng origin vào "Authorized JavaScript origins"
- ✅ Thêm đúng URI vào "Authorized redirect URIs"
- ✅ Đảm bảo không có trailing slash thừa

### Google Sign-In không hiển thị
- ✅ Kiểm tra console browser có lỗi
- ✅ Kiểm tra network tab xem script Google có load không
- ✅ Kiểm tra `VITE_GOOGLE_CLIENT_ID` có giá trị

## Phân Biệt: Frontend vs Backend Client ID

### Frontend (Google Sign-In)
- **Variable:** `VITE_GOOGLE_CLIENT_ID`
- **Mục đích:** Đăng nhập user trên frontend
- **Loại:** Web application
- **Không cần:** Client Secret

### Backend (Google Docs API)
- **Variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- **Mục đích:** Truy cập Google Docs API từ server
- **Loại:** Web application hoặc Desktop application
- **Cần:** Client Secret và Refresh Token

**Bạn có thể dùng cùng một Client ID cho cả hai, hoặc tạo riêng.**

## Security Notes

- ⚠️ **KHÔNG commit** file `.env` vào git
- ⚠️ Client ID có thể public (trong frontend code) - đây là bình thường
- ⚠️ Client Secret chỉ dùng cho backend - **KHÔNG bao giờ** đặt trong frontend
- ✅ Sử dụng Authorized origins để giới hạn domain có thể dùng Client ID















