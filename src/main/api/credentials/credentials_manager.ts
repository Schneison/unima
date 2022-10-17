import fetch from 'node-fetch';
import log from 'electron-log';
import HTTPResponseError from '../../resources/errors/HTTPResponseError';
import { tryFetchCookie, verifyMoodleLogin } from '../../windows/browser_main';
import { getMainWindow } from '../../windows/window_main';
import MoodleError, {
    isJsonError,
    JsonError,
} from '../../resources/errors/MoodleError';
import { fetchMoodle } from '../../resources/request_utils';
import StoreProvider, { CredentialHandler } from './credentials_provider';
import { URL_TOKEN_REQUEST } from '../../constants';

class CredentialsManager {
    private static instance?: CredentialsManager;

    private provider: CredentialHandler;

    private lastInfo: CredentialInfo;

    constructor(provider: CredentialHandler) {
        this.provider = provider;
        this.lastInfo = {
            verified: false,
            cookieValid: false,
            loginPresent: false,
            tokenValid: false,
        };
    }

    static get(): CredentialsManager {
        if (!CredentialsManager.instance) {
            CredentialsManager.instance = new CredentialsManager(
                new StoreProvider()
            );
        }

        return CredentialsManager.instance;
    }

    saveInfo = (info: CredentialInfo) => {
        this.lastInfo = info;
        return info;
    };

    /**
     * Determines if any credentials of the users last session were saved and if
     * so, check the validation state of them. If any of the two is invalid, the
     * credentials have to be entered again.
     */
    checkLogin = async (): Promise<CredentialInfo> => {
        // Load credentials from last session
        const token = await this.provider.getToken().catch((e) => {
            log.error(e);
            return '';
        });
        const cookie = await this.provider.getCookie().catch((e) => {
            log.error(e);
            return '';
        });
        const lastCredentials = await this.provider
            .getCredentials()
            .catch((e) => {
                log.error(e);
                return {
                    username: '',
                    password: '',
                };
            });
        // Check credentials with the web server
        const tokenValid = await this.checkToken(token);
        const validCookie = await this.checkCookie(cookie, lastCredentials);
        if (validCookie !== cookie && !!validCookie) {
            this.provider.setCookie(validCookie);
        }
        return this.saveInfo({
            verified: tokenValid && !!validCookie,
            cookieValid: !!validCookie,
            loginPresent: !!token || !!cookie,
            tokenValid,
            cookie: validCookie,
            token,
        });
    };

    /**
     * Check if the given token is still valid
     *
     * @param token Moodle token
     */
    checkToken = async (token: string): Promise<boolean> => {
        return fetchMoodle('core_webservice_get_site_info', {}, { token }).then(
            async (r) => {
                const responseObj: JsonError | SiteInfo = (await r.json()) as
                    | JsonError
                    | SiteInfo;
                if (isJsonError(responseObj)) {
                    // If we get this error, the token is invalid, return false and login again
                    if (responseObj.errorcode === 'invalidtoken') {
                        return false;
                    }
                    throw new MoodleError(responseObj as JsonError, r);
                }
                return 'userid' in responseObj;
            }
        );
    };

    /**
     * Check if the given cookie is still valid
     *
     * @param cookie Moodle session cookie
     * @param lastCredentials Credentials from last session
     */
    checkCookie = async (
        cookie: string,
        lastCredentials: CredentialData
    ): Promise<string | undefined> => {
        return verifyMoodleLogin(
            getMainWindow(),
            lastCredentials,
            cookie,
            true
        );
    };

    /**
     * Main login logic, fetches the token via to moodle api and fetches the
     * cookie by login in into the web page in the background, with the help of
     * an invisible background window.
     *
     * @param data Credentials that were entered by the user.
     */
    tryLogin = async (data: CredentialData): Promise<CredentialInfo> => {
        return this.tryMoodleLogin(data)
            .catch((e) => {
                if (e instanceof MoodleError) {
                    return {
                        verified: false,
                        cookieValid: false,
                        loginPresent: false,
                        tokenValid: false,
                        error: e.error.error,
                    };
                }
                return {
                    verified: false,
                    cookieValid: false,
                    loginPresent: false,
                    tokenValid: false,
                    error: e.message,
                };
            })
            .then(this.saveInfo);
    };

    /**
     * Main login logic, fetches the token via to moodle api and fetches the
     * cookie by login in into the web page in the background, with the help of
     * an invisible background window.
     *
     * @param data Credentials that were entered by the user.
     * @private
     */
    tryMoodleLogin = async (data: CredentialData): Promise<CredentialInfo> => {
        const token = await this.fetchToken(data);
        const cookie = await tryFetchCookie(getMainWindow(), data);

        this.provider.setCredentials(data);
        this.provider.setCookie(cookie);
        this.provider.setToken(token);

        return {
            verified: true,
            cookieValid: true,
            loginPresent: true,
            tokenValid: true,
            token,
            cookie,
        };
    };

    fetchToken = async (data: CredentialData): Promise<string> => {
        return fetch(URL_TOKEN_REQUEST, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${data.username}&password=${data.password}`,
        }).then(async (res) => {
            if (!res.ok) {
                throw new HTTPResponseError(res);
            }
            const jsonResponse: any = await res.json();
            if ('token' in jsonResponse) {
                return jsonResponse.token as string;
            }
            throw new MoodleError(jsonResponse, res);
        });
    };

    getCredential = (): CredentialInfo => {
        return this.lastInfo;
    };
}

export default CredentialsManager.get();
