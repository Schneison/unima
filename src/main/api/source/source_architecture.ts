import DataStorage from '../../resources/data_storage';
import ResourceManager from '../../resources/ResourceManager';

interface SourceHierarchy {
    title: string;
    parent: number | null;
    section?: string;
    resource?: ResourceInfo;
}

/**
 * Creates an architecture for a source view
 */
export default class SourceArchitecture implements MemberArchitecture {
    addMemberTree = async (module: Module, addMember: AddMember) => {
        const sources: Source[] = await DataStorage.selectSourcesOrdered(
            module.id
        ).then((result) => result ?? []);
        const resources: Record<number, ResourceInfo> = {};
        (await DataStorage.selectResourcesByModule(module.id)).forEach(
            (info) => {
                resources[info.sourceId!] = info;
            }
        );
        const sourceInfos: Record<number, SourceHierarchy> = {};
        const sections = module.sectionTitles;
        sources.forEach((v) => {
            sourceInfos[v.id] = {
                title: v.title,
                parent: v.parent,
                section: v.section
                    ? sections[v.section.sectionIndex]?.title
                    : undefined,
                resource: resources[v.id],
            };
        });
        sources.forEach((source) => {
            const info = sourceInfos[source.id];
            let lastParInfo: SourceHierarchy | null = null;
            let par = source.parent;
            const path: string[] = [];
            while (par != null) {
                const parInfo = sourceInfos[par];
                path.push(parInfo.title);
                lastParInfo = parInfo;
                par = parInfo.parent;
            }
            // Get section from info if possible
            if (info.section) {
                path.push(info.section);
            }
            // If no info section available, check if last parent, which is positioned directly under the root, has one
            else if (lastParInfo?.section) {
                path.push(lastParInfo.section);
            } else {
                // TODO: Find a better way ?
                path.push('Missing Section!');
            }
            addMember(
                () => {
                    return {
                        title: source.title,
                        visible: source.visible,
                        type: source.type,
                        id: source.id,
                        mainAction: this.getMainAction(
                            source.type,
                            info.resource
                        ),
                        resource: info.resource
                            ? {
                                  downloaded: info.resource.downloaded,
                                  fileType: info.resource.type,
                                  fileName: info.resource.fileName,
                                  id: info.resource.id,
                              }
                            : undefined,
                    };
                },
                source.id,
                ...path.reverse(),
                source.title
            );
        });
    };

    getMainAction = (
        sourceType: LinkType,
        resource?: ResourceInfo
    ): MainAction => {
        if (sourceType !== 'resource' || !resource) {
            return 'missing';
        }
        switch (resource.type as ResourceType) {
            case 'application/zip':
            case 'application/pdf':
            case 'text/plain':
                return resource.downloaded ? 'file_open' : 'file_download';
            case 'video/mpeg':
            case 'unknown':
            default:
                return 'link_open';
        }
    };

    applyAction = async (id: number, action: MemberAction) => {
        const resource = await DataStorage.selectResource(id);
        switch (action) {
            case 'file_download':
                await ResourceManager.requestDownload(id, true);
                break;
            case 'file_open':
                if (!resource || !resource.location) {
                    break;
                }
                await DataStorage.openFile(resource.location);
                break;
            case 'file_delete':
                await ResourceManager.deleteFile(id);
                break;
            default:
                break;
        }
    };
}
