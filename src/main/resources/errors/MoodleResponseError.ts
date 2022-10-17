import { Response } from 'node-fetch';

/**
 * Error caused by an invalid response of the moodle api itself.
 */
export default class MoodleResponseError extends Error {
    response: Response;

    constructor(message: string, response: Response) {
        super(`Moodle Error Response: ${message}`);
        this.response = response;
    }
}
