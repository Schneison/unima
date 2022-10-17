import { connect, Model, Trilogy } from 'trilogy';
import * as fs from 'fs';
import { shell } from 'electron';
import { Knex } from 'knex';
import path from 'path';
import MoodleEngine from './moodle_fetcher';
import ResourceController from './resource_controller';
import { DatabaseProvider } from './database_provider';
import Api from '../api/api';

type AssetFolder = (...paths: string[]) => string;

// https://devhints.io/knex
export default class DataStorage {
    // static db: Database;

    static wrapper: Trilogy;

    static settingPath: string;

    static dbLocation: string;

    static dbInstance: Knex;

    static settings: ProgramInfo;

    static newEngine: MoodleEngine;

    static controller: ResourceController;

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    static sources: Model<Source>;

    // @ts-ignore
    static resources: Model<ResourceInfo>;

    // @ts-ignore
    static modules: Model<Module>;

    // @ts-ignore
    static vessels: Model<ModuleVessel>;

    // @ts-ignore
    static modulesDetected: Model<DetectedModule>;

    // @ts-ignore
    static vesselsDetected: Model<DetectedVessel>;

    // @ts-ignore
    static tagData: Model<TagData>;

    // @ts-ignore
    static configCache: Model<ConfigCache>;

    // @ts-ignore
    static structureCache: Model<StructureCache>;

    /* eslint-enable @typescript-eslint/ban-ts-comment */
    static connection: DatabaseProvider;

    static getNewEngine(): MoodleEngine {
        return this.newEngine;
    }

    static enableDebug() {
        // sqlite3.verbose();
    }

    static async close() {
        await this.wrapper.close();
        this.connection.close();
        // await this.db.close();
    }

    static fetchModules(moduleId: string) {
        return this.newEngine.updateModuleContent(moduleId);
    }

    static getStorageDirectory(): string {
        return this.settings.directory;
    }

    static getDBLocation(): string {
        return this.dbLocation;
    }

    static getController(): ResourceController {
        return this.controller;
    }

    private static isError(object: unknown): object is Error {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return object && object.stack && object.message;
    }

    static async parseSettings(): Promise<ProgramInfo> {
        return JSON.parse(fs.readFileSync(this.settingPath, 'utf8'));
    }

    static async updateSettings(settings: ProgramInfo) {
        fs.writeFile(
            this.settingPath,
            JSON.stringify(settings),
            'utf8',
            () => {}
        );
    }

    static async prepareDetection(): Promise<DetectedVessel[]> {
        return this.applyAction({
            repository: 'detected_vessels',
            type: 'select',
        }).then((result) => result.payload ?? []);
    }

    static async create(assets: AssetFolder) {
        this.settingPath = assets('settings.json');
        this.dbLocation = assets('main_test_db.db');
        this.connection = Api.connection();
        const info: ProgramInfo = JSON.parse(
            fs.readFileSync(this.settingPath, 'utf8')
        );
        this.settings = info;
        this.controller = new ResourceController(this.dbLocation);
        this.controller.onStart(info.directory);
        this.enableDebug();
        this.newEngine = new MoodleEngine(this.connection);
        this.dbInstance = this.connection.getKnex();
        // `${info.databaseName}.db`
        this.wrapper = connect(this.dbLocation);
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        this.sources = await this.wrapper.model(
            'sources',
            {
                id: 'increments',
                module: { nullable: false, type: String },
                url: { nullable: false, type: String, unique: true },
                // TODO: change to nullable: false
                moodleId: { nullable: true, type: Number, unique: true },
                type: { nullable: false, type: String },
                section: { nullable: true, type: 'json' },
                parent: { nullable: true, type: Number },
                time: { nullable: true, type: 'json' },
                title: { nullable: false, type: String },
                visible: { nullable: false, type: Boolean },
            },
            {
                unique: ['url', 'module'],
            }
        );
        // @ts-ignore
        this.resources = await this.wrapper.model('resources', {
            id: 'increments',
            sourceId: { nullable: false, type: Number, unique: true },
            location: { nullable: true, type: String, unique: true },
            downloaded: { nullable: false, type: Boolean },
            type: { nullable: false, type: String },
            fileName: { nullable: true, type: String },
            marked: { nullable: false, type: Boolean },
        });
        // @ts-ignore
        this.modules = await this.wrapper.model('modules', {
            id: { nullable: false, type: String, primary: true },
            url: { nullable: false, type: String, unique: true },
            title: { nullable: false, type: String },
            directory: { nullable: false, type: String },
            vessel: { nullable: true, type: String },
            color: { nullable: false, type: String },
            sectionTitles: { nullable: false, type: 'json' },
            structure: { nullable: false, type: 'json', defaultTo: 'compact' },
            internalId: { nullable: false, type: Number, unique: true },
        });
        // @ts-ignore
        this.vessels = await this.wrapper.model('vessels', {
            id: { nullable: false, type: String, primary: true },
            title: { nullable: false, type: String },
            directory: { nullable: false, type: String, unique: true },
            color: { nullable: false, type: String },
        });
        // @ts-ignore
        this.modulesDetected = await this.wrapper.model('detected_modules', {
            id: { nullable: false, type: Number, primary: true },
            title: { nullable: false, type: String },
            url: { nullable: false, type: String, unique: true },
            moduleInternal: { nullable: false, type: Number, unique: true },
            marked: { nullable: false, type: Boolean },
            vesselId: { nullable: true, type: String },
            sectionTitles: { nullable: false, type: 'json' },
        });
        // @ts-ignore
        this.vesselsDetected = await this.wrapper.model('detected_vessels', {
            id: { nullable: false, type: Number, primary: true },
            title: { nullable: false, type: String, unique: true },
            instanceId: { nullable: true, type: String },
        });
        // @ts-ignore
        this.tagData = await this.wrapper.model(
            'tag_data',
            {
                source: { nullable: false, type: Number },
                tag: { nullable: false, type: String },
                value: { nullable: false, type: String },
                defPath: { nullable: false, type: String },
            },
            {
                primary: ['tag', 'source'],
            }
        );
        // @ts-ignore
        this.structureData = await this.wrapper.model('structure_data', {
            source: { nullable: false, type: Number, primary: true },
            path: { nullable: false, type: String, unique: true },
            defPath: { nullable: false, type: String },
        });
        // @ts-ignore
        this.configCache = await this.wrapper.model('config_cache', {
            type: { nullable: false, type: String },
            lastUpdate: { nullable: false, type: Number },
            defPath: { nullable: false, type: String, primary: true },
        });
        // @ts-ignore
        this.structureCache = await this.wrapper.model('struct_cache', {
            source: { nullable: false, type: Number, primary: true },
            path: { nullable: false, type: String, unique: true },
            defPath: { nullable: false, type: String },
        });
        /* eslint-enable @typescript-eslint/ban-ts-comment */
        this.dbInstance<Module>('modules')
            .select('id', 'directory', 'vessel')
            .then((modules) => {
                return modules.map(async (module) => {
                    const vessel = await DataStorage.applyAction({
                        repository: 'vessels',
                        type: 'select',
                        criteria: {
                            id: module.vessel,
                        },
                    }).then((result) =>
                        result.payload ? result.payload[0] : undefined
                    );
                    if (!vessel) {
                        return undefined;
                    }
                    return this.controller.onModuleLoad(
                        module.id,
                        path.join(
                            DataStorage.getStorageDirectory(),
                            vessel.directory,
                            module.directory
                        )
                    );
                });
            })
            .catch(() => {
                console.log('Fail!');
            });
    }

    static async selectResource(
        sourceId: number
    ): Promise<ResourceInfo | undefined> {
        return this.resources.findOne({ sourceId });
        // return this.db.get(
        //     SQL`select * from resources where sourceId=${sourceId}`
        // );
    }

    static async selectResourcesByModule(
        module: string
    ): Promise<ResourceInfo[]> {
        return this.wrapper
            .raw(
                this.wrapper
                    .knex('resources')
                    .select('*')
                    .orderBy('id')
                    .whereIn(
                        'sourceId',
                        this.wrapper
                            .knex('sources')
                            .select('id')
                            .where('module', module)
                    ),
                true
            )
            .then((results) => results);
    }

    static async selectSourceById(id: number): Promise<Source | undefined> {
        return this.sources.findOne({ id });
    }

    static async selectSourceByIds(ids: number[]): Promise<Source[]> {
        // return this.sources.find(['id', 'in', `${ids.join(',')}]);
        if (ids.length === 1) {
            const source = await this.sources.findOne({
                id: ids[0],
            });
            return source ? [source] : [];
        }
        return this.wrapper.raw(
            this.wrapper.knex('sources').select('*').whereIn('id', ids),
            true
        );
    }

    static async selectSourceUrlsByModule(module: string): Promise<string[]> {
        return this.sources
            .find({ module })
            .then((sources: Source[]) => sources.map((source) => source.url));
    }

    public static async updateSource(
        edit: SourceEdit
    ): Promise<Source | undefined> {
        if (edit.visible != null) {
            await this.sources.update(
                { id: edit.id },
                { visible: edit.visible }
            );
        }
        return this.sources.findOne({ id: edit.id });
    }

    private static rawSources(module: string) {
        return this.dbInstance<Source>('sources').where('module', module);
    }

    public static async selectSourcesOrdered(
        module: string
    ): Promise<Source[]> {
        return this.rawSources(module)
            .orderBy('parent')
            .then(this.transformSources);
    }

    public static async selectSources(module: string): Promise<Source[]> {
        return this.rawSources(module).then(this.transformSources);
    }

    private static async transformSources(
        sources: Source[]
    ): Promise<Source[]> {
        return sources.map((source) => {
            source.section = JSON.parse(source.section as unknown as string);
            source.time = JSON.parse(source.time as unknown as string);
            return source;
        });
    }

    public static async selectAllParents() {
        const subQuery = this.dbInstance<Source>('sources')
            .whereNotNull('parent')
            .select('parent')
            .distinct();
        return this.dbInstance<Source>('sources').whereIn('id', subQuery);
    }

    public static async updateResource(
        edit: ResourceEdit
    ): Promise<ResourceInfo | undefined> {
        if (edit.marked != null) {
            await this.resources.update(
                { sourceId: edit.sourceId },
                { marked: edit.marked }
            );
        } else if (edit.location) {
            await this.resources.update(
                { sourceId: edit.sourceId },
                { location: edit.location, downloaded: true }
            );
        } else if (edit.downloaded != null) {
            await this.resources.update(
                { sourceId: edit.sourceId },
                { downloaded: edit.downloaded, location: null }
            );
        }
        return this.resources.findOne({ sourceId: edit.sourceId });
    }

    public static async applyAction<K extends keyof ModelMap & Repository>(
        action: ModelAction<K>
    ): Promise<ModelResult<K>> {
        const { payload, type, repository, criteria } = action;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const model = this.wrapper.getModel<ModelMap[K]>(repository);
        try {
            switch (type) {
                case 'delete':
                    if (!criteria) {
                        return {
                            error: 'Failed to find necessary parameter "criteria" for operation "remove"',
                            status: 'failed',
                        };
                    }
                    return {
                        payload: await model.remove(criteria),
                        status: 'succeeded',
                    };
                case 'insert': {
                    if (!payload) {
                        return {
                            error: 'Failed to find necessary parameter "payload" for operation "insert"',
                            status: 'failed',
                        };
                    }
                    const value = await model.create(payload as ModelMap[K]);
                    if (!value) {
                        return {
                            status: 'succeeded',
                        };
                    }
                    return {
                        payload: [value],
                        status: 'succeeded',
                    };
                }
                case 'select':
                    return {
                        payload: await model.find(criteria),
                        status: 'succeeded',
                    };
                case 'update':
                    if (!criteria) {
                        return {
                            error: 'Failed to find necessary parameter "criteria" for operation "update"',
                            status: 'failed',
                        };
                    }
                    if (!payload) {
                        return {
                            error: 'Failed to find necessary parameter "payload" for operation "update"',
                            status: 'failed',
                        };
                    }
                    return {
                        payload: await model.update(criteria, payload),
                        status: 'succeeded',
                    };
                default:
                    break;
            }
        } catch (e) {
            if (this.isError(e)) {
                return {
                    error: e.message,
                    status: 'failed',
                };
            }
        }
        return {
            status: 'failed',
        };
    }

    static async openFile(location: string): Promise<boolean> {
        await shell.openPath(location);
        return Promise.resolve(true);
    }

    static async openExternal(url: string): Promise<void> {
        return shell.openExternal(url);
    }

    static async getSubPath(
        resource: ResourceInfo,
        source: Source,
        module: Module
    ): Promise<string> {
        return this.controller
            .getSubPath(resource, source, module)
            .catch((e) => {
                console.error(e);
                return '';
            });
    }
}
