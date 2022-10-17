/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import './ipc_main_handler';
import path from 'path';
import { app } from 'electron';
import DataStorage from './resources/data_storage';
import { initMainWindow } from './windows/window_main';

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDevelopment =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
    require('electron-debug')();
    app.commandLine.appendSwitch('remote-debugging-port', '9223');
}

app.on('login', (event, _webContents, _details, _authInfo, callback) => {
    event.preventDefault();
    callback('username', 'secret');
});

/**
 * Add event listeners...
 */

app.on('window-all-closed', async () => {
    await DataStorage.close();
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.whenReady()
    .then(async () => {
        const RESOURCES_PATH = app.isPackaged
            ? path.join(process.resourcesPath, 'assets')
            : path.join(__dirname, '../../assets');

        const getAssetPath = (...paths: string[]): string => {
            return path.join(RESOURCES_PATH, ...paths);
        };
        await DataStorage.create(getAssetPath);
        await initMainWindow();
    })
    .catch(console.log);
