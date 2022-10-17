type ModelActionSinge = 'insert' | 'update' | 'delete';
type ModelActionType = ModelActionSinge | 'select';
type Repository =
    | 'modules'
    | 'vessels'
    | 'sources'
    | 'resources'
    | 'detected_modules'
    | 'detected_vessels'
    | 'tag_data';
type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
type AsyncStatusCancelable = AsyncStatus | 'canceled';
type ResultStatus = 'succeeded' | 'failed';
type Models =
    | Module
    | Source
    | ResourceInfo
    | ModuleVessel
    | DetectedModule
    | DetectedVessel
    | TagData;

type ModelMap = {
    modules: Module;
    sources: Source;
    resources: ResourceInfo;
    vessels: ModuleVessel;
    detected_modules: DetectedModule;
    detected_vessels: DetectedVessel;
    tag_data: TagData;
};

interface RResult {
    status: ResultStatus;
    error?: string;
}

interface ModelResult<K extends keyof ModelMap & Repository> extends RResult {
    payload?: ModelMap[K][];
}

interface RAction<K extends keyof ModelMap & Repository> {
    repository: K;
}

interface ModelAction<K extends keyof ModelMap & Repository>
    extends RAction<K> {
    type: ModelActionType;
    payload?: ModelMap[K] | Partial<ModelMap[K]>;
    criteria?: Criteria<ModelMap[K]>;
}
