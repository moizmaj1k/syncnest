import {app, BrowserWindow} from 'electron';
import path from 'path';

type test = String;

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    // width: 1600,
    // height: 1600,
    // webPreferences: {
    //   nodeIntegration: true,
    //   contextIsolation: false,
    // },
  });

    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
});