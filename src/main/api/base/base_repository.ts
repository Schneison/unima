// https://medium.com/@erickwendel/generic-repository-with-typescript-and-node-js-731c10a1b98e
import { Knex } from 'knex';
import { DatabaseProvider } from '../../resources/database_provider';

/**
 * Abstract repository helper class which should be used to implement a
 * repository layer to access data from the database.
 */
export default class BaseRepository {
    db: Knex;

    name: Repository;

    /**
     * Default constructor
     *
     * @param name Name of the table this repository represents
     * @param db Object that can be used to access the database instance
     */
    constructor(name: Repository, db: DatabaseProvider) {
        this.db = db.getKnex();
        this.name = name;
    }

    /**
     * Helper function to access the table associated with this repository.
     * @protected
     */
    protected tableInternal<M>() {
        return this.db<M>(this.name);
    }
}
