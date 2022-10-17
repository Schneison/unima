import { Response } from 'node-fetch';

export type MoodleErrorType = 'invalidtoken';

/**
 * Describes an error received from the moodle api.
 */
export interface JsonError {
    error: string;
    errorcode: string | MoodleErrorType;
    stacktrace: never;
    debuginfo: never;
    reproductionlink: never;
    exception?: string;
    message?: string;
}

export function isJsonError<T>(jsonObj: T | JsonError): jsonObj is JsonError {
    return 'errorcode' in jsonObj;
}

/**
 * Error caused by the moodle api itself.
 */
export default class MoodleError extends Error {
    response: Response;

    error: JsonError;

    constructor(error: JsonError, response: Response) {
        super(`Moodle Error: ${error.errorcode} ${error.error}`);
        this.response = response;
        this.error = error;
    }
}
