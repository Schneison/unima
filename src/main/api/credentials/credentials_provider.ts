import { safeStorage } from 'electron';
import Store from 'electron-store';
/**
 * Internal store for saving credentials in a file
 */
const store = new Store({
    name: 'umasy_credentials',
    encryptionKey: 'obi_wan',
});

/**
 * Provides and stores credential data from last session
 */
export interface CredentialHandler {
    /**
     * Returns cookie from last session
     */
    getToken: () => Promise<string>;
    /**
     * Stores token
     *
     * @param token Token from last session
     */
    setToken: (token: string | undefined) => void;
    getCookie: () => Promise<string>;
    setCookie: (cookie: string | undefined) => void;
    getCredentials: () => Promise<CredentialData>;
    setCredentials: (data: CredentialData) => void;
}

export default class StoreProvider implements CredentialHandler {
    getToken = async (): Promise<string> => store.get('token') as string;

    setToken = (token: string | undefined): void => store.set('token', token);

    getCookie = async (): Promise<string> => store.get('cookie') as string;

    setCookie = (cookie: string | undefined): void =>
        store.set('cookie', cookie);

    getCredentials = async (): Promise<CredentialData> => {
        const name = store.get('username') as string;
        const password = store.get('password') as string;
        if (safeStorage.isEncryptionAvailable()) {
            name.toString();
        }
        return {
            username: safeStorage.decryptString(Buffer.from(name, 'latin1')),
            password: safeStorage.decryptString(
                Buffer.from(password, 'latin1')
            ),
        };
    };

    setCredentials = (data: CredentialData) => {
        store.set(
            'username',
            safeStorage.encryptString(data.username).toString('latin1')
        );
        store.set(
            'password',
            safeStorage.encryptString(data.password).toString('latin1')
        );
    };
}
