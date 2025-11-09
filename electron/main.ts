/**
 * Electron Main Process
 * 
 * Desktop app entry point - runs local server and embedding service
 */

import { app, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
let embeddingProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';

/**
 * Start backend Express server
 */
function startBackendServer() {
  console.log('🚀 Starting backend server...');
  
  const backendPath = path.join(__dirname, '../server/index.ts');
  const projectRoot = path.join(__dirname, '..');
  
  backendProcess = spawn('npx', [
    'ts-node',
    '--esm',
    backendPath
  ], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: '3001',
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bot_writing_advanced',
      EMBEDDING_PROVIDER: 'local',
      LOCAL_EMBEDDING_API_URL: 'http://localhost:8000',
      CORS_ORIGIN: 'http://localhost:5173',
    },
    shell: true,
  });

  backendProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

/**
 * Start local embedding service (Python)
 * Falls back to Node.js embedding if Python not available
 */
function startEmbeddingService() {
  console.log('🧠 Starting embedding service...');
  
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  const embeddingPath = path.join(__dirname, '../local_embedding_server.py');
  const projectRoot = path.join(__dirname, '..');

  // Try Python first
  embeddingProcess = spawn(pythonCommand, ['-u', embeddingPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: '8000',
    },
    shell: true,
  });

  embeddingProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Embedding] ${data.toString().trim()}`);
  });

  embeddingProcess.stderr?.on('data', (data: Buffer) => {
    const error = data.toString().trim();
    console.error(`[Embedding Error] ${error}`);
    
    // If Python not found, fallback to Node.js embedding
    if (error.includes('python') || error.includes('Python')) {
      console.log('⚠️ Python not found, will use Node.js embedding instead');
      embeddingProcess = null;
    }
  });

  embeddingProcess.on('close', (code) => {
    console.log(`Embedding process exited with code ${code}`);
  });
}

/**
 * Create main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'Dei8 AI Writing Studio',
    show: false, // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Focus window
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load app
  if (isDev) {
    // Development: Connect to Vite dev server
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Cleanup processes
 */
function cleanup() {
  console.log('🧹 Cleaning up processes...');
  
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (embeddingProcess) {
    embeddingProcess.kill();
    embeddingProcess = null;
  }
}

// App lifecycle
app.whenReady().then(() => {
  console.log('✅ Electron app ready');
  
  // Start services
  startEmbeddingService();
  
  // Wait a bit for embedding service to start, then start backend
  setTimeout(() => {
    startBackendServer();
  }, 2000);
  
  // Wait for backend to be ready, then create window
  setTimeout(() => {
    createWindow();
  }, 4000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanup();
});

app.on('will-quit', () => {
  cleanup();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

