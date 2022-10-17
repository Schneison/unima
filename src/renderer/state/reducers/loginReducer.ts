import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Slice } from '@reduxjs/toolkit/dist/createSlice';
import MessageBroker from '../../bridge/MessageBroker';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

export interface LoginState {
    /**
     * Status of the login process that is currently in process,
     * if the button was pressed
     */
    loginStatus: AsyncStatus;
    /**
     * Error message of the login button.
     */
    error: string | undefined;
    checkStatus: AsyncStatus;
    didCheck: boolean;
    checkError: string | undefined;
    /**
     * Certification data
     */
    certification: CredentialInfo;
}

const initialState = {
    loginStatus: 'idle',
    checkStatus: 'idle',
    didCheck: false,
    certification: {
        verified: false,
        cookieValid: false,
        loginPresent: false,
    },
} as LoginState;

const select = (state: RootState): LoginState => state.login;

export const selectCredential = (state: RootState): CredentialInfo =>
    select(state).certification;

export const isLoginInProgress = (state: RootState): boolean =>
    select(state).loginStatus === 'loading';

export const canDoCheck = (state: RootState): boolean =>
    select(state).checkStatus === 'idle' && !select(state).didCheck;

export const tryLogin = createAsyncThunk<CredentialInfo, CredentialData>(
    'login/tryLogin',
    async (data: CredentialData) => MessageBroker.tryLogin(data)
);

export const checkLogin = createAsyncThunk<CredentialInfo>(
    'login/checkLogin',
    async () => MessageBroker.checkLogin()
);

const slice: Slice<LoginState> = createSlice({
    name: 'login',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder
            .addCase(tryLogin.pending, (state) => {
                state.loginStatus = 'loading';
            })
            .addCase(tryLogin.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';

                state.certification = action.payload;
            })
            .addCase(tryLogin.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            });
        builder
            .addCase(checkLogin.pending, (state) => {
                state.checkStatus = 'loading';
            })
            .addCase(checkLogin.fulfilled, (state, action) => {
                state.checkStatus = 'succeeded';
                state.didCheck = true;
                state.certification = action.payload;
            })
            .addCase(checkLogin.rejected, (state, action) => {
                state.checkStatus = 'failed';
                state.checkError = action.error.message;
            });
    },
});

export default slice.reducer;
