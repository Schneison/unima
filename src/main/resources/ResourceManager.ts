import fs from 'fs';
import path from 'path';
import DataStorage from './data_storage';
import ReplySender from '../bridge/ReplySender';

class ResourceManager {
    private static instance?: ResourceManager;

    private downloadQueue: number[] = [];

    private processId?: string;

    async requestDownload(sourceId: number, check: boolean) {
        if (check && (await this.fileExists(sourceId, true, true))) {
            return;
        }
        this.downloadQueue.push(sourceId);
        await this.processDownloads();
    }

    async processDownloads(): Promise<undefined> {
        if (this.processId) {
            return undefined;
        }
        const values = this.downloadQueue;
        this.downloadQueue = [];

        const sources = await DataStorage.selectSourceByIds(values);
        const paths = await Promise.all(
            sources.map(async (source) => {
                const resource = await DataStorage.selectResource(source.id);
                return ResourceManager.getPath(source.id, resource);
            })
        );
        const elements: DownloadElement[] = sources.map((source, index) => {
            return {
                sourceId: source.id,
                path: paths[index],
                url: source.url,
            };
        });

        const [processId, results] =
            DataStorage.getNewEngine().downloadResources(elements);
        this.processId = processId.id;
        return (
            results
                .then((result) => result ?? [])
                // .then(this.moveFiles)
                .then((files) => {
                    ReplySender.sendReply({
                        type: 'processResult',
                        params: ['resources/onDownload', files],
                    });
                    return undefined;
                })
                .catch((e) => {
                    console.error(e, e.stack);
                })
                .then(() => {
                    this.processId = undefined;
                    if (this.downloadQueue.length > 0) {
                        this.processDownloads();
                    }
                    return undefined;
                })
        );
    }

    static getPath = async (
        sourceId: number,
        resource?: ResourceInfo
    ): Promise<string | undefined> => {
        if (!resource || !resource.fileName) {
            return undefined;
        }
        const source = await DataStorage.selectSourceById(sourceId);
        if (!source) {
            return undefined;
        }
        const module = await DataStorage.applyAction({
            repository: 'modules',
            type: 'select',
            criteria: {
                id: source.module,
            },
        }).then((result) => (result.payload ? result.payload[0] : undefined));
        if (!module) {
            return undefined;
        }
        const vessel = await DataStorage.applyAction({
            repository: 'vessels',
            type: 'select',
            criteria: {
                id: module.vessel,
            },
        }).then((result) => (result.payload ? result.payload[0] : undefined));
        if (!vessel) {
            return undefined;
        }
        return path.join(
            DataStorage.getStorageDirectory(),
            vessel.directory,
            module.directory,
            await DataStorage.getSubPath(resource, source, module),
            resource.fileName
        );
    };

    fileExists = async (
        sourceId: number,
        extensively = false,
        update = false
    ): Promise<string | undefined> => {
        const webId = ReplySender.getWebId();
        const resource = await DataStorage.selectResource(sourceId);
        if (!resource || !resource.fileName) {
            return undefined;
        }
        let loc: string | undefined | null = resource.location;
        if (!loc) {
            if (!extensively) {
                return undefined;
            }
            loc = await ResourceManager.getPath(sourceId, resource);
        }
        return new Promise<string | undefined>((resolve) => {
            if (loc == null) {
                resolve(undefined);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            fs.access(loc!, fs.constants.F_OK, (err) =>
                resolve(err === null ? loc! : undefined)
            );
        }).then((value) => {
            if (update && resource.downloaded !== !!value) {
                DataStorage.updateResource({
                    sourceId,
                    downloaded: !!value,
                    location: value ? loc : null,
                });
                ReplySender.sendReply({
                    type: 'processResult',
                    params: ['resources/onCheck', [sourceId, value]],
                    webId,
                });
            }
            return value;
        });
    };

    deleteFile = async (sourceId: number): Promise<boolean> => {
        const resource = await DataStorage.selectResource(sourceId);
        return new Promise<boolean>((resolve) => {
            if (!resource || !resource.location) {
                resolve(false);
                return;
            }
            fs.unlink(resource.location, (err) => resolve(err === null));
        }).then((value) => {
            DataStorage.updateResource({
                sourceId,
                downloaded: false,
                location: null,
            });
            return value;
        });
    };

    static get(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }

        return ResourceManager.instance;
    }
}

export default ResourceManager.get();
