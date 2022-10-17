import { Channels } from '../main/preload';

declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                sendMessage<M extends MessageType>(
                    message: Message<M>
                ): MessageResult<M>;
                openBrowser: (key: string) => void;
                once: (
                    channel: Channels,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    listener: (...args: any[]) => void
                ) => void;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                on: (
                    channel: Channels,
                    listener: (...args: any[]) => void
                ) => void;
                editSource: (edit: SourceEdit) => Promise<Source | undefined>;
                editResource: (
                    edit: ResourceEdit
                ) => Promise<ResourceInfo | undefined>;
                selectResource: (
                    sourceId: number
                ) => Promise<ResourceInfo | undefined>;
                selectResourcesByModule: (
                    moduleName: string
                ) => Promise<ResourceInfo[]>;
                openDirectoryDialog: (defaultPath?: string) => Promise<string>;
                prepareDetection: () => Promise<DetectedVessel[]>;
                fetchModules: (moduleId: string) => Promise<string>;
                openFile: (path: string) => Promise<boolean>;
                openExternal: (path: string) => Promise<void>;
                applyAction<K extends keyof ModelMap & Repository>(
                    action: ModelAction<K>
                ): Promise<ModelResult<K>>;
            };
        };
    }
}
