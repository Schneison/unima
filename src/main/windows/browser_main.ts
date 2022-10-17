import { BrowserWindow, CookiesSetDetails, WebContents } from 'electron';
import log from 'electron-log';
import MenuBuilder from './menu';
import {
    COOKIE_MOODLE_SESSION_NAME,
    DEFAULT_URL,
    URL_LOGIN_INDEX,
} from '../constants';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let browserWindow: BrowserWindow | null = null;
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loginWindow: BrowserWindow | null = null;
/* eslint-enable @typescript-eslint/ban-ts-comment */

interface BrowserConfig {
    url?: string;
    width?: number;
    height?: number;
    alwaysOnTop?: boolean;
    fullscreenable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    resizable?: boolean;
    modal?: boolean;
    showAfterCreate?: boolean;
    title?: string;
    menu?: boolean;
    cookie?: CookiesSetDetails;
}

const createBrowser: (
    mainWindow: BrowserWindow | null,
    config?: BrowserConfig,
    consumer?: (window: BrowserWindow | null) => void
) => BrowserWindow = (mainWindow, config, consumer) => {
    const window = new BrowserWindow({
        parent: mainWindow != null ? mainWindow : undefined,
        show: false,
        width: config?.width ?? 1024,
        height: config?.height ?? 728,
        alwaysOnTop: config?.alwaysOnTop,
        fullscreenable: config?.fullscreenable,
        minimizable: config?.minimizable,
        maximizable: config?.maximizable,
        resizable: config?.resizable,
        modal: config?.modal,
        title: config?.title,
        webPreferences: {
            sandbox: false,
            devTools: false,
        },
    });
    if (consumer) {
        consumer(window);
    }
    if (config?.cookie) {
        window.webContents.session.cookies
            .set(config.cookie)
            .then(() => window.loadURL(config?.url ?? DEFAULT_URL))
            .catch((error) => log.error(error));
    } else {
        window.loadURL(config?.url ?? DEFAULT_URL);
    }

    window.on('ready-to-show', () => {
        if (!window) {
            throw new Error('"secondWindow" is not defined');
        }
        if (config?.showAfterCreate ?? true) {
            window.show();
        }
        if (config?.title) {
            window.setTitle(config.title);
        }
    });

    if (consumer) {
        window.on('closed', () => {
            consumer(null);
        });
    }

    if (config?.menu) {
        const menuBuilder = new MenuBuilder(window);
        menuBuilder.buildMenu();
    } else {
        window.setMenu(null);
    }
    return window;
};

export function openBrowser(mainWindow: BrowserWindow | null, url: string) {
    createBrowser(
        mainWindow,
        {
            url,
        },
        (window) => {
            browserWindow = window;
        }
    );
}

/**
 * Applies login logic to the web content, fills the form with the given credentials
 *
 * @param contents Web content containing the login form
 * @param credential Credentials given by the used
 */
function applyLogin(
    contents: WebContents,
    credential: CredentialData
): Promise<string> {
    return contents.executeJavaScript(
        `document.querySelector("#username").value="${credential.username}";` +
            `document.querySelector("#password").value="${credential.password}";` +
            'document.querySelector("#loginbtn").click();',
        true
    );
}

/**
 * Adds events listener to the window that handle the events that are used for handling the login.
 *
 * @param resolve Resolves the overlaying promise, used if the log in fails
 * @param reject Retrieves the cookie, if the login was successfully
 * @param window Window that contains the login
 */
function addLoginListeners(
    resolve: (value: string | undefined) => void,
    reject: () => void,
    window: BrowserWindow
) {
    const contents = window.webContents;
    contents.on('new-window', (event) => {
        event.preventDefault();
        reject();
    });
    // If the credentials are correct the browser will try to navigate the dashboard we use this behaviour to
    // intercept the cookie
    contents.on('will-navigate', async () => {
        if (!window) {
            return;
        }
        const cookies = await contents.session.cookies.get({
            name: COOKIE_MOODLE_SESSION_NAME,
        });
        window.close();
        resolve(cookies.length > 0 ? cookies[0].value : undefined);
    });
}

/**
 * Creates invisible background browser, that automatically enters the given credentials and retrieves the session
 * cookie from the header content.
 *
 * @param mainWindow Main browser / window
 * @param credential Credentials entered by the user
 */
export function tryFetchCookie(
    mainWindow: BrowserWindow | null,
    credential: CredentialData
): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
        const window = createBrowser(mainWindow, {
            url: URL_LOGIN_INDEX,
            width: 325,
            height: 450,
            fullscreenable: false,
            resizable: false,
            modal: true,
            title: 'Moodle Login',
            showAfterCreate: false,
        });
        // Enter credentials and click the login button
        applyLogin(window.webContents, credential).catch((e) => {
            reject(e);
        });
        addLoginListeners(resolve, reject, window);
    });
}

export function verifyMoodleLogin(
    mainWindow: BrowserWindow | null,
    credential: CredentialData,
    cookie: string,
    tryRevalidate?: boolean
): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
        const window = createBrowser(mainWindow, {
            url: URL_LOGIN_INDEX,
            width: 325,
            height: 450,
            fullscreenable: false,
            resizable: false,
            modal: true,
            title: 'Moodle Login',
            showAfterCreate: true,
            cookie: {
                url: DEFAULT_URL,
                name: COOKIE_MOODLE_SESSION_NAME,
                value: cookie,
            },
        });
        // Try to find login form, if we don't find it we are already logged in, and the cookie is valid, if not we try
        // to log in with the saved credentials, if this fails, the credentials are no longer valid
        window.webContents
            .executeJavaScript(`document.querySelector("#login") == null`)
            .then((v) => {
                return !!v;
            })
            .then((valid) => {
                if (!valid && tryRevalidate) {
                    return applyLogin(window.webContents, credential);
                }
                resolve(cookie);
                window.close();
                return null;
            })
            .catch((e) => {
                reject(e);
            });
        addLoginListeners(resolve, reject, window);
    });
}
// Keytar
// https://www.pluralsight.com/guides/how-to-router-redirect-after-login

/**
 * Opens a moodle login modal in front of the main window.
 *
 * @param mainWindow Main browser / window
 */
export function openLogin(mainWindow: BrowserWindow | null) {
    loginWindow = createBrowser(
        mainWindow,
        {
            url: URL_LOGIN_INDEX,
            width: 325,
            height: 450,
            fullscreenable: false,
            resizable: false,
            modal: true,
            title: 'Moodle Login',
            showAfterCreate: true,
        },
        (window) => {
            loginWindow = window;
        }
    );
}
