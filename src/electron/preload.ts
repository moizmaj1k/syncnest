import { contextBridge, ipcRenderer } from 'electron';

type FileURLFn = (filePath: string) => string;

// Try to pull in Node’s `pathToFileURL`; if that fails, fall back to a manual shim
let toFileURL: FileURLFn;
try {
  // In a CJS preload this will resolve to the real URL module
  // If you’re bundling with webpack, this may throw, so we catch
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const urlMod = require('url');
  if (typeof urlMod.pathToFileURL === 'function') {
    toFileURL = (fp: string) => urlMod.pathToFileURL(fp).href;
  } else {
    throw new Error('pathToFileURL not found');
  }
} catch {
  toFileURL = (fp: string) => {
    // Replace back-slashes with forward
    let p = fp.replace(/\\/g, '/');
    // Ensure absolute leading slash (Windows C: → /C:)
    if (!p.startsWith('/')) p = '/' + p;
    // Encode spaces etc.
    return encodeURI('file://' + p);
  };
}

console.log('[preload] preload.js loaded');

contextBridge.exposeInMainWorld('electron', {
  selectFile: (): Promise<string|null> =>
    ipcRenderer.invoke('dialog:selectFile'),

  computeHash: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('hash:compute', filePath),

  getFileInfo: (filePath: string) =>
    ipcRenderer.invoke('file:info', filePath),

  toFileURL,
});
