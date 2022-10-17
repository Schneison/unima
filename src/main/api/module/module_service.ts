import ModuleRepository from './module_repository';

export default class ModuleService {
    repo: ModuleRepository;

    constructor(repo: ModuleRepository) {
        this.repo = repo;
    }

    /**
     * Select module from the repo with the given id.
     *
     * @param moduleId Id of the module that should be retrieved
     */
    select(moduleId: string): Promise<Module | null> {
        return this.repo.select(moduleId);
    }
}
