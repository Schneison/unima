import MockDatabase from './database';
import { fetchJson } from '../main/resources/moodle_helper';
import { MoodleFunction } from '../main/resources/request_utils';
import MoodleEngine from '../main/resources/moodle_fetcher';
import { URL_COURSE } from '../main/constants';

jest.mock('../main/resources/moodle_helper');

const mockFetch = fetchJson as jest.MockedFunction<typeof fetchJson>;

describe('Moodle API', () => {
    const courseDefault = {
        enrolledusercount: 350,
        idnumber: '',
        visible: 1,
        summary: '',
        summaryformat: 1,
        format: 'topics',
        showgrades: true,
        lang: '',
        enablecompletion: true,
        completionhascriteria: false,
        completionusertracked: true,
        progress: 0,
        completed: false,
        startdate: 1630533600,
        enddate: 1662069600,
        marker: 0,
        lastaccess: 1630533600,
        isfavourite: false,
        hidden: false,
        overviewfiles: [],
    };
    const courses: Course[] = [
        {
            id: 589,
            shortname: 'Mathematik an der Wilhelmshöher Allee',
            fullname: 'Mathematik an der Wilhelmshöher Allee',
            displayname: 'Mathematik an der Wilhelmshöher Allee',
            category: 300,
            ...courseDefault,
        },
        {
            id: 1491,
            shortname: 'LinAlg ET/Inf',
            fullname:
                'Lineare Algebra für ETech, Inf, Mecha, WiIng und Berufspäd.',
            displayname:
                'Lineare Algebra für ETech, Inf, Mecha, WiIng und Berufspäd.',
            category: 311,
            ...courseDefault,
        },
        {
            id: 722,
            shortname: 'FGdI',
            fullname: 'Formale Grundlagen der Informatik',
            displayname: 'Formale Grundlagen der Informatik',
            category: 311,
            ...courseDefault,
        },
    ];
    const contentInfoDefault = {
        filescount: 1,
        lastmodified: 1646034113,
        mimetypes: ['application/pdf'],
        repositorytype: '',
    };
    const fileDefault = {
        type: 'file',
        filepath: '/',
        timecreated: 1646034113,
        timemodified: 1646034113,
        sortorder: 1,
        mimetype: 'application/pdf',
        isexternalfile: false,
        userid: 8674,
        author: 'Antonia Wolf',
        license: 'unknown',
    };
    const moduleDefault = {
        visible: 1,
        uservisible: true,
        visibleoncoursepage: 1,
        modicon: '',
        indent: 0,
        onclick: '',
        afterlink: null,
        customdata: '""',
        noviewlink: false,
        completion: 0,
        completiondata: {
            state: 0,
            timecompleted: 0,
            overrideby: null,
            valueused: false,
        },
    };
    const sectionDefault = {
        visible: 1,
        summaryformat: 1,
        hiddenbynumsections: 0,
        uservisible: true,
    };
    const sections: ContentSection[] = [
        {
            id: 12970,
            name: 'A leo',
            summary: '',
            section: 0,
            modules: [
                {
                    id: 28183,
                    url: 'https://moodle.uni-kassel.de/mod/forum/view.php?id=28183',
                    name: 'A amet',
                    instance: 2594,
                    modname: 'forum',
                    modplural: 'Foren',
                    ...moduleDefault,
                },
            ],
            ...sectionDefault,
        },
        {
            id: 33508,
            name: 'Amet amet',
            summary:
                '<h1>HTML Ipsum Presents</h1><p><strong>Pellentesque habitant morbi tristique</strong> senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. <em>Aenean ultricies mi vitae est.</em> Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, <code>commodo vitae</code>, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. <a href="#">Donec non enim</a> in turpis pulvinar facilisis. Ut felis.</p><h2>Header Level 2</h2><ol> <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li> <li>Aliquam tincidunt mauris eu risus.</li></ol><blockquote><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus magna. Cras in mi at felis aliquet congue. Ut a est eget ligula molestie gravida. Curabitur massa. Donec eleifend, libero at sagittis mollis, tellus est malesuada tellus, at luctus turpis elit sit amet quam. Vivamus pretium ornare est.</p></blockquote><h3>Header Level 3</h3><ul> <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li> <li>Aliquam tincidunt mauris eu risus.</li></ul><pre><code>#header h1 a { display: block; width: 300px; height: 80px;}</code></pre>',
            section: 1,
            modules: [
                {
                    id: 135433,
                    url: 'https://moodle.uni-kassel.de/mod/resource/view.php?id=135433',
                    name: 'Vel habitant fusce.',
                    instance: 75092,
                    modname: 'resource',
                    modplural: 'Dateien',
                    contents: [
                        {
                            filename: 'Vel_habitant_fusce.pdf',
                            filesize: 97647,
                            fileurl:
                                'https://moodle.uni-kassel.de/webservice/pluginfile.php/285773/mod_resource/content/1/Klausur_Infoblatt.pdf?forcedownload=1',
                            ...fileDefault,
                        },
                    ],
                    contentsinfo: {
                        filessize: 97647,
                        ...contentInfoDefault,
                    },
                    ...moduleDefault,
                },
                {
                    id: 136260,
                    url: 'https://moodle.uni-kassel.de/mod/resource/view.php?id=136260',
                    name: 'Interdum per malesuada',
                    instance: 75552,
                    modname: 'resource',
                    modplural: 'Dateien',
                    contents: [
                        {
                            filename: 'Interdum per malesuada.pdf',
                            filesize: 11132,
                            fileurl:
                                'https://moodle.uni-kassel.de/webservice/pluginfile.php/286746/mod_resource/content/1/Raumaufteilung%20Klausur%20LinA%20.pdf?forcedownload=1',
                            ...fileDefault,
                        },
                    ],
                    contentsinfo: {
                        filessize: 11132,
                        ...contentInfoDefault,
                    },
                    ...moduleDefault,
                },
            ],
            ...sectionDefault,
        },
        {
            id: 19963,
            name: 'Vitae scelerisque leo justo nostra.',
            summary: '',
            section: 2,
            modules: [
                {
                    id: 43262,
                    url: 'https://moodle.uni-kassel.de/mod/choice/view.php?id=43262',
                    name: 'Sagittis ullamcorper ornare suspendisse pretium.',
                    instance: 259,
                    modname: 'choice',
                    modplural: 'Abstimmungen',
                    ...moduleDefault,
                },
                {
                    id: 70012,
                    url: 'https://moodle.uni-kassel.de/mod/choice/view.php?id=70012',
                    name: 'Tempus lorem massa!',
                    instance: 513,
                    modname: 'choice',
                    modplural: 'Abstimmungen',
                    ...moduleDefault,
                },
            ],
            ...sectionDefault,
        },
        {
            id: 19960,
            name: 'Iaculis magna erat',
            visible: 1,
            summary: '',
            summaryformat: 1,
            section: 3,
            hiddenbynumsections: 0,
            uservisible: true,
            modules: [
                {
                    id: 43034,
                    name: 'Quisque turpis',
                    instance: 6496,
                    description: '',
                    modname: 'label',
                    modplural: 'Textfelder',
                    ...moduleDefault,
                },
            ],
        },
        {
            id: 19961,
            name: 'Laoreet mauris cubilia dolor',
            summary: '',
            section: 4,
            modules: [
                {
                    id: 64012,
                    url: 'https://moodle.uni-kassel.de/mod/assign/view.php?id=64012',
                    name: 'Iaculis laoreet.',
                    instance: 3286,
                    modname: 'assign',
                    modplural: 'Aufgaben',
                    ...moduleDefault,
                },
                {
                    id: 59587,
                    url: 'https://moodle.uni-kassel.de/mod/quiz/view.php?id=59587',
                    name: 'Dis, sociis!',
                    instance: 1699,
                    modname: 'quiz',
                    modplural: 'Tests',
                    ...moduleDefault,
                },
                {
                    id: 59581,
                    url: 'https://moodle.uni-kassel.de/mod/quiz/view.php?id=59581',
                    name: 'Id consequat.',
                    instance: 1698,
                    modname: 'quiz',
                    modplural: 'Tests',
                    ...moduleDefault,
                },
            ],
            ...sectionDefault,
        },
    ];
    const categoryDefault = {
        description: '',
        descriptionformat: 1,
        parent: 289,
        depth: 4,
        path: '/12/287/289/648',
    };
    const categories: MoodleCategory[] = [
        {
            id: 300,
            name: 'Semesterübergreifende Angebote',
            sortorder: 5220000,
            coursecount: 1,
            ...categoryDefault,
        },
        {
            id: 311,
            name: 'WiSe 2021/22',
            sortorder: 5230000,
            coursecount: 15,
            ...categoryDefault,
        },
        {
            id: 312,
            name: 'SoSe 2022',
            sortorder: 5240000,
            coursecount: 12,
            ...categoryDefault,
        },
    ];
    const db: MockDatabase = new MockDatabase();
    const engine = new MoodleEngine(db);
    // const tracker: Tracker = db.tracker();
    beforeEach(() => {});
    beforeAll(async () => {
        await db.seed();

        mockFetch.mockImplementation(async (name: MoodleFunction) => {
            if (name === 'core_course_get_contents') {
                return sections;
            }
            if (name === 'core_enrol_get_users_courses') {
                return courses;
            }
            if (name === 'core_course_get_categories') {
                return categories;
            }
            return {};
        });
    });
    afterEach(async () => {
        db.getKnex()('sources').truncate();
        db.getKnex()('modules').truncate();
        db.getKnex()('detected_vessels').truncate();
        db.getKnex()('detected_modules').truncate();
    });
    afterAll(() => {
        db.close();
    });
    describe('Modules', () => {});
    describe('User Credentials', () => {});
    describe('Courses', () => {
        it('parse course', async () => {
            await engine.parseCourse(categories[0], courses[0]);
            const modules: DetectedModule[] = await db.getKnex()(
                'detected_modules'
            );
            expect(modules).toHaveLength(1);
            expect(modules[0].moduleInternal).toBe(courses[0].id);
            expect(modules[0].vesselId).toBe('1');
            expect(modules[0].url).toBe(`${URL_COURSE}?id=${courses[0].id}`);
            expect(modules[0].marked).toBeTruthy();
            expect(modules[0].title).toBe(courses[0].displayname);
            const vessels: DetectedVessel[] = await db.getKnex()(
                'detected_vessels'
            );
            expect(vessels).toHaveLength(1);
            expect(vessels[0].title).toBe(categories[0].name);
        });
        it('detect vessels and modules', async () => {
            await engine.detectCourses();
            const modules: DetectedModule[] = await db.getKnex()(
                'detected_modules'
            );
            expect(modules).toHaveLength(3);
            expect(modules[0].moduleInternal).toBe(589);
            expect(modules[0].vesselId).toBe('1');
            expect(modules[1].vesselId).toBe('2');
            expect(modules[2].vesselId).toBe('2');
            const vessels: DetectedVessel[] = await db.getKnex()(
                'detected_vessels'
            );
            expect(vessels).toHaveLength(2);
        });
    });
    describe('Read Sources', () => {});
    describe('Read Module', () => {});
    describe('Read Collection', () => {});
});
