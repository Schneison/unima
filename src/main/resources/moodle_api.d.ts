interface SiteInfo {
    userid: number;
}

interface EntryFile {
    filename: string;
    filepath: string | null;
    filesize: number;
    fileurl: string;
    timemodified: number;
    mimetype: string;
    isexternalfile: boolean;
}

interface EntryContent {
    id: number;
    fieldid: number;
    recordid: number;
    content: string;
    content1: string;
    content2: string;
    content3: string;
    content4: string;
    files: EntryFile[];
}

interface DatabaseEntry {
    id: number;
    userid: number;
    groupid: number;
    dataid: number;
    timecreated: number;
    timemodified: number;
    approved: boolean;
    canmanageentry: boolean;
    fullname: string;
    contents: EntryContent[];
}

interface Database {
    entries: DatabaseEntry[];
}

interface Course {
    id: number;
    shortname: string;
    fullname: string;
    displayname: string;
    enrolledusercount: number;
    idnumber: string;
    visible: number;
    summary: string;
    summaryformat: number;
    format: string;
    showgrades: boolean;
    lang: string;
    enablecompletion: boolean;
    completionhascriteria: boolean;
    completionusertracked: boolean;
    category: number;
    progress: number;
    completed: boolean;
    startdate: number;
    enddate: number;
    marker: number;
    lastaccess: number;
    isfavourite: boolean;
    hidden: boolean;
    overviewfiles: never[];
}

interface CompletionData {
    state: number;
    timecompleted: number;
    overrideby: never | null;
    valueused: boolean;
}

interface Content {
    type: string;
    sortorder: number | null;
    userid: number | null;
    author: string | null;
    license: string | null;
    timecreated: number | null;
}

interface ContentFile extends Content, EntryFile {}

interface ContentInfo {
    filescount: number;
    filessize: number;
    lastmodified: number;
    mimetypes: string[];
    repositorytype: string;
}

type ContentType = Content | ContentFile;

interface ContentModule {
    id: number;
    url?: string;
    name: string;
    instance: number;
    description?: string;
    visible: number;
    uservisible: boolean;
    visibleoncoursepage: number;
    modicon: string;
    modname: string;
    modplural: string;
    indent: number;
    onclick: string;
    afterlink: never | null;
    customdata: string;
    noviewlink: boolean;
    completion: number;
    contents?: ContentType[];
    contentsinfo?: ContentInfo;
    completiondata?: CompletionData;
}

interface ContentSection {
    id: number;
    name: string;
    visible: number;
    summary: string;
    summaryformat: number;
    section: number;
    hiddenbynumsections: number;
    uservisible: boolean;
    modules: ContentModule[];
}

interface Folder {
    id: number;
    coursemodule: number;
    course: number;
    name: string;
    intro: string;
    introformat: number;
    introfiles: never[];
    revision: number;
    timemodified: number;
    display: number;
    showexpanded: number;
    showdownloadfolder: number;
    section: number;
    visible: number;
    groupmode: number;
    groupingid: number;
}

interface CoursePage {
    id: number;
    coursemodule: number;
    course: number;
    name: string;
    intro: string;
    introformat: number;
    introfiles: never[];
    content: string;
    contentformat: number;
    contentfiles: never[];
    legacyfiles: number;
    legacyfileslast: never;
    display: number;
    displayoptions: string;
    revision: number;
    timemodified: string;
    section: number;
    visible: number;
    groupmode: number;
    groupingid: number;
}

interface MoodleCategory {
    id: number;
    name: string;
    description: string;
    descriptionformat: number;
    parent: number;
    sortorder: number;
    coursecount: number;
    depth: number;
    path: string;
}

interface AssignmentConfig {
    plugin: string;
    subtype: string;
    name: string;
    value: string;
}

interface Assignment {
    id: number;
    cmid: number;
    course: number;
    name: string;
    nosubmissions: number;
    submissiondrafts: number;
    sendnotifications: number;
    sendlatenotifications: number;
    sendstudentnotifications: number;
    duedate: number;
    allowsubmissionsfromdate: number;
    grade: number;
    timemodified: number;
    completionsubmit: number;
    cutoffdate: number;
    gradingduedate: number;
    teamsubmission: number;
    requireallteammemberssubmit: number;
    teamsubmissiongroupingid: number;
    blindmarking: number;
    hidegrader: number;
    revealidentities: number;
    attemptreopenmethod: string;
    maxattempts: number;
    markingworkflow: number;
    markingallocation: number;
    requiresubmissionstatement: number;
    preventsubmissionnotingroup: number;
    configs: AssignmentConfig[];
    intro: string;
    introformat: number;
    introfiles: never[];
    introattachments: EntryFile[];
}

interface AssignmentCourse {
    id: number;
    fullname: string;
    shortname: string;
    timemodified: number;
    assignments: Assignment[];
}
