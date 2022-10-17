interface ProgramInfo {
    directory: string;
    databaseName: string;
    driverPath: string;
}

interface SettingsEdit {
    directory?: string;
    databaseName?: string;
}

interface TagData {
    source: number;
    tag: string;
    value: string;
    defPath: string;
}

interface ConfigCache {
    defPath: string;
    type: string;
    lastUpdate: number;
}

interface StructureCache {
    defPath: string;
    path: string;
    source: number;
}

type StructureType = 'compact';

type SourceSections = Record<string, Source[]>;

type ResourceCache = Record<string, ResourceInfo>;

type ModuleResources = Record<string, ResourceCache>;

type LinkType =
    | 'unknown'
    | 'zoom'
    | 'panopto'
    | 'section'
    | 'resource'
    | 'forum'
    | 'choice'
    | 'quizzes'
    | 'assign'
    | 'insignificant'
    | 'collection';

type ResourceType =
    | 'application/pdf'
    | 'text/plain'
    | 'application/zip'
    | 'video/mpeg'
    | 'video/mp4'
    | 'unknown';

interface SectionData {
    sectionIndex: number;
    index: number;
}

interface SectionTitle {
    title: string;
    index: number;
}

interface TimeData {
    created: number;
    modified: number;
}

type Parent = number;

interface Source {
    id: number;
    url: string;
    module: string;
    title: string;
    // Internal moodle module id
    moodleId: number | null;
    type: LinkType;
    visible: boolean;
    section: SectionData | null;
    parent: Parent | null;
    time: TimeData | null;
}

type SourceInclude = Omit<Source, 'id'> & {
    id: number | null;
};

interface SourceEdit {
    id: number;
    visible: boolean | undefined;
}

interface ResourceEdit {
    sourceId: number;
    location?: string | null;
    downloaded?: boolean;
    marked?: boolean;
}

interface StructureInfo {
    source: Source;
    resource: ResourceInfo;
    tags: Record<string, string>;
    pathName: string;
}

interface ResourceInfo {
    id: number;
    sourceId: number;
    location: string | null;
    downloaded: boolean;
    type: ResourceType;
    fileName: string | null;
    marked: boolean;
}

interface DownloadElement {
    sourceId: number;
    path?: string;
    url: string;
}

interface DownloadResult {
    element: DownloadElement;
    error?: any;
}

interface ModuleVesselEdit {
    id: string;
    title?: string;
    modules?: string;
    directory?: string;
    color?: string;
}

interface ModuleEdit {
    id?: string;
    title?: string;
    siblings?: string;
    directory?: string;
    url?: string;
    color?: string;
}

/**
 * "Semester"
 */
interface ModuleVessel {
    id: string;
    title: string;
    directory: string;
    color: string;
}

/**
 * "Kurs"
 */
interface Module {
    id: string;
    title: string;
    directory: string;
    internalId: number;
    url: string;
    color: string;
    vessel: string;
    sectionTitles: SectionTitle[];
    structure: StructureType;
}

/**
 * Generated by python based on the course data from moodle. Will be used to
 * generate vessel props.
 */
interface DetectedModule {
    // table id
    id: number;
    // ID used by moodle
    moduleInternal: number;
    // ID of the detected vessel
    vesselId: number;
    url: string;
    title: string;
    marked: boolean;
    sectionTitles: SectionTitle[];
}

type DetectedModuleInclude = Omit<DetectedModule, 'id' | 'sectionTitles'> & {
    id: number | null;
    sectionTitles: SectionTitle[] | string;
};

interface DetectedVessel {
    // table id
    id: number;
    // Title of the moodle course collection
    title: string;
    // ID of the vessel object in the vessels table
    instanceId: string | null;
}

type DetectedVesselInclude = Omit<DetectedVessel, 'id'> & {
    id: number | null;
};

type MemberProvider = ProviderItem<Member> & Member;

interface RootMember extends PlainMember {
    lexicon: MemberLexicon;
}

interface RawMember {
    details?: MemberDetail;
    children: Record<string, RawMember>;
}

type Member = object;

interface PlainMember extends MemberProvider {
    title: string;
}

interface LeafMember extends PlainMember {
    details: MemberDetail;
}

interface SourceMember extends PlainMember {
    source: Source;
    tags: Record<string, string>;
}

type SectionRoot = Record<string, SectionItem>;

type ChildItem = DisplayItem | Source;

interface ProviderItem<T> {
    children: T[];
}

interface SectionItem extends ProviderItem<ChildItem> {
    index: number;
}

interface DisplayItem extends ProviderItem<ChildItem> {
    source: Source;
}

interface CredentialData {
    username: string;
    password: string;
}

/**
 * Credentials provided by moodle
 */
interface CredentialMoodle {
    /**
     * Current cookie of the user.
     */
    cookie?: string;
    /**
     * Current token of the user.
     */
    token?: string;
}

interface CredentialInfo extends CredentialMoodle {
    /**
     * If the user is logged in.
     */
    loginPresent: boolean;
    /**
     * If the user is logged in and the password is valid.
     */
    verified: boolean;
    /**
     * If the saved cookie is valid.
     */
    cookieValid: boolean;
    /**
     * If the token is valid.
     */
    tokenValid: boolean;
    /**
     * Error text for login form.
     */
    error?: string;
}
