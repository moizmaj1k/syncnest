import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDev } from './util.js';
import { createHash } from 'crypto';

// Promise‐based fs functions
import * as fsp from 'fs/promises';
// Stream API for hashing
import { createReadStream } from 'fs';

// Polyfill __dirname & __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(app.getAppPath(), 'dist-react/index.html'),
    );
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => { mainWindow = null });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() });
app.on('activate', () => { if (mainWindow === null) createWindow() });

// -------------------------
// IPC Handlers
// -------------------------

ipcMain.handle('dialog:selectFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'webm'] }],
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('hash:compute', (_e, filePath: string) => {
  const hash = createHash('sha256');
  return new Promise<string>((resolve, reject) => {
    const stream = createReadStream(filePath);
    // TypeScript will infer chunk as string | Buffer | Uint8Array, which `hash.update` accepts
    stream.on('data', chunk => {
      hash.update(chunk);
    });
    stream.once('end', () => resolve(hash.digest('hex')));
    stream.once('error', err => reject(err));
  });
});

ipcMain.handle('file:info', async (_e, filePath: string) => {
  const stats = await fsp.stat(filePath);
  return {
    name: path.basename(filePath),
    size: stats.size,
    modified: stats.mtimeMs,
  };
});
