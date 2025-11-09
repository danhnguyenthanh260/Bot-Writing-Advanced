# Quick Commands - Windows

## 🚀 Quick Start Commands

### 1. Mở psql (PostgreSQL Command Line)

**Option 1: Từ Command Prompt**
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres
```

**Option 2: Từ bất kỳ đâu (nếu đã thêm vào PATH)**
```cmd
psql -U postgres -h localhost -p 5432
```

---

### 2. Tạo Database

**Từ psql:**
```sql
CREATE DATABASE bot_writing_advanced;
```

**Từ Command Prompt:**
```cmd
"C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres bot_writing_advanced
```

---

### 3. Kết Nối Vào Database

**Từ psql:**
```sql
\c bot_writing_advanced
```

**Từ Command Prompt:**
```cmd
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d bot_writing_advanced
```

---

### 4. Enable Extensions

**Chạy trong psql (sau khi `\c bot_writing_advanced`):**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

**Verify:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

### 5. Chạy Schema SQL

**Từ Command Prompt (trong project folder):**
```cmd
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

**Hoặc từ psql:**
```sql
\c bot_writing_advanced
\i server/db/schema.sql
```
*(Cần chạy từ thư mục project)*

---

### 6. Test Connection

**Từ code:**
```cmd
npm run server
```

**Verify tables đã tạo:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 📝 Common Commands

### List databases
```sql
\l
```

### List tables
```sql
\dt
```

### List extensions
```sql
\dx
```

### Describe table
```sql
\d table_name
```

### Exit psql
```sql
\q
```

---

## 🔍 Troubleshooting Commands

### Check PostgreSQL service
```cmd
sc query postgresql-x64-15
```

### Start PostgreSQL service
```cmd
net start postgresql-x64-15
```

### Stop PostgreSQL service
```cmd
net stop postgresql-x64-15
```

### Check port 5432
```cmd
netstat -ano | findstr :5432
```

---

## ✅ Full Setup Sequence

```cmd
# 1. Mở psql
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres

# 2. Trong psql, chạy:
CREATE DATABASE bot_writing_advanced;
\c bot_writing_advanced
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

# 3. Exit psql
\q

# 4. Chạy schema từ project folder
cd "D:\Coding_learning\Writing advanced\Bot-Writing-Advanced"
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d bot_writing_advanced -f server/db/schema.sql

# 5. Test connection
npm run server
```

---

**Note:** Thay `15` bằng version PostgreSQL của bạn nếu khác!






