# 🚀 Quick Start: Local Embedding Setup

Hướng dẫn nhanh để khởi động tất cả services với Local Embedding.

---

## ⚡ Quick Start (Windows)

### **Option 1: PowerShell Script (Recommended)**

```powershell
.\start_all.ps1
```

### **Option 2: Batch Script**

```cmd
start_all.bat
```

### **Option 3: Manual (3 Terminals)**

**Terminal 1: Local Embedding Server**
```bash
npm run embedding:start
```

**Terminal 2: Backend Server**
```bash
npm run server
```

**Terminal 3: Frontend**
```bash
npm run dev
```

---

## 📋 Prerequisites

### **1. Python 3.8+**

```bash
# Check Python version
python --version

# Install Python dependencies
pip install sentence-transformers fastapi uvicorn
```

### **2. Node.js 18+**

```bash
# Check Node.js version
node --version

# Install Node.js dependencies
npm install
```

### **3. PostgreSQL 15+ with pgvector**

```bash
# Check PostgreSQL
psql --version

# Create database
psql -U postgres -c "CREATE DATABASE bot_writing_advanced;"
psql -U postgres -d bot_writing_advanced -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## 🔧 Configuration

### **1. Backend `.env`**

```env
# Embedding Provider - Local (Free)
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_API_URL=http://localhost:8000
LOCAL_EMBEDDING_MODEL=all-MiniLM-L6-v2
LOCAL_EMBEDDING_DIMENSIONS=384

# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bot_writing_advanced

# Google Docs API
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini API
API_KEY=your_gemini_api_key
```

### **2. Frontend `.env.local`**

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=your_gemini_api_key
```

---

## ✅ Verify Setup

### **1. Check Local Embedding Server**

```bash
# Health check
curl http://localhost:8000/

# Expected:
# {"status":"ok","model":"all-MiniLM-L6-v2","dimensions":384,"service":"local-embedding-server"}
```

### **2. Check Backend Server**

```bash
# Health check
curl http://localhost:3001/health

# Expected:
# {"status":"ok"}
```

### **3. Check Frontend**

Mở browser: `http://localhost:5173`

---

## 🐛 Troubleshooting

### **Lỗi: 'concurrently' is not recognized**

```bash
# Install dependencies
npm install
```

### **Lỗi: Python module not found**

```bash
# Install Python dependencies
pip install sentence-transformers fastapi uvicorn
```

### **Lỗi: Port already in use**

```bash
# Find process using port
# Windows:
netstat -ano | findstr :8000
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill process or change port in .env
```

### **Lỗi: Database connection failed**

```bash
# Check PostgreSQL is running
# Windows:
sc query postgresql-x64-15

# Test connection
npm run db:test
```

---

## 📚 Documentation

- **[LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)** - Complete guide
- **[QUICK_START.md](./QUICK_START.md)** - Full setup guide
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Testing checklist

---

**Status:** ✅ Ready to use  
**Next:** Test full flow (Import → Process → Chat)


