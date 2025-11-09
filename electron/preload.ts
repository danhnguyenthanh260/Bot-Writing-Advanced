/**
 * Electron Preload Script
 * 
 * Exposes safe APIs to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process
// to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // File operations (if needed)
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: string, filename?: string) => 
    ipcRenderer.invoke('dialog:saveFile', data, filename),
  
  // App events
  onAppReady: (callback: () => void) => {
    ipcRenderer.on('app:ready', callback);
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      getPlatform: () => string;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      openFile: () => Promise<string | null>;
      saveFile: (data: string, filename?: string) => Promise<boolean>;
      onAppReady: (callback: () => void) => void;
    };
  }
}

