import {app, BrowserWindow} from 'electron';
import path from 'path';
import { isDev } from './util.js';

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    // width: 1600,
    // height: 1600,
    // webPreferences: {
    //   nodeIntegration: true,
    //   contextIsolation: false,
    // },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }

});