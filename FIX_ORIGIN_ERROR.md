# Fix: "The given origin is not allowed for the given client ID"

## 🔴 Vấn Đề

Client ID được load thành công nhưng Google từ chối vì **origin chưa được authorize**.

## ✅ Giải Pháp

### Bước 1: Xác Định Origin Hiện Tại

Origin của bạn là URL trong browser **KHÔNG bao gồm** path sau `/`.

Ví dụ:
- `http://localhost:3000/` → Origin: `http://localhost:3000`
- `http://localhost:5173/app` → Origin: `http://localhost:5173`
- `https://yourdomain.com/page` → Origin: `https://yourdomain.com`

**Kiểm tra:**
1. Nhìn vào URL bar của browser
2. Lấy phần từ `http://` hoặc `https://` đến port number (nếu có)
3. **KHÔNG bao gồm** path, query params, hoặc trailing slash

### Bước 2: Thêm Origin Vào Google Cloud Console

1. **Vào Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Tìm OAuth 2.0 Client ID của bạn:**
   - Client ID: `223069794231-k9gkb0nlslu8svq9gvmau274kvhj6rqe`
   - Click vào để edit

3. **Thêm vào "Authorized JavaScript origins":**
   ```
   http://localhost:3000
   ```
   - ⚠️ **KHÔNG có trailing slash** (`/`)
   - ⚠️ **KHÔNG có path** nào sau port
   - ⚠️ **Phải match chính xác** với URL trong browser

4. **Nếu bạn dùng Vite default port (5173), thêm:**
   ```
   http://localhost:5173
   ```

5. **Thêm vào "Authorized redirect URIs"** (cũng cần):
   ```
   http://localhost:3000
   http://localhost:5173
   ```

6. **Click "SAVE"**

### Bước 3: Chờ vài giây

Google Cloud Console có thể mất **5-60 giây** để propagate changes.

### Bước 4: Test Lại

1. **Hard refresh browser:**
   - Chrome: `Ctrl + Shift + R`
   - Hoặc đóng và mở lại tab

2. **Test trong Incognito window:**
   - Để tránh cache issues

## 🔍 Kiểm Tra Origin Đang Dùng

Mở Browser Console và chạy:
```javascript
console.log('Current origin:', window.location.origin);
```

Kết quả sẽ là origin cần thêm vào Google Cloud Console.

## ⚠️ Common Mistakes

### ❌ SAI:
```
http://localhost:3000/          ← Có trailing slash
http://localhost:3000/app      ← Có path
localhost:3000                  ← Thiếu http://
https://localhost:3000          ← Dùng https thay vì http
```

### ✅ ĐÚNG:
```
http://localhost:3000           ← Chính xác
http://localhost:5173           ← Chính xác
```

## 📋 Quick Fix Checklist

- [ ] Xác định origin từ URL bar (http://localhost:XXXX)
- [ ] Vào Google Cloud Console → Credentials
- [ ] Edit OAuth 2.0 Client ID
- [ ] Thêm origin vào "Authorized JavaScript origins"
- [ ] Thêm origin vào "Authorized redirect URIs"
- [ ] Click SAVE
- [ ] Chờ 30-60 giây
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test lại

## 🔄 Nếu Vẫn Không Được

1. **Kiểm tra lại origin trong console:**
   ```javascript
   window.location.origin
   ```

2. **Kiểm tra trong Google Cloud Console:**
   - Xem lại list "Authorized JavaScript origins"
   - Đảm bảo không có typo, không có spaces thừa
   - Đảm bảo đúng format: `http://localhost:XXXX`

3. **Thử tạo Client ID mới:**
   - Nếu vẫn không được, có thể Client ID cũ có vấn đề
   - Tạo mới và copy Client ID mới vào `.env`
   - Restart dev server

4. **Clear browser cache:**
   - Ctrl + Shift + Delete → Clear cache
   - Hoặc test trong Incognito

## 🎯 Quick Command để Check Origin

Mở Browser Console (F12) và paste:
```javascript
console.log('Add this to Google Cloud Console:');
console.log('Authorized JavaScript origins:', window.location.origin);
console.log('Authorized redirect URIs:', window.location.origin);
```






