# Hướng Dẫn Lấy Thông Tin DATABASE_URL

## 📋 Các Thông Tin Cần Thiết

DATABASE_URL có format:
```
postgresql://username:password@host:port/database
```

### 1. **username** (Tên người dùng PostgreSQL)

**Mặc định:** `postgres`

Đây là superuser được tạo khi cài PostgreSQL. Nếu bạn chưa tạo user khác, dùng `postgres`.

**Cách kiểm tra:**
- Mở pgAdmin → Servers → PostgreSQL → Login/Group Roles
- Hoặc chạy psql: `psql -U postgres` (nếu thành công → username là `postgres`)

---

### 2. **password** (Mật khẩu PostgreSQL)

**Đây là password bạn đã đặt khi cài PostgreSQL.**

Nếu bạn quên password:
- Xem lại lúc cài PostgreSQL (thường có ghi chú)
- Hoặc reset password (xem phần Troubleshooting bên dưới)

**Lưu ý:** Nếu password có ký tự đặc biệt, cần URL encode:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- ` ` (space) → `%20`

**Ví dụ:** Password là `my@pass#123` → `my%40pass%23123`

---

### 3. **host** (Địa chỉ server)

**Nếu chạy local:** `localhost` hoặc `127.0.0.1`

**Nếu dùng Docker:** `localhost` (port mapping)

**Nếu remote server:** IP hoặc domain của server

---

### 4. **port** (Cổng PostgreSQL)

**Mặc định:** `5432`

**Cách kiểm tra:**
- Mở pgAdmin → Servers → PostgreSQL → Properties → Connection tab
- Hoặc check trong Services (Windows): PostgreSQL service thường dùng port 5432

**Nếu đổi port:** Xem trong file `postgresql.conf` (thường ở `C:\Program Files\PostgreSQL\15\data\postgresql.conf`)

---

### 5. **database** (Tên database)

**Theo documentation:** `bot_writing_advanced`

**Cách kiểm tra database đã tạo chưa:**

**Option 1: Dùng psql**
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres -l
```
Sẽ hiển thị danh sách databases. Tìm `bot_writing_advanced`.

**Option 2: Dùng pgAdmin**
- Mở pgAdmin → Servers → PostgreSQL → Databases
- Xem danh sách databases

**Nếu chưa có database `bot_writing_advanced`, tạo mới:**

**Dùng psql:**
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres
```
Sau đó chạy:
```sql
CREATE DATABASE bot_writing_advanced;
\q
```

**Dùng pgAdmin:**
- Right-click **Databases** → **Create** → **Database**
- Name: `bot_writing_advanced`
- Click **Save**

---

## 📝 Ví Dụ DATABASE_URL

### Ví dụ 1: Setup cơ bản (password đơn giản)
```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/bot_writing_advanced
```

### Ví dụ 2: Password có ký tự đặc biệt
Nếu password là: `my@pass#123`
```env
DATABASE_URL=postgresql://postgres:my%40pass%23123@localhost:5432/bot_writing_advanced
```

### Ví dụ 3: Port khác (ví dụ 5433)
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5433/bot_writing_advanced
```

### Ví dụ 4: Remote server
```env
DATABASE_URL=postgresql://postgres:mypassword@192.168.1.100:5432/bot_writing_advanced
```

---

## 🔍 Cách Kiểm Tra Thông Tin Từ pgAdmin

1. **Mở pgAdmin**
2. **Connect to server** (nếu chưa connect)
3. **Right-click server** → **Properties**
4. **Tab "Connection":**
   - **Host name/address:** → `host`
   - **Port:** → `port`
   - **Maintenance database:** → thường là `postgres`
   - **Username:** → `username`
   - **Password:** → `password` (bạn cần nhớ)

5. **Tab "Databases":**
   - Xem danh sách databases → tìm `bot_writing_advanced`

---

## 🔍 Cách Kiểm Tra Từ Command Line

### Kiểm tra PostgreSQL đang chạy:
```cmd
sc query postgresql-x64-15
```
(Nếu thấy `STATE: RUNNING` → PostgreSQL đang chạy)

### Kiểm tra port:
```cmd
netstat -ano | findstr :5432
```
(Nếu thấy → port 5432 đang được dùng)

### Test connection:
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres -h localhost -p 5432 -d postgres
```
(Nếu kết nối thành công → thông tin đúng)

---

## 🐛 Troubleshooting

### Quên Password PostgreSQL

**Cách 1: Reset qua pgAdmin**
1. Mở pgAdmin
2. Nếu đã lưu password → xem trong saved connections
3. Hoặc thử các password thường dùng

**Cách 2: Reset password (cần quyền admin)**
1. Tạm thời set `trust` trong `pg_hba.conf`:
   - File: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
   - Tìm dòng: `host all all 127.0.0.1/32 md5`
   - Đổi thành: `host all all 127.0.0.1/32 trust`
2. Restart PostgreSQL service
3. Connect không cần password:
   ```cmd
psql -U postgres
   ```
4. Đổi password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```
5. Đổi lại `trust` → `md5` trong `pg_hba.conf`
6. Restart service

### Database chưa tồn tại

Tạo database:
```sql
CREATE DATABASE bot_writing_advanced;
```

### PostgreSQL service chưa chạy

**Start service:**
```cmd
net start postgresql-x64-15
```
(Thay `15` bằng version của bạn)

---

## ✅ Checklist

Trước khi điền DATABASE_URL, đảm bảo:

- [ ] PostgreSQL đã cài đặt
- [ ] PostgreSQL service đang chạy
- [ ] Biết username (thường là `postgres`)
- [ ] Biết password (password khi cài PostgreSQL)
- [ ] Biết host (thường là `localhost`)
- [ ] Biết port (thường là `5432`)
- [ ] Database `bot_writing_advanced` đã được tạo
- [ ] Đã test connection thành công

---

## 📝 Tạo File .env

1. **Tạo file `.env`** trong thư mục root của project (cùng cấp với `package.json`)

2. **Thêm DATABASE_URL:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bot_writing_advanced
```

3. **Thay `YOUR_PASSWORD`** bằng password thực tế của bạn

4. **Lưu file**

5. **Test connection:**
```bash
npm run db:check
```

Nếu thấy "Schema Status" → connection thành công!

---

## 🚀 Quick Start

Nếu bạn đã setup PostgreSQL theo `SETUP_POSTGRESQL_WINDOWS.md`:

1. **Username:** `postgres`
2. **Password:** (password bạn đã set khi cài)
3. **Host:** `localhost`
4. **Port:** `5432`
5. **Database:** `bot_writing_advanced`

**DATABASE_URL:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/bot_writing_advanced
```

Thay `YOUR_PASSWORD_HERE` bằng password của bạn!


