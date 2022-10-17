/**
 * Called at the creation of a leaf member to give the member seed info
 */
type DetailsFactory = () => MemberDetail;

/**
 * Method for adding a member to the tree
 */
type AddMember = (
    factory: DetailsFactory,
    index: MemberIndex,
    ...path: string[]
) => void;

/**
 * Index for the member object in the tree, can be used together with MemberLexicon to find the member by this index
 */
type MemberIndex = number;

/**
 * Helper object that can be used to find an object in the member tree, key-value pairs for object index to path to the
 * member.
 */
type MemberLexicon = Record<MemberIndex, string>;

/**
 * Contains the data the client needs to render the member, used to reduce the size of data that is sent to the client
 */
type MemberDetail = DetailSource | DetailStructure;

/**
 * Contains the data of a source member
 */
interface DetailSource {
    title: string;
    visible: boolean;
    resource?: DetailsResource;
    type: string;
    id: number;
    mainAction: MainAction;
}

interface DetailsResource {
    downloaded: boolean;
    fileType: string;
    fileName: string | null;
    id: number;
}

/**
 * Contains the data of a structure member
 */
interface DetailStructure {
    tags: Record<string, string>;
}

type MainAction = 'link_open' | 'file_open' | 'file_download' | 'missing';
type MemberAction = MainAction | 'file_delete' | 'visibility';
type ArchitectureType = 'source' | 'structure';
type ArchitectureSorting = 'ascending' | 'descending';

/**
 * Options used to control the members of the architecture.
 */
interface ArchitectureOptions {
    /**
     * Used architecture type
     */
    type: ArchitectureType;
    /**
     * Sorting that should be applied to the architecture.
     */
    sorting: ArchitectureSorting;
    /**
     * Term that will be searched for in the title of the member.
     */
    searchTerm?: string;
}

/**
 * Category for creating members based on different data sets like files or sources
 */
interface MemberArchitecture {
    /**
     *
     * @param module
     * @param addMember
     */
    addMemberTree(module: Module, addMember: AddMember): Promise<void>;

    applyAction(id: number, action: MemberAction): Promise<void>;
}
