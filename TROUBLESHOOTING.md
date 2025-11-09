# Troubleshooting Google Sign-In 403 Error

## Vấn Đề: "Client ID is not found" (403) dù đã có trong .env

### Bước 1: Kiểm Tra .env File

1. **Vị trí file .env:**
   - Phải ở thư mục **root** của project (cùng cấp với `package.json`)
   - Không phải trong `src/` hay `components/`

2. **Format đúng:**
   ```bash
   VITE_GOOGLE_CLIENT_ID=223069794231-xxxxx.apps.googleusercontent.com
   ```
   - ✅ Có prefix `VITE_`
   - ✅ Không có dấu ngoặc kép
   - ✅ Không có khoảng trắng trước/sau `=`
   - ✅ Không có trailing spaces

3. **Kiểm tra file:**
   ```bash
   # Windows PowerShell
   Get-Content .env | Select-String "VITE_GOOGLE"
   
   # Linux/Mac
   cat .env | grep VITE_GOOGLE
   ```

### Bước 2: Restart Dev Server

**QUAN TRỌNG:** Vite chỉ load `.env` khi **khởi động**. Nếu bạn thêm `.env` sau khi server đã chạy, phải restart!

```bash
# Stop server (Ctrl + C)
# Sau đó chạy lại:
npm run dev
```

### Bước 3: Kiểm Tra Browser Console

Mở Developer Tools (F12) → Console tab. Bạn sẽ thấy log:
```javascript
[GoogleSignIn] Environment check: {
  hasClientId: true/false,
  clientIdLength: number,
  ...
}
```

- Nếu `hasClientId: false` → Vite chưa load env variable
- Nếu `hasClientId: true` nhưng vẫn lỗi 403 → Xem Bước 4

### Bước 4: Kiểm Tra Google Cloud Console

Lỗi 403 "Client ID is not found" có thể do:

#### 4.1. Client ID Chưa Được Authorize

1. Vào: https://console.cloud.google.com/apis/credentials
2. Click vào OAuth 2.0 Client ID của bạn
3. Kiểm tra **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:5173
   ```
   (Phải match chính xác với URL bạn đang dùng)

4. Kiểm tra **Authorized redirect URIs:**
   ```
   http://localhost:3000
   http://localhost:5173
   ```

#### 4.2. OAuth Consent Screen Chưa Cấu Hình

1. Vào: **APIs & Services → OAuth consent screen**
2. Đảm bảo đã hoàn tất các bước:
   - User Type đã chọn
   - App name đã điền
   - User support email đã điền
   - Developer contact đã điền
   - **Publish app** (nếu dùng External user type)

#### 4.3. Google Sign-In API Chưa Enable

1. Vào: **APIs & Services → Library**
2. Tìm "Google Sign-In API" hoặc "Identity Toolkit API"
3. Click **Enable** nếu chưa enable

### Bước 5: Kiểm Tra Network Tab

1. Mở Developer Tools → **Network** tab
2. Filter: `gsi/client` hoặc `googleapis.com`
3. Click vào request failed
4. Xem **Response** tab để biết chi tiết lỗi

### Bước 6: Common Issues & Solutions

#### Issue 1: Vite không load .env
**Solution:**
- Đảm bảo file tên chính xác là `.env` (không phải `.env.local` hay `.env.production`)
- Restart dev server
- Kiểm tra không có syntax error trong .env

#### Issue 2: Client ID format sai
**Solution:**
```bash
# ❌ SAI
VITE_GOOGLE_CLIENT_ID="223069794231-xxxxx.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID = 223069794231-xxxxx.apps.googleusercontent.com

# ✅ ĐÚNG
VITE_GOOGLE_CLIENT_ID=223069794231-xxxxx.apps.googleusercontent.com
```

#### Issue 3: Origin không match
**Solution:**
- Kiểm tra URL trong browser: `http://localhost:3000` hay `http://localhost:5173`?
- Đảm bảo Google Cloud Console có **chính xác** origin đó (bao gồm `http://` và port)

#### Issue 4: Client ID bị thay đổi/xóa
**Solution:**
- Kiểm tra lại Client ID trong Google Cloud Console
- Copy lại vào .env
- Restart server

### Bước 7: Test với Hard Refresh

1. **Clear browser cache:**
   - Chrome: Ctrl + Shift + Delete
   - Hoặc Hard Reload: Ctrl + Shift + R

2. **Test trong Incognito/Private window:**
   - Để loại bỏ extension conflicts

### Debug Script

Thêm vào component để debug:
```javascript
console.log('All VITE_ env vars:', 
  Object.keys(import.meta.env)
    .filter(k => k.startsWith('VITE_'))
    .reduce((obj, key) => {
      obj[key] = import.meta.env[key];
      return obj;
    }, {})
);
```

## Quick Checklist

- [ ] .env file ở root directory
- [ ] VITE_GOOGLE_CLIENT_ID format đúng (không có quotes, không có spaces)
- [ ] Dev server đã restart sau khi thêm .env
- [ ] Browser console log shows `hasClientId: true`
- [ ] Google Cloud Console có authorized origins đúng
- [ ] OAuth consent screen đã cấu hình
- [ ] Google Sign-In API đã enable
- [ ] Network tab không có CORS errors
- [ ] Đã test trong Incognito window

## Vẫn Không Được?

1. **Copy Client ID mới:**
   - Tạo OAuth Client ID mới trong Google Cloud Console
   - Copy Client ID mới vào .env
   - Restart server

2. **Kiểm tra file .env có bị gitignore không:**
   ```bash
   # Nếu .env không tồn tại, tạo lại:
   echo VITE_GOOGLE_CLIENT_ID=your-client-id > .env
   ```

3. **Test với hardcoded value tạm thời:**
   ```typescript
   // Trong GoogleSignInButton.tsx (chỉ để test)
   const clientId = "223069794231-k9gkb0nlslu8svq9gvmau274kvhj6rqe.apps.googleusercontent.com";
   ```
   Nếu hardcoded work nhưng .env không → Vite env issue
   Nếu cả hai đều không → Google Cloud Console issue






