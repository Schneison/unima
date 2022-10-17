const messageProperties: MessageType[] = [
    'openBrowser',
    // Login
    'openLogin',
    'tryLogin',
    'checkLogin',
    //
    'editSource',
    'editResource',
    'selectResource',
    'checkExistence',
    'deleteFile',
    'selectResourcesByModule',
    'parseSettings',
    'updateSettings',
    'openDirectoryDialog',
    'prepareDetection',
    'fetchModules',
    'openFile',
    'openExternal',
    'killProcess',
    'requestDownload',
    'detectModules',
    'selectSectionItems',
    // Structure
    'selectMembers',
    'resetTags',
    // Fragments
    'fetchFragment',
    'applyFragment',
];

class MessageBroker {
    private static instance?: MessageBroker;

    private static get(): MessageBroker {
        if (!MessageBroker.instance) {
            MessageBroker.instance = new MessageBroker();
        }

        return MessageBroker.instance;
    }

    processes: Record<string, Process> = {};

    dispatch: MessageHandler;

    private constructor() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const handler: Pick<MessageHandler, MessageType> = {};
        messageProperties.forEach((name) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            handler[name] = (
                ...args: Parameters<MessageHandler[typeof name]>
            ) => {
                return this.sendMessage<typeof name>({
                    type: name,
                    params: [...args],
                });
            };
        });
        this.dispatch = handler;
    }

    public static handler() {
        return this.get().dispatch;
    }

    sendMessage = <M extends MessageType>(
        message: Message<M>
    ): MessageResult<M> => {
        return window.electron.ipcRenderer.sendMessage(message);
    };
}

export default MessageBroker.handler();
