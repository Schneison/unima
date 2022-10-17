import { Knex, knex } from 'knex';
import { DatabaseProvider } from '../main/resources/database_provider';

export default class MockDatabase implements DatabaseProvider {
    db: Knex;

    constructor() {
        this.db = knex({
            client: 'sqlite',
            connection: {
                filename: ':memory:',
            },
        });
        // mockDb.mock(this.db);
    }

    async seed() {
        await this.db.schema.createTable('detected_modules', (table) => {
            table.integer('id').primary();
            table.boolean('marked');
            table.string('title');
            table.string('url').unique();
            table.integer('moduleInternal').unique();
            table.string('vesselId').nullable();
            table.json('sectionTitles');
        });
        await this.db.schema.createTable('detected_vessels', (table) => {
            table.integer('id').primary();
            table.string('title').unique();
            table.string('instanceId');
        });
        await this.db.schema.createTable('modules', (table) => {
            table.integer('id').primary();
            table.string('url').unique();
            table.string('title');
            table.string('directory');
            table.string('vessel').nullable();
            table.string('color');
            table.json('sectionTitles');
            table.json('structure').defaultTo('compact');
            table.integer('internalId').unique();
        });
        await this.db.schema.createTable('sources', (table) => {
            table.increments('id');
            table.string('module');
            table.string('url').unique();
            table.integer('moodleId').nullable().unique();
            table.string('type');
            table.json('section').nullable();
            table.integer('parent').nullable();
            table.json('time').nullable();
            table.string('title');
            table.boolean('visible');
        });
    }

    getKnex(): Knex {
        return this.db;
    }

    close = () => {};
}
