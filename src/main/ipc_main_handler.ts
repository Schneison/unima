import { dialog, ipcMain, IpcMainInvokeEvent } from 'electron';
import ReplySender from './bridge/ReplySender';
import MessageReceiver from './bridge/MessageReceiver';
import ProcessManager from './bridge/ProcessManager';
import DataStorage from './resources/data_storage';
import { openBrowser } from './windows/browser_main';
import { getMainWindow } from './windows/window_main';

ipcMain.handle('sendMessage', async (event, message: Message<any>) => {
    ReplySender.setWebId(event.sender.id);
    return MessageReceiver.handleMessage(message).then((value) => {
        ReplySender.clearWebId();
        return value;
    });
});
ipcMain.handle('killProcess', async (_event, processId: string) => {
    ProcessManager.kill(processId);
});
ipcMain.handle(
    'fetchModules',
    async (event: IpcMainInvokeEvent, moduleId: string) => {
        const [process, result] = DataStorage.fetchModules(moduleId);
        result
            .then(() => {
                event.sender.send('fetchModules/reply', {});
            })
            .catch((error) => {
                event.sender.send('fetchModules/cancel', { error });
            });
        return process;
    }
);
ipcMain.handle('selectResource', (_, sourceId: number) => {
    return DataStorage.selectResource(sourceId);
});
ipcMain.handle('editSource', (_, edit: SourceEdit) => {
    return DataStorage.updateSource(edit);
});
ipcMain.handle('selectResourcesByModule', (_, moduleName: string) => {
    return DataStorage.selectResourcesByModule(moduleName);
});
ipcMain.handle('editResource', (_, edit: ResourceEdit) => {
    return DataStorage.updateResource(edit);
});
ipcMain.handle('openDirectoryDialog', (_, defaultPath?: string) => {
    const mainWindow = getMainWindow();
    if (mainWindow == null) {
        return null;
    }
    return dialog.showOpenDialog(mainWindow, {
        defaultPath,
        properties: ['openDirectory', 'promptToCreate'],
    });
});
ipcMain.handle('parseSettings', async () => {
    return DataStorage.parseSettings();
});
ipcMain.handle('updateSettings', async (_, settings) => {
    return DataStorage.updateSettings(settings);
});
ipcMain.handle('openFile', async (_, location: string) => {
    return DataStorage.openFile(location);
});
ipcMain.handle('openExternal', async (_, url: string) => {
    return DataStorage.openExternal(url);
});
ipcMain.handle(
    'applyAction',
    <K extends keyof ModelMap & Repository>(
        _: IpcMainInvokeEvent,
        action: ModelAction<K>
    ): Promise<ModelResult<K>> => {
        return DataStorage.applyAction(action);
    }
);
ipcMain.handle('prepareDetection', async () => {
    return DataStorage.prepareDetection();
});

ipcMain.on('openBrowser', (_event, url: string) => {
    const mainWindow = getMainWindow();
    openBrowser(mainWindow, url);
});
