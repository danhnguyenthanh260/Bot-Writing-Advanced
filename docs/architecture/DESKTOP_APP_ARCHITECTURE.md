# 🖥️ Desktop App Architecture - Local-Only Application

**Mục tiêu:** Ứng dụng desktop chạy hoàn toàn local trên máy, giống một app desktop thông thường (không cần browser, không cần server riêng).

---

## 🎯 Kiến Trúc Desktop App

### Option 1: Electron (Recommended - Dễ nhất)

```
┌─────────────────────────────────────────┐
│         Electron App Window             │
│  ────────────────────────────────────  │
│  Frontend: React (đã có sẵn)            │
│  ────────────────────────────────────  │
│  Backend: Node.js (embedded)           │
│  ├─ Express server (localhost)          │
│  ├─ PostgreSQL (embedded hoặc local)   │
│  └─ Embedding service (local)          │
└─────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Dùng lại code React hiện tại
- ✅ Backend Node.js đã có sẵn
- ✅ Dễ package thành .exe/.app/.deb
- ✅ Cross-platform (Windows/Mac/Linux)

**Nhược điểm:**
- ⚠️ App size lớn (~100-200MB)
- ⚠️ Memory usage cao hơn

### Option 2: Tauri (Nhẹ hơn, Rust-based)

```
┌─────────────────────────────────────────┐
│         Tauri App Window                │
│  ────────────────────────────────────  │
│  Frontend: React (WebView)              │
│  ────────────────────────────────────  │
│  Backend: Rust + Node.js (embedded)     │
│  ├─ SQLite + vector extension          │
│  └─ Embedding service (local)          │
└─────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ App size nhỏ (~5-10MB)
- ✅ Memory usage thấp
- ✅ Security tốt hơn

**Nhược điểm:**
- ⚠️ Cần setup Rust
- ⚠️ Migration code phức tạp hơn

### Option 3: Native Desktop (Electron-like nhưng native)

**Windows:** .NET WPF / WinUI 3  
**Mac:** SwiftUI / AppKit  
**Linux:** GTK / Qt

**Không recommend** vì phải viết lại toàn bộ code.

---

## 🏗️ Kiến Trúc Chi Tiết (Electron - Recommended)

### Cấu Trúc Thư Mục

```
Bot-Writing-Advanced/
├── src/                          # Source code (giữ nguyên)
│   ├── components/
│   ├── services/
│   └── ...
├── server/                       # Backend (giữ nguyên)
│   ├── index.ts
│   ├── db/
│   └── services/
├── electron/                     # Electron-specific
│   ├── main.ts                  # Main process
│   ├── preload.ts               # Preload script
│   └── package.json
├── local_embedding_server.py    # Python embedding service
├── package.json                 # Root package.json
└── electron-builder.json        # Build config
```

### Main Process (Electron)

**File:** `electron/main.ts`

```typescript
import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendProcess: any = null;
let embeddingProcess: any = null;

// Start backend server
function startBackendServer() {
  const backendPath = path.join(__dirname, '../server/index.ts');
  backendProcess = spawn('node', [
    '--loader', 'ts-node/esm',
    backendPath
  ], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: '3001',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/bot_writing_advanced',
      EMBEDDING_PROVIDER: 'local',
      LOCAL_EMBEDDING_API_URL: 'http://localhost:8000',
    }
  });

  backendProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Backend: ${data.toString()}`);
  });

  backendProcess.stderr.on('data', (data: Buffer) => {
    console.error(`Backend Error: ${data.toString()}`);
  });
}

// Start embedding service
function startEmbeddingService() {
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  const embeddingPath = path.join(__dirname, '../local_embedding_server.py');
  
  embeddingProcess = spawn(pythonPath, [embeddingPath], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: '8000',
    }
  });

  embeddingProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Embedding: ${data.toString()}`);
  });

  embeddingProcess.stderr.on('data', (data: Buffer) => {
    console.error(`Embedding Error: ${data.toString()}`);
  });
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'), // Optional
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Start services
  startEmbeddingService();
  setTimeout(() => {
    startBackendServer();
  }, 2000); // Wait for embedding service to start

  // Create window after services are ready
  setTimeout(() => {
    createWindow();
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill processes
  if (backendProcess) {
    backendProcess.kill();
  }
  if (embeddingProcess) {
    embeddingProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup
  if (backendProcess) {
    backendProcess.kill();
  }
  if (embeddingProcess) {
    embeddingProcess.kill();
  }
});
```

### Preload Script

**File:** `electron/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // File operations (if needed)
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: string) => ipcRenderer.invoke('dialog:saveFile', data),
});
```

### Package.json Updates

**File:** `package.json` (root)

```json
{
  "name": "dei8-ai-writing-studio",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:pack": "electron-builder --dir"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  }
}
```

### Electron Builder Config

**File:** `electron-builder.json`

```json
{
  "appId": "com.dei8.writingstudio",
  "productName": "Dei8 AI Writing Studio",
  "directories": {
    "output": "dist-electron"
  },
  "files": [
    "dist/**/*",
    "server/**/*",
    "electron/**/*",
    "local_embedding_server.py",
    "package.json",
    "node_modules/**/*"
  ],
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "mac": {
    "target": "dmg",
    "icon": "assets/icon.icns"
  },
  "linux": {
    "target": "AppImage",
    "icon": "assets/icon.png"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

---

## 🗄️ Database Options cho Desktop App

### Option 1: Embedded PostgreSQL (Docker trong app)

**Pros:**
- ✅ Dùng lại code hiện tại
- ✅ pgvector support đầy đủ
- ✅ Không cần thay đổi schema

**Cons:**
- ⚠️ Cần Docker Desktop
- ⚠️ App size lớn hơn

**Implementation:**
```typescript
// Start PostgreSQL container when app starts
import { exec } from 'child_process';

function startPostgreSQL() {
  exec('docker run -d --name dei8-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 ankane/pgvector', (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to start PostgreSQL:', error);
    }
  });
}
```

### Option 2: SQLite + Vector Extension (Recommended cho Desktop)

**Pros:**
- ✅ Không cần Docker
- ✅ App size nhỏ hơn
- ✅ Embedded database

**Cons:**
- ⚠️ Cần migration code
- ⚠️ Vector extension cho SQLite phức tạp hơn

**Implementation:**
```typescript
// Use better-sqlite3 với vector extension
import Database from 'better-sqlite3';
import { loadExtension } from 'better-sqlite3-vector';

const db = new Database('writing-studio.db');
loadExtension(db, 'vector0'); // Load vector extension

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY,
    content TEXT,
    embedding BLOB  -- Store vector as BLOB
  );
`);
```

### Option 3: File-based Storage (Simplest)

**Pros:**
- ✅ Đơn giản nhất
- ✅ Không cần database

**Cons:**
- ⚠️ Không có vector search tốt
- ⚠️ Performance kém với dữ liệu lớn

**Không recommend** cho semantic search.

---

## 🚀 Setup & Build

### Development

```bash
# Install dependencies
npm install

# Install Electron
npm install -D electron electron-builder concurrently wait-on

# Run in development
npm run electron:dev
```

### Build Desktop App

```bash
# Build for current platform
npm run electron:build

# Output:
# Windows: dist-electron/Dei8 AI Writing Studio Setup.exe
# Mac: dist-electron/Dei8 AI Writing Studio.dmg
# Linux: dist-electron/Dei8 AI Writing Studio.AppImage
```

---

## 📦 Packaging Dependencies

### Python Embedding Service

**Option 1: Bundle Python với app**
- Dùng `pyinstaller` để package Python script
- Bundle vào Electron app

**Option 2: Require Python installed**
- App check Python có sẵn không
- Nếu không có → hiển thị hướng dẫn cài đặt

**Option 3: Node.js embedding (không cần Python)**
- Dùng `@xenova/transformers` (TensorFlow.js)
- Chạy embedding trực tiếp trong Node.js
- **Recommended** cho desktop app!

---

## 🔧 Node.js Embedding (Không Cần Python)

**File:** `server/services/nodeEmbeddingService.ts`

```typescript
import { pipeline } from '@xenova/transformers';

let embeddingModel: any = null;

async function loadModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embeddingModel;
}

export async function generateEmbeddingLocal(text: string): Promise<number[]> {
  const model = await loadModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```

**Package.json:**
```json
{
  "dependencies": {
    "@xenova/transformers": "^2.17.0"
  }
}
```

**Ưu điểm:**
- ✅ Không cần Python
- ✅ Chạy trực tiếp trong Node.js
- ✅ Dễ package với Electron

---

## 📋 Checklist Desktop App

### Setup
- [ ] Install Electron dependencies
- [ ] Create `electron/main.ts`
- [ ] Create `electron/preload.ts`
- [ ] Update `package.json` với Electron scripts
- [ ] Create `electron-builder.json`

### Database
- [ ] Chọn database option (SQLite hoặc embedded PostgreSQL)
- [ ] Update connection code
- [ ] Test database operations

### Embedding
- [ ] Chọn embedding option (Node.js hoặc Python)
- [ ] Implement embedding service
- [ ] Test embedding generation

### Build & Package
- [ ] Test development mode
- [ ] Build desktop app
- [ ] Test installed app
- [ ] Create installer

---

## 🎯 Recommended Stack cho Desktop App

| Component | Technology | Reason |
|-----------|-----------|--------|
| **Framework** | Electron | Dùng lại React code |
| **Database** | SQLite + vector | Embedded, không cần Docker |
| **Embedding** | @xenova/transformers | Node.js, không cần Python |
| **Backend** | Express (embedded) | Đã có sẵn |
| **Frontend** | React + Vite | Đã có sẵn |

---

## 🔗 Tài Liệu Liên Quan

- [FREE_FIRST_ARCHITECTURE.md](./FREE_FIRST_ARCHITECTURE.md) - Free-first architecture
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

---

**Status:** Ready to implement  
**Priority:** HIGH  
**Estimated Time:** 1-2 days

