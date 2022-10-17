// TODO: Remove
interface DataEngine {
    findModules: () => [Process, Promise<undefined>];

    updateModuleContent: (moduleId: string) => [Process, Promise<undefined>];

    downloadResources: (
        elements: DownloadElement[]
    ) => [Process, Promise<DownloadResult[] | undefined>];
}
