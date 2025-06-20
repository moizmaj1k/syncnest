import { contextBridge, ipcRenderer } from 'electron';
console.log('[preload] preload.js loaded');

contextBridge.exposeInMainWorld('electron', {
  // returns the selected file path or null
  selectFile: (): Promise<string|null> =>
    ipcRenderer.invoke('dialog:selectFile'),

  // returns the SHA-256 hex digest
  computeHash: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('hash:compute', filePath),
});
