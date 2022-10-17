import p from 'path';
import log from 'electron-log';
import { Knex } from 'knex';
// import * as https from 'https';
// import http from 'node:http';
import fs from 'fs';
import fetch, { Response } from 'node-fetch';
import { decode as decodeHtml } from 'html-entities';
import Transaction = Knex.Transaction;
import ProcessManager from '../bridge/ProcessManager';
import HTTPResponseError from './errors/HTTPResponseError';
import MoodleResponseError from './errors/MoodleResponseError';
import MoodleError, { JsonError } from './errors/MoodleError';
import CredentialManager from '../api/credentials/credentials_manager';
import { URL_COURSE } from '../constants';
import { DatabaseProvider } from './database_provider';
import { fetchJson } from './moodle_helper';

// ToDo: Replace with api fetch  and cache (in credentials file ?)
const userId = 19526;

const selectOrInsertSource = async (
    url: string,
    module: string,
    type: LinkType,
    moodleId: number | null,
    title: string,
    trx: Transaction
): Promise<number | undefined> => {
    return trx<Source>('sources')
        .where('url', url)
        .where('module', module)
        .then<Source[]>((res) => {
            if (res.length === 0) {
                return trx<SourceInclude>('sources')
                    .insert({
                        url,
                        module,
                        moodleId,
                        type,
                        title,
                        id: null,
                        section: null,
                        visible: true,
                    })
                    .then(() => {
                        return trx<Source>('sources')
                            .where('url', url)
                            .where('module', module);
                    });
            }
            return res;
        })
        .then((value) =>
            value.length > 0 ? value[0].id ?? undefined : undefined
        );
};

const insertResource = (
    sourceId: number,
    type: ResourceType,
    fileName: string,
    trx: Transaction
) => {
    return trx<ResourceInfo>('resources')
        .insert({
            sourceId,
            type,
            fileName,
            downloaded: false,
            marked: true,
            location: null,
        })
        .onConflict()
        .ignore();
};

const insertSourceMeta = <K extends keyof Source>(
    sourceId: number,
    name: K,
    data: Source[K],
    trx: Transaction
) => {
    return trx<Source>('sources')
        .update({
            [name]: JSON.stringify(data),
        })
        .where('id', sourceId)
        .onConflict()
        .ignore();
};

const insertDetectedVessel = async (
    title: string,
    trx: Transaction
): Promise<number | undefined> => {
    const res = await trx<DetectedVessel>('detected_vessels').where<
        DetectedVessel[]
    >('title', title);
    if (!res || res.length === 0) {
        return trx<DetectedVesselInclude>('detected_vessels')
            .insert({
                title,
                id: null,
            })
            .then((ids) => {
                return ids[0];
            });
    }
    return res.length >= 0 ? res[0].id ?? undefined : undefined;
};

const insertDetectedModule = (
    moduleId: number,
    url: string,
    title: string,
    vesselId: number,
    sections: SectionTitle[],
    trx: Transaction
) => {
    return trx<DetectedModuleInclude>('detected_modules')
        .insert({
            moduleInternal: moduleId,
            url,
            title,
            vesselId,
            marked: true,
            sectionTitles: JSON.stringify(sections),
            id: null,
        })
        .onConflict()
        .ignore();
};

const typeConverter: { [name: string]: LinkType } = {
    quiz: 'quizzes',
    data: 'collection',
};

//  export const fetchModuleData = async () => {
//     getMoodle(
//         'gradereport_user_get_grade_items',
//         {
//             courseid: 1491,
//             userid: userId,
//         },
//         (response) => {
//             let str = '';
//             response.on('data', (chunk) => {
//                 str += chunk;
//             });
//
//             response.on('end', async () => {
//                 const db: Database = JSON.parse(str);
//                 log.log('');
//             });
//         }
//     ).end();
//     getMoodle(
//         'gradereport_user_get_grades_table',
//         {
//             courseid: 1491,
//             userid: userId,
//         },
//         (response) => {
//             let str = '';
//             response.on('data', (chunk) => {
//                 str += chunk;
//             });
//
//             response.on('end', async () => {
//                 const db: Database = JSON.parse(str);
//                 log.log('');
//             });
//         }
//     ).end();
//     https.get(
//         {
//             host: 'moodle.uni-kassel.de',
//             path: '/pluginfile.php/171464/mod_resource/content/1/1kap1.pdf',
//             method: 'GET',
//             headers: {
//                 Cookie: cookie,
//             },
//         },
//         (response) => {
//             const content = response.headers['content-disposition'];
//             if (content) {
//                 const dispoMatch = /filename="(.+)"/[Symbol.match](content);
//                 if (!dispoMatch) {
//                     return;
//                 }
//                 const fileName =
//                     dispoMatch.length > 0 ? dispoMatch[1] : undefined;
//                 if (fileName) {
//                     response.pipe(
//                         fs.createWriteStream(
//                             `E:/Projects/Electron/umasy/test/${fileName}`
//                         )
//                     );
//                 }
//             }
//         }
//     );
// };

export default class MoodleEngine implements DataEngine {
    knexInstance: Knex;

    constructor(db: DatabaseProvider) {
        this.knexInstance = db.getKnex();
    }

    downloadResources = (
        elements: DownloadElement[]
    ): [Process, Promise<DownloadResult[] | undefined>] => {
        const process = ProcessManager.requestProcess();
        const requests = elements.map(this.downloadRequest);
        return [process, Promise.all(requests)];
    };

    downloadRequest = async (
        element: DownloadElement
    ): Promise<DownloadResult> => {
        const credential: CredentialInfo = CredentialManager.getCredential();
        const res: Response = await fetch(
            `${element.url}?token=${credential.token}`,
            {
                method: 'GET',
                headers: {
                    Cookie: credential.cookie ?? '',
                },
            }
        );
        if (element.path) {
            await fs.promises
                .mkdir(p.dirname(element.path), { recursive: true })
                .catch(log.error);
        } else {
            return {
                element,
                error: 'No path',
            };
        }
        if (!res.ok) {
            throw new HTTPResponseError(res);
        }
        const fileType: string | null = res.headers.get('content-type');
        if (fileType && fileType.length > 0) {
            const values = fileType.split(';');
            if (values.length < 1) {
                throw new MoodleResponseError('Missing file type header.', res);
            }
            if (
                values[0] === 'application/json' &&
                p.extname(element.path) !== 'json'
            ) {
                const error: JsonError = (await res.json()) as JsonError;
                throw new MoodleError(error, res);
            }
        }
        return new Promise((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const dest = fs.createWriteStream(element.path!);
            if (res.body == null) {
                resolve({
                    element,
                    error: 'some',
                });
                return;
            }
            res.body.pipe(dest);
            res.body.on('end', () =>
                resolve({
                    element,
                })
            );
            dest.on('error', (error) =>
                resolve({
                    element,
                    error,
                })
            );
        });
    };

    updateModuleContent(moduleId: string): [Process, Promise<undefined>] {
        const process = ProcessManager.requestProcess();
        return [process, this.fetchAndUpdateContent(moduleId)];
    }

    fetchDataCollection = async (
        trx: Transaction,
        id: number,
        moduleName: string,
        parentId: number
    ) => {
        const db: Database = await fetchJson('mod_data_get_entries', {
            databaseid: id,
            returncontents: 1,
        });
        await Promise.all(
            db.entries.map(async (entry) =>
                Promise.all(
                    entry.contents.map(async (content) =>
                        Promise.all(
                            content.files.map(async (file) => {
                                await this.parseCollectionEntry(
                                    file,
                                    moduleName,
                                    trx,
                                    entry,
                                    parentId
                                );
                            })
                        )
                    )
                )
            )
        );
        log.log('test');
    };

    parseCollectionEntry = async (
        file: EntryFile,
        moduleName: string,
        trx: Knex.Transaction,
        entry: DatabaseEntry,
        parentId: number
    ) => {
        const sourceId = await selectOrInsertSource(
            file.fileurl,
            moduleName,
            'resource',
            null,
            file.filename,
            trx
        );
        if (!sourceId) {
            return;
        }
        await insertResource(
            sourceId,
            file.mimetype as ResourceType,
            file.filename,
            trx
        );
        await insertSourceMeta(
            sourceId,
            'time',
            {
                created: entry.timecreated,
                modified: entry.timemodified,
            },
            trx
        );
        await insertSourceMeta(sourceId, 'parent', parentId, trx);
    };

    async fetchAndUpdateContent(moduleName: string): Promise<undefined> {
        const modules: Module[] = await this.knexInstance<Module>(
            'modules'
        ).where('id', moduleName);
        if (modules?.length < 0) {
            return undefined;
        }
        const module = modules[0];
        if (!module) {
            return undefined;
        }
        const sections: ContentSection[] = await fetchJson(
            'core_course_get_contents',
            {
                courseid: module.internalId,
            }
        );
        await Promise.all(
            sections.map((section, index) =>
                this.parseSection(index, section, moduleName)
            )
        ).catch((error) => {
            log.error(error);
        });

        // TODO: Update condition if we do more in the update function
        // TODO: Improve condition, not all situations were a update is needed are currently covered
        if (sections.length !== module.sectionTitles.length) {
            await this.updateCourse(module.internalId, sections);
        }
        await this.fetchAssignments(module.internalId, moduleName);
        return undefined;
    }

    // async allTrans<T, U>(
    //     values: T[],
    //     callback: (value: T, index: number, trx: Transaction) => Promise<U>,
    //     errorCallback?: (reason: any) => U | PromiseLike<U>
    // ): Promise<U[]> {
    //     return Promise.all(
    //         values.map<Promise<U>>((v, i) =>
    //             this.knexInstance
    //                 .transaction((trx) => callback(v, i, trx))
    //                 .catch(errorCallback)
    //         )
    //     );
    // }

    private parseSection(
        index: number,
        section: ContentSection,
        moduleName: string
    ) {
        return this.knexInstance
            .transaction((trx) => {
                log.log(`Start: ${index}!`);
                const modulePromises = section.modules.map((module, i, data) =>
                    this.parseModule(trx, moduleName, section, module, i)
                        .then(() => {
                            log.log(`Done : ${i + 1}/${data?.length}`);
                            return undefined;
                        })
                        .catch((error) => {
                            log.error(error);
                        })
                );
                return Promise.all(modulePromises)
                    .catch((error) => {
                        log.error(error);
                    })
                    .then(trx.commit)
                    .then(() => {
                        log.log(`Commit: ${index}!`);
                        return undefined;
                    });
            })
            .catch((error) => {
                log.error(error);
            });
    }

    /**
     * Updates section titles for the given module and the detected version.
     *
     * @param moodleId Internal id used by moodle to identify this course
     * @param sections Sections of the course
     */
    async updateCourse(moodleId: number, sections: ContentSection[]) {
        await this.knexInstance<Module>('modules')
            .where('internalId', moodleId)
            .update(
                'sectionTitles',
                JSON.stringify(this.generateSectionTitle(sections))
            );
        await this.knexInstance<DetectedModule>('detected_modules')
            .where('moduleInternal', moodleId)
            .update(
                'sectionTitles',
                JSON.stringify(this.generateSectionTitle(sections))
            );
    }

    async parseModule(
        trx: Transaction,
        moduleName: string,
        section: ContentSection,
        module: ContentModule,
        index: number
    ) {
        log.log('Start');
        const modName = module.modname;
        const instanceId = module.instance;
        let modType: LinkType = modName as LinkType;
        if (typeConverter[modName]) {
            modType = typeConverter[modName];
        }
        const parentSource = await selectOrInsertSource(
            module.url ?? `${URL_COURSE}?id=${module.id}`,
            moduleName,
            modType,
            module.id,
            module.name,
            trx
        );
        if (!parentSource) {
            return;
        }
        await insertSourceMeta(
            parentSource,
            'section',
            {
                sectionIndex: section.section,
                index,
            },
            trx
        );
        if (modName === 'resource' || modName === 'folder') {
            if (!module.contents) {
                return;
            }
            const singeFile = module.contents.length === 1;
            // eslint-disable-next-line no-restricted-syntax
            await Promise.all(
                module.contents
                    .map(async (content) => {
                        await this.parseContent(
                            content,
                            parentSource,
                            singeFile,
                            moduleName,
                            trx
                        );
                    })
                    .map((promise) =>
                        promise.catch((error) => {
                            log.error(error);
                        })
                    )
            ).catch((error) => {
                log.error(error);
            });
        } else if (modName === 'data') {
            await this.fetchDataCollection(
                trx,
                instanceId,
                moduleName,
                parentSource
            );
        }
        log.log('End!');
    }

    parseContent = async (
        content: Content | ContentFile,
        parentSource: number,
        singeFile: boolean,
        moduleName: string,
        trx: Knex.Transaction
    ) => {
        const { type } = content;
        if (type === 'file') {
            const fileContent = content as ContentFile;
            let sourceId = parentSource;
            if (!singeFile) {
                const id = await selectOrInsertSource(
                    fileContent.fileurl,
                    moduleName,
                    'resource',
                    null,
                    fileContent.filename,
                    trx
                );
                if (!id) {
                    return;
                }
                sourceId = id;
            }
            await insertResource(
                sourceId,
                fileContent.mimetype as ResourceType,
                fileContent.filename,
                trx
            );
            await insertSourceMeta(
                sourceId,
                'time',
                {
                    created: fileContent.timecreated ?? 0,
                    modified: fileContent.timemodified,
                },
                trx
            );
            if (!singeFile) {
                await insertSourceMeta(sourceId, 'parent', parentSource, trx);
            }
        }
    };

    findModules = (): [Process, Promise<undefined>] => {
        const process = ProcessManager.requestProcess();
        return [process, this.detectCourses()];
    };

    fetchCourses = async (): Promise<Course[]> => {
        return fetchJson('core_enrol_get_users_courses', {
            userid: userId,
        });
    };

    async detectCourses(): Promise<undefined> {
        const courses: Course[] = await this.fetchCourses();
        // Retrieving the needed course from the moodle api
        const categories: MoodleCategory[] = await fetchJson(
            'core_course_get_categories',
            {
                'criteria[0][key]': 'ids',
                'criteria[0][value]': courses
                    .map((course) => course.category)
                    .join(','),
            }
        );
        const categoryById: { [id: number]: MoodleCategory } = {};
        categories.forEach((category) => {
            categoryById[category.id] = category;
        });
        await Promise.all(
            courses.map((course) =>
                this.parseCourse(categoryById[course.category], course)
            )
        );
        return undefined;
    }

    generateSectionTitle = (sections: ContentSection[]): SectionTitle[] => {
        return sections.map((section) => {
            return {
                index: section.section,
                title: decodeHtml(section.name),
            };
        });
    };

    parseCourse(category: MoodleCategory, course: Course) {
        return this.knexInstance.transaction(async (trx) => {
            const vesselId = await insertDetectedVessel(
                decodeHtml(category.name),
                trx
            );
            if (!vesselId) {
                return;
            }
            const sections: ContentSection[] = await fetchJson(
                'core_course_get_contents',
                {
                    courseid: course.id,
                }
            );
            await insertDetectedModule(
                course.id,
                `${URL_COURSE}?id=${course.id}`,
                decodeHtml(course.shortname),
                vesselId,
                this.generateSectionTitle(sections),
                trx
            ).then(trx.commit);
        });
    }

    async fetchAssignments(
        moduleId: number,
        moduleName: string
    ): Promise<undefined> {
        const courses: Course[] = await this.fetchCourses();
        const courseIds: Record<string, number> = {};
        courses.forEach((course, i) => {
            courseIds[`courseids[${i}]`] = course.id;
        });
        const data: {
            courses: AssignmentCourse[];
            warnings: never[];
        } = await fetchJson('mod_assign_get_assignments', courseIds);
        const assignCourse = data.courses
            .filter((course) => course.id === moduleId)
            .shift();
        if (assignCourse) {
            await this.knexInstance.transaction(async (trx) => {
                return Promise.all(
                    assignCourse.assignments.map(async (assign) => {
                        return this.parseAssign(trx, assign, moduleName);
                    })
                )
                    .catch((error) => {
                        log.error(error);
                    })
                    .then(trx.commit);
            });
        }
        return undefined;
    }

    parseAssign = async (
        trx: Knex.Transaction,
        assign: Assignment,
        moduleName: string
    ) => {
        const parentSource: Source | void = await trx<Source>('sources')
            .where('moodleId', assign.cmid)
            .then((result) => result[0])
            .catch((error) => {
                log.error(error);
            });
        if (!parentSource) {
            return null;
        }
        return Promise.all(
            assign.introattachments.map(async (file) => {
                await this.parseAssignEntry(
                    file,
                    moduleName,
                    trx,
                    assign,
                    parentSource
                );
            })
        ).catch((error) => {
            log.error(error);
        });
    };

    parseAssignEntry = async (
        file: EntryFile,
        moduleName: string,
        trx: Knex.Transaction,
        assign: Assignment,
        parentSource: Source
    ) => {
        const id = await selectOrInsertSource(
            file.fileurl,
            moduleName,
            'resource',
            null,
            file.filename,
            trx
        );
        if (!id) {
            return;
        }
        await insertResource(
            id,
            file.mimetype as ResourceType,
            file.filename,
            trx
        );
        await insertSourceMeta(
            id,
            'time',
            {
                created: assign.allowsubmissionsfromdate,
                modified: file.timemodified,
            },
            trx
        );
        await insertSourceMeta(id, 'parent', parentSource.id, trx);
    };
}
