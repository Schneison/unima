import { Knex, knex } from 'knex';

export interface DatabaseProvider {
    getKnex(): Knex;

    close(): void;
}

export class FileDatabase implements DatabaseProvider {
    instance: Knex;

    constructor(location: string) {
        this.instance = knex({
            client: 'sqlite3',
            connection: {
                filename: location,
            },
            useNullAsDefault: true,
            asyncStackTraces: true,
            debug: true,
        });
    }

    getKnex(): Knex {
        return this.instance;
    }

    close = (): void => {};
}
