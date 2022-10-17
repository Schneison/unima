import fetch from 'node-fetch';
import { URL_WEB_SERVICE } from '../constants';

// https://docs.moodle.org/dev/Web_service_API_functions
// https://github.com/moodle/moodle/blob/511a87f5fc357f18a4c53911f6e6c7f7b526246e/mod/data/classes/external.php
export type MoodleFunction =
    | 'core_webservice_get_site_info'
    | 'core_course_get_contents'
    | 'core_course_get_categories'
    | 'mod_assign_get_assignments'
    | 'core_enrol_get_users_courses'
    | 'mod_data_get_entries';

export type RestParams = Record<string, string | number>;

const createREST = (name: string, arg: RestParams, token: string): string => {
    const params: RestParams = {
        ...arg,
        wsfunction: name,
        wstoken: token,
    };
    let path = '';
    Object.getOwnPropertyNames(params).forEach((param) => {
        const value = params[param];
        path += `&${param}=${value.toString()}`;
    });
    return path;
};

export const fetchMoodle = (
    name: MoodleFunction,
    arg: RestParams,
    credentials?: CredentialMoodle
) => {
    const path = createREST(name, arg, credentials?.token ?? '');
    return fetch(`${URL_WEB_SERVICE}${path}`, { method: 'GET' });
};
