import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'fetchModules/cancel' | 'message/reply';

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        sendMessage(value: Message<any>) {
            return ipcRenderer.invoke('sendMessage', value);
        },
        openBrowser(value: string) {
            ipcRenderer.send('openBrowser', value);
        },
        selectSources(value: string) {
            return ipcRenderer.invoke('selectSources', value);
        },
        selectResource(value: number) {
            return ipcRenderer.invoke('selectResource', value);
        },
        selectResourcesByModule(value: string) {
            return ipcRenderer.invoke('selectResourcesByModule', value);
        },
        editSource(value: SourceEdit) {
            return ipcRenderer.invoke('editSource', value);
        },
        openDirectoryDialog() {
            return ipcRenderer.invoke('openDirectoryDialog');
        },
        applyAction(value: ModelAction<any>) {
            return ipcRenderer.invoke('applyAction', value);
        },
        prepareDetection() {
            return ipcRenderer.invoke('prepareDetection');
        },
        fetchModules(value: string) {
            return ipcRenderer.invoke('fetchModules', value);
        },
        openExternal(value: string) {
            return ipcRenderer.invoke('openExternal', value);
        },
        on(channel: Channels, func: (...args: unknown[]) => void) {
            const subscription = (
                _event: IpcRendererEvent,
                ...args: unknown[]
            ) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: Channels, func: (...args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
    },
});
