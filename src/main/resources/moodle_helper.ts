import { fetchMoodle, MoodleFunction, RestParams } from './request_utils';
import CredentialManager from '../api/credentials/credentials_manager';
import HTTPResponseError from './errors/HTTPResponseError';

export const fetchData = (
    name: MoodleFunction,
    arg: RestParams,
    credentials?: CredentialMoodle
) => {
    const tokenData = credentials ?? CredentialManager.getCredential();
    return fetchMoodle(name, arg, tokenData);
};

export const fetchJson = (
    name: MoodleFunction,
    arg: RestParams,
    credentials?: CredentialMoodle
): Promise<any> => {
    return fetchData(name, arg, credentials).then((res) => {
        if (!res.ok) {
            throw new HTTPResponseError(res);
        }
        return res.json();
    });
};
