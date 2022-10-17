import { app } from 'electron';
import path from 'path';
import ModuleService from './module/module_service';
import ModuleRepository from './module/module_repository';
import { DatabaseProvider, FileDatabase } from '../resources/database_provider';

class Api {
    db?: DatabaseProvider;

    private moduleInstance?: ModuleService;

    private static instance?: Api;

    static getInstance(): Api {
        if (!Api.instance) {
            Api.instance = new Api();
        }

        return Api.instance;
    }

    connection = () => {
        if (!this.db) {
            const RESOURCES_PATH = app.isPackaged
                ? path.join(process.resourcesPath, 'assets')
                : path.join(__dirname, '../../../assets');

            const assets = (...paths: string[]): string => {
                return path.join(RESOURCES_PATH, ...paths);
            };
            this.db = new FileDatabase(assets('main_test_db.db'));
        }
        return this.db;
    };

    module = (): ModuleService => {
        if (!this.moduleInstance) {
            this.moduleInstance = new ModuleService(
                new ModuleRepository(this.connection())
            );
        }
        return this.moduleInstance;
    };
}

export default Api.getInstance();
