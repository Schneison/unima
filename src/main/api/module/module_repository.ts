import { DatabaseProvider } from '../../resources/database_provider';
import BaseRepository from '../base/base_repository';

export default class ModuleRepository extends BaseRepository {
    constructor(provider: DatabaseProvider) {
        super('modules', provider);
    }

    /**
     * Helper function to access the used table with the needed generic information
     * @protected
     */
    protected table() {
        return this.tableInternal<Module>();
    }

    /**
     * Converts the json data that is saved as a string the data model to a json object.
     */
    private transformModules = async (modules: Module[]): Promise<Module[]> => {
        return modules.map((value) => {
            value.sectionTitles = JSON.parse(
                value.sectionTitles as unknown as string
            );
            return value;
        });
    };

    /**
     * Select module from the database with the given id.
     *
     * @param moduleId Id of the module that should be retrieved
     */
    select(moduleId: string): Promise<Module | null> {
        return this.table()
            .where('id', moduleId)
            .then(this.transformModules)
            .then((result) => (result ? result[0] : null));
    }
}
