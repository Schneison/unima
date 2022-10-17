interface Process {
    id: string;
    webId?: number;
    moldId?: string;
    step?: number;
}

interface ProcessListener {
    onComplete?: () => void;
    onKill?: () => void;
}

interface ProcessMold extends ProcessListener {
    id: string;
    steps: ProcessStep[];
}

interface ProcessStep extends ProcessListener {
    title: string;
}

type MessageType = keyof MessageHandler;

interface MessageOptions {
    processId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MessageOutcome {
    processId?: string;
}

interface MessageResult<M extends MessageType> {
    value: Promise<ReturnType<MessageHandler[M]>>;
    outcome: MessageOutcome;
}

interface Message<M extends MessageType> {
    type: M;
    params: Parameters<MessageHandler[M]>;
    options?: MessageOptions;
    webId?: string;
}

interface MessageDispatcher {
    sendMessage: <M extends MessageType>(
        message: Message<M>
    ) => MessageResult<M>;
}

interface ProcessManagerListener {
    onStart?: (process: Process) => void;
    onKill?: (process: Process) => void;
}

type ReplyType = keyof MessageReplyHandler;

interface MessageReply<M extends ReplyType> {
    type: M;
    params: Parameters<MessageReplyHandler[M]>;
    webId?: number;
}

interface MessageReplySender {
    sendReply: <M extends ReplyType>(reply: MessageReply<M>) => void;
}

interface MessageConsumer {
    handleMessage: <M extends MessageType>(message: Message<M>) => void;
}

interface MessageReplyConsumer {
    handleReply: <M extends ReplyType>(reply: MessageReply<M>) => void;
}

interface MessageReplyHandler {
    processResult: (type: string, arg: any) => void;
    processCancel: (type: string, arg: any) => void;
}

interface OpenDialogReturnValue {
    canceled: boolean;
    filePaths: string[];
    bookmarks?: string[];
}

interface MessageHandler {
    openBrowser: (key: string) => void;

    openLogin: () => void;

    tryLogin: (data: CredentialData) => Promise<CredentialInfo>;

    checkLogin: () => Promise<CredentialInfo>;

    detectModules: () => Promise<void>;

    editSource: (edit: SourceEdit) => Promise<Source | undefined>;

    editResource: (edit: ResourceEdit) => Promise<ResourceInfo | undefined>;

    selectResource: (sourceId: number) => Promise<ResourceInfo | undefined>;

    checkExistence: (
        sourceId: number,
        extensively: boolean,
        update: boolean
    ) => Promise<string | undefined>;

    deleteFile: (sourceId: number) => Promise<boolean>;

    selectResourcesByModule: (moduleName: string) => Promise<ResourceInfo[]>;

    parseSettings: () => Promise<ProgramInfo>;

    updateSettings: (settings: ProgramInfo) => Promise<void>;

    openDirectoryDialog: (
        defaultPath?: string
    ) => Promise<OpenDialogReturnValue>;

    requestDownload: (sourceId: number, check: boolean) => Promise<void>;

    prepareDetection: () => Promise<DetectedVessel[]>;

    fetchModules: (moduleId: string) => Promise<string>;

    openFile: (path: string) => Promise<boolean>;

    openExternal: (path: string) => Promise<void>;

    killProcess: (processId: string) => Promise<void>;

    applyAction: <K extends keyof ModelMap & Repository>(
        action: ModelAction<K>
    ) => Promise<ModelResult<K>>;

    /**
     * Fetches the structure data from the database that correspond to
     * the given module.
     */
    selectSectionItems: (moduleName: string) => Promise<SectionRoot>;

    /**
     * Fetches the member tree from the database that correspond to
     * the given module and architecture.
     */
    fetchFragment: (
        moduleId: string,
        options: ArchitectureOptions
    ) => Promise<RootMember>;

    /**
     * Applies fragment action
     */
    applyFragment: (
        sourceId: number,
        architecture: ArchitectureType,
        action: MemberAction
    ) => Promise<void>;

    /**
     * Fetches the member structure data from the databases, that correspond to
     * the given module.
     */
    selectMembers: (moduleName: string) => Promise<RootMember>;

    /**
     * Removes the tag data from the database, that correspond to
     * the given module.
     */
    resetTags: (moduleName: string) => Promise<void>;
}
