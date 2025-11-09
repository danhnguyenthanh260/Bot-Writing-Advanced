# Kiểm Tra Origin Issues - Port 3000 Đã Có Nhưng Vẫn Lỗi

## 🔍 Các Nguyên Nhân Có Thể

### 1. Format Origin Không Đúng

Kiểm tra trong Google Cloud Console:

**❌ SAI:**
- `http://localhost:3000/` (có trailing slash)
- `http://localhost:3000 ` (có space cuối)
- ` http://localhost:3000` (có space đầu)
- `localhost:3000` (thiếu `http://`)
- `https://localhost:3000` (dùng https thay vì http)

**✅ ĐÚNG:**
- `http://localhost:3000` (chính xác, không có spaces, không có slash cuối)

### 2. Thiếu Redirect URIs

Kiểm tra cả 2 sections:

1. **Authorized JavaScript origins:** `http://localhost:3000` ✅
2. **Authorized redirect URIs:** `http://localhost:3000` ❓ (Có thể thiếu)

**LƯU Ý:** Google Sign-In có thể cần cả 2!

### 3. OAuth Consent Screen Chưa Publish

1. Vào: **APIs & Services → OAuth consent screen**
2. Kiểm tra trạng thái:
   - **Publishing status:** Phải là "In production" hoặc "Testing"
   - Nếu là "Testing", phải thêm **Test users**

### 4. Google Sign-In API Chưa Enable

1. Vào: **APIs & Services → Library**
2. Tìm và enable:
   - "Google Sign-In API"
   - Hoặc "Identity Toolkit API"

### 5. Client ID Khác

Có thể bạn đang dùng Client ID khác với Client ID trong Google Cloud Console?

Kiểm tra:
- Console log: `[GoogleSignIn] Initializing with Client ID: 223069794231...`
- Google Cloud Console: OAuth Client ID nào đang có origin `http://localhost:3000`?

### 6. Cần Thêm 127.0.0.1

Một số trường hợp cần thêm cả:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

## ✅ Checklist Kiểm Tra

- [ ] Origin format đúng: `http://localhost:3000` (không có trailing slash, không có spaces)
- [ ] Có trong "Authorized JavaScript origins"
- [ ] Có trong "Authorized redirect URIs" (cũng quan trọng!)
- [ ] OAuth consent screen đã publish hoặc có test users
- [ ] Google Sign-In API đã enable
- [ ] Client ID trong .env match với Client ID trong Console
- [ ] Đã chờ 30-60 giây sau khi save
- [ ] Đã hard refresh browser (Ctrl+Shift+R)
- [ ] Đã test trong Incognito window

## 🔧 Quick Fix: Thêm Cả Redirect URIs

Nếu bạn chỉ thêm JavaScript origins mà chưa thêm redirect URIs:

1. Edit OAuth Client ID
2. Thêm vào **Authorized redirect URIs:**
   ```
   http://localhost:3000
   ```
3. Save
4. Chờ 30 giây
5. Hard refresh

## 🔄 Thử Tạo Client ID Mới

Nếu tất cả đều đúng mà vẫn lỗi:

1. Tạo OAuth Client ID mới
2. Thêm ngay từ đầu:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
3. Copy Client ID mới vào .env
4. Restart dev server
5. Test lại






