import { Response } from 'node-fetch';

/**
 * Error caused by the connection to the moodle api.
 */
export default class HTTPResponseError extends Error {
    response: Response;

    constructor(response: Response) {
        super(`HTTP Error Response: ${response.status} ${response.statusText}`);
        this.response = response;
    }
}
