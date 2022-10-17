import { dialog } from 'electron';
import ProcessManager from './ProcessManager';
import DataStorage from '../resources/data_storage';
import ResourceManager from '../resources/ResourceManager';
import ReplySender from './ReplySender';
import { openBrowser, openLogin } from '../windows/browser_main';
import { getMainWindow } from '../windows/window_main';
import CredentialManager from '../api/credentials/credentials_manager';
import {
    applyAction,
    createMembers,
    selectMembers,
    selectSectionItems,
} from '../api/source/source_manager';

class MessageReceiver implements MessageHandler, MessageConsumer {
    private static instance?: MessageReceiver;

    static get(): MessageReceiver {
        if (!MessageReceiver.instance) {
            MessageReceiver.instance = new MessageReceiver();
        }

        return MessageReceiver.instance;
    }

    async handleMessage<M extends keyof MessageHandler>(message: Message<M>) {
        const handler = this[message.type];
        if (handler) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return handler.call(undefined, ...message.params);
        }
        return undefined;
    }

    selectSectionItems = (moduleName: string): Promise<SectionRoot> => {
        return selectSectionItems(moduleName);
    };

    selectMembers = (moduleName: string): Promise<RootMember> => {
        return selectMembers(moduleName);
    };

    resetTags = (moduleName: string): Promise<void> => {
        return DataStorage.getController().resetTags(moduleName);
    };

    checkExistence = (
        sourceId: number,
        extensively: boolean,
        update: boolean
    ): Promise<string | undefined> => {
        return ResourceManager.fileExists(sourceId, extensively, update);
    };

    requestDownload = (sourceId: number, check = true): Promise<void> => {
        return ResourceManager.requestDownload(sourceId, check);
    };

    deleteFile = (sourceId: number): Promise<boolean> => {
        return ResourceManager.deleteFile(sourceId);
    };

    editResource = (edit: ResourceEdit): Promise<ResourceInfo | undefined> => {
        return DataStorage.updateResource(edit);
    };

    editSource = (edit: SourceEdit): Promise<Source | undefined> => {
        return DataStorage.updateSource(edit);
    };

    applyAction = <K extends keyof ModelMap & Repository>(
        action: ModelAction<K>
    ): Promise<ModelResult<K>> => {
        return DataStorage.applyAction(action);
    };

    fetchModules = async (moduleId: string): Promise<string> => {
        const [process, result] = DataStorage.fetchModules(moduleId);
        result
            .then(() => {
                return ReplySender.processReply(
                    'demand/fetching/reply',
                    {},
                    process.webId
                );
            })
            .catch((error) => {
                ReplySender.processReply(
                    'demand/fetching/cancel',
                    { error },
                    process.webId
                );
            });
        return process.id;
    };

    killProcess = async (processId: string): Promise<void> => {
        ProcessManager.kill(processId);
    };

    detectModules = async () => {
        return DataStorage.getNewEngine().detectCourses();
    };

    openBrowser = (url: string): void => {
        return openBrowser(getMainWindow(), url);
    };

    openLogin = (): void => {
        return openLogin(getMainWindow());
    };

    tryLogin = async (data: CredentialData): Promise<CredentialInfo> => {
        return CredentialManager.tryLogin(data);
    };

    checkLogin = async (): Promise<CredentialInfo> => {
        return CredentialManager.checkLogin();
    };

    openDirectoryDialog = async (
        defaultPath?: string
    ): Promise<OpenDialogReturnValue> => {
        const mainWindow = getMainWindow();
        if (mainWindow == null) {
            return {
                canceled: true,
                filePaths: [],
            };
        }
        return dialog.showOpenDialog(mainWindow, {
            defaultPath,
            properties: ['openDirectory', 'promptToCreate'],
        });
    };

    openExternal = (path: string): Promise<void> => {
        return DataStorage.openExternal(path);
    };

    openFile = (path: string): Promise<boolean> => {
        return DataStorage.openFile(path);
    };

    parseSettings = (): Promise<ProgramInfo> => {
        return DataStorage.parseSettings();
    };

    prepareDetection = async (): Promise<DetectedVessel[]> => {
        return DataStorage.prepareDetection();
    };

    selectResource = (sourceId: number): Promise<ResourceInfo | undefined> => {
        return DataStorage.selectResource(sourceId);
    };

    selectResourcesByModule = (moduleName: string): Promise<ResourceInfo[]> => {
        return DataStorage.selectResourcesByModule(moduleName);
    };

    updateSettings = (settings: ProgramInfo): Promise<void> => {
        return DataStorage.updateSettings(settings);
    };

    fetchFragment = (
        moduleId: string,
        options: ArchitectureOptions
    ): Promise<RootMember> => {
        return createMembers(moduleId, options);
    };

    applyFragment = (
        sourceId: number,
        architecture: ArchitectureType,
        action: MemberAction
    ): Promise<void> => {
        return applyAction(sourceId, architecture, action);
    };
}

export default MessageReceiver.get();
