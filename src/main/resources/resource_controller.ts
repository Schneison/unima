import path from 'path';
import { knex, Knex } from 'knex';
import loadTags from '../api/structure/tags';
import { createPath, loadStructures } from '../api/structure/structures';
import {
    applyClassifications,
    loadClassifications,
} from '../api/structure/classifications';
import { RequirementContext } from '../api/structure/structure_common';

export default class ResourceController {
    knexInstance: Knex;

    constructor(fileName: string) {
        this.knexInstance = knex({
            client: 'sqlite3',
            connection: {
                filename: fileName,
            },
            useNullAsDefault: true,
            asyncStackTraces: true,
            // debug: true,
        });
    }

    onStart = (mainPath: string) => {
        loadTags(path.join(mainPath, 'config', 'tags'));
        loadStructures(path.join(mainPath, 'config', 'structures'));
    };

    onModuleLoad = (module: string, modulePath: string) => {
        loadClassifications(
            module,
            path.join(modulePath, 'config', 'classification')
        );
        loadStructures(path.join(modulePath, 'config', 'structures'), module);
    };

    async getTags(
        resource: ResourceInfo | null,
        source: Source,
        module: Module,
        forceReload = false,
        cache = true
    ): Promise<Record<string, string>> {
        if (forceReload) {
            return this.onSourceLoad(resource, source, module, cache);
        }
        const tags: Record<string, string> = {};
        await this.knexInstance<TagData>('tag_data')
            .where('source', source.id)
            .then(async (result) => {
                if (result.length > 0) {
                    result.forEach((data) => {
                        tags[data.tag] = data.value;
                    });
                } else {
                    Object.assign(
                        tags,
                        await this.onSourceLoad(resource, source, module, cache)
                    );
                }
                return null;
            })
            .catch((error) => {
                console.error(error);
            });
        return tags;
    }

    async createReqContext(
        resource: ResourceInfo | null,
        source: Source,
        module: Module,
        requestTags = true
    ): Promise<RequirementContext> {
        return {
            fileName: resource?.fileName ?? '',
            module: source.module,
            section: source.section?.sectionIndex ?? -1,
            sectionName:
                source.section &&
                module.sectionTitles.length > source.section.sectionIndex
                    ? module.sectionTitles[source.section.sectionIndex].title
                    : 'missing_name',
            tags: requestTags
                ? await this.getTags(resource, source, module)
                : {},
            classification: {},
        };
    }

    async getSubPath(
        resource: ResourceInfo | null,
        source: Source,
        module: Module
    ): Promise<string> {
        let parentPath = '';
        if (source.parent) {
            parentPath = await this.knexInstance<Source>('sources')
                .where('id', source.parent)
                .then((result) => {
                    const parentSource = result[0];
                    parentSource.section = JSON.parse(
                        parentSource.section as unknown as string
                    );
                    parentSource.time = JSON.parse(
                        parentSource.time as unknown as string
                    );
                    return this.getSubPath(null, parentSource, module);
                });
        }
        return path.join(
            parentPath,
            createPath(
                await this.createReqContext(resource, source, module),
                { currentProviders: [], providers: {} },
                module.id
            )
        );
    }

    async loadStructureComplete(module: Module): Promise<StructureInfo[]> {
        const sources: Record<string, Source> = await this.knexInstance<Source>(
            'sources'
        )
            .where('module', module.id)
            .where('type', 'resource')
            .then((result) => {
                const dict: Record<string, Source> = {};
                result.forEach((source: Source) => {
                    source.section = JSON.parse(
                        source.section as unknown as string
                    );
                    source.time = JSON.parse(source.time as unknown as string);
                    dict[source.id] = source;
                });
                return dict;
            });
        return this.knexInstance<ResourceInfo>('resources')
            .whereIn('sourceId', Object.keys(sources))
            .then(async (result) => {
                const pairList: StructureInfo[] = [];
                await Promise.all(
                    result.map(async (resource) => {
                        const source = sources[resource.sourceId];
                        pairList.push({
                            resource,
                            source,
                            tags: await this.getTags(resource, source, module),
                            pathName: await this.getSubPath(
                                resource,
                                source,
                                module
                            ).catch((e) => {
                                console.error(e);
                                return '';
                            }),
                        });
                    })
                );
                return pairList;
            });
    }

    async onSourceLoad(
        resource: ResourceInfo | null,
        source: Source,
        module: Module,
        cache = true
    ): Promise<Record<string, string>> {
        const context = await this.createReqContext(
            resource,
            source,
            module,
            false
        );
        try {
            applyClassifications(context, {
                currentProviders: [],
                providers: {},
            });
        } catch (error) {
            console.error(error);
        }
        if (cache && Object.keys(context.tags).length > 0) {
            await this.knexInstance<TagData>('tag_data')
                .insert(
                    Object.keys(context.tags).map((name) => {
                        return {
                            tag: name,
                            source: source.id,
                            value: context.tags[name],
                            defPath: context.classification[name],
                        };
                    })
                )
                .onConflict(['tag', 'source'])
                .merge(['value', 'defPath'])
                .catch((error) => {
                    console.error(error);
                });
        }
        return context.tags;
    }

    async resetTags(moduleName: string): Promise<void> {
        return this.knexInstance<TagData>('tag_data')
            .whereIn(
                'source',
                this.knexInstance<Source>('sources').where('module', moduleName)
            )
            .delete();
    }
}
