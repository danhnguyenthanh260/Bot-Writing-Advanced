# 🚀 Start Services - Quick Guide

Hướng dẫn nhanh để khởi động tất cả services.

---

## ⚡ Quick Start

### **Option 1: Start All Services (Recommended)**

**PowerShell:**
```powershell
.\start_all.ps1
```

**Batch (CMD):**
```cmd
start_all.bat
```

**npm:**
```bash
npm run dev:all
```

---

## 📋 Manual Start (3 Terminals)

### **Terminal 1: Local Embedding Server**

```bash
npm run embedding:start
# hoặc
python local_embedding_server.py
```

**Expected output:**
```
Loading embedding model: all-MiniLM-L6-v2...
✅ Model loaded: all-MiniLM-L6-v2 (384 dimensions)
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### **Terminal 2: Backend Server**

```bash
npm run server
```

**Expected output:**
```
Schema already deployed
Server started on port 3001
```

### **Terminal 3: Frontend**

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## ✅ Verify Services

### **1. Local Embedding Server**

```bash
# Health check
curl http://localhost:8000/

# Expected:
# {"status":"ok","model":"all-MiniLM-L6-v2","dimensions":384,"service":"local-embedding-server"}
```

### **2. Backend Server**

```bash
# Health check
curl http://localhost:3001/health

# Expected:
# {"status":"ok"}
```

### **3. Frontend**

Mở browser: `http://localhost:5173`

---

## 🔧 Prerequisites

### **1. Python Dependencies**

```bash
# Install Python dependencies
python -m pip install sentence-transformers fastapi uvicorn

# Hoặc dùng npm script:
npm run embedding:install
```

### **2. Node.js Dependencies**

```bash
# Install Node.js dependencies
npm install
```

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
python -m pip install sentence-transformers fastapi uvicorn
# hoặc
npm run embedding:install
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

---

## 📚 Documentation

- **[LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)** - Complete guide
- **[QUICK_START.md](./QUICK_START.md)** - Full setup guide
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Testing checklist

---

**Status:** ✅ Ready to use


